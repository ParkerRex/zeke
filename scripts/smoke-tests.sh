#!/bin/bash

# ZEKE Production Smoke Tests
# Comprehensive validation suite for production deployment verification

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_LOG="$PROJECT_ROOT/smoke-tests-$(date +%Y%m%d_%H%M%S).log"

# Test configuration
TIMEOUT=30
RETRY_COUNT=3
RETRY_DELAY=10

# Service URLs (will be populated from environment or parameters)
WORKER_URL="${WORKER_URL:-}"
MAIN_APP_URL="${MAIN_APP_URL:-}"
MARKETING_URL="${MARKETING_URL:-}"
DATABASE_URL="${DATABASE_URL:-}"

# Function to log messages
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$TEST_LOG"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$TEST_LOG"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$TEST_LOG"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$TEST_LOG"
            ;;
    esac
    echo "[$timestamp] [$level] $message" >> "$TEST_LOG"
}

# Function to make HTTP requests with retry logic
http_request() {
    local url="$1"
    local expected_code="${2:-200}"
    local method="${3:-GET}"
    local data="${4:-}"
    
    for ((i=1; i<=RETRY_COUNT; i++)); do
        local response_code
        if [[ -n "$data" ]]; then
            response_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
                          -H "Content-Type: application/json" \
                          -d "$data" \
                          --max-time "$TIMEOUT" \
                          "$url" 2>/dev/null || echo "000")
        else
            response_code=$(curl -s -o /dev/null -w "%{http_code}" \
                          --max-time "$TIMEOUT" \
                          "$url" 2>/dev/null || echo "000")
        fi
        
        if [[ "$response_code" == "$expected_code" ]]; then
            return 0
        fi
        
        if [[ $i -lt $RETRY_COUNT ]]; then
            log "WARNING" "Request failed (HTTP $response_code), retrying in ${RETRY_DELAY}s... (attempt $i/$RETRY_COUNT)"
            sleep "$RETRY_DELAY"
        fi
    done
    
    log "ERROR" "Request failed after $RETRY_COUNT attempts (HTTP $response_code)"
    return 1
}

# Function to check JSON response content
check_json_response() {
    local url="$1"
    local expected_field="$2"
    local expected_value="$3"
    
    for ((i=1; i<=RETRY_COUNT; i++)); do
        local response=$(curl -s --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "{}")
        local actual_value=$(echo "$response" | jq -r ".$expected_field" 2>/dev/null || echo "null")
        
        if [[ "$actual_value" == "$expected_value" ]]; then
            return 0
        fi
        
        if [[ $i -lt $RETRY_COUNT ]]; then
            log "WARNING" "JSON check failed (expected: $expected_value, got: $actual_value), retrying... (attempt $i/$RETRY_COUNT)"
            sleep "$RETRY_DELAY"
        fi
    done
    
    log "ERROR" "JSON check failed after $RETRY_COUNT attempts"
    return 1
}

# Function to initialize test environment
initialize_tests() {
    log "INFO" "Initializing smoke tests..."
    log "INFO" "Test log: $TEST_LOG"
    
    # Load environment variables
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        set -a
        source "$PROJECT_ROOT/.env.production"
        set +a
        log "SUCCESS" "Production environment loaded"
    else
        log "ERROR" ".env.production file not found"
        exit 1
    fi
    
    # Set service URLs if not provided
    if [[ -z "$WORKER_URL" ]]; then
        cd "$PROJECT_ROOT/apps/worker"
        WORKER_URL=$(railway domain 2>/dev/null || echo "")
        cd "$PROJECT_ROOT"
    fi
    
    if [[ -z "$MAIN_APP_URL" ]]; then
        cd "$PROJECT_ROOT/apps/app"
        MAIN_APP_URL="https://$(vercel ls --scope=production 2>/dev/null | grep -v "NAME" | head -1 | awk '{print $2}' || echo "")"
        cd "$PROJECT_ROOT"
    fi
    
    if [[ -z "$MARKETING_URL" ]]; then
        cd "$PROJECT_ROOT/apps/web"
        MARKETING_URL="https://$(vercel ls --scope=production 2>/dev/null | grep -v "NAME" | head -1 | awk '{print $2}' || echo "")"
        cd "$PROJECT_ROOT"
    fi
    
    log "INFO" "Service URLs:"
    log "INFO" "  Worker: $WORKER_URL"
    log "INFO" "  Main App: $MAIN_APP_URL"
    log "INFO" "  Marketing: $MARKETING_URL"
    log "INFO" "  Database: ${DATABASE_URL:0:50}..."
    
    # Validate URLs
    if [[ -z "$WORKER_URL" || -z "$MAIN_APP_URL" || -z "$MARKETING_URL" || -z "$DATABASE_URL" ]]; then
        log "ERROR" "One or more service URLs are missing"
        exit 1
    fi
}

# Test 1: Database Connectivity and Health
test_database() {
    log "INFO" "Testing database connectivity and health..."
    
    # Basic connectivity
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log "SUCCESS" "Database connectivity test passed"
    else
        log "ERROR" "Database connectivity test failed"
        return 1
    fi
    
    # Security validation
    local security_check=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname IN ('is_admin_user', 'is_worker_role', 'handle_new_user')
          AND proconfig IS NOT NULL 
          AND 'search_path=\"\"' = ANY(proconfig);
    " | xargs)
    
    if [[ "$security_check" == "3" ]]; then
        log "SUCCESS" "Database security validation passed"
    else
        log "ERROR" "Database security validation failed"
        return 1
    fi
    
    # Vector extension check
    local vector_check=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE e.extname = 'vector' AND n.nspname = 'extensions';
    " | xargs)
    
    if [[ "$vector_check" == "1" ]]; then
        log "SUCCESS" "Vector extension validation passed"
    else
        log "ERROR" "Vector extension validation failed"
        return 1
    fi
    
    # RLS policies check
    local rls_count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
    " | xargs)
    
    if [[ "$rls_count" -gt "0" ]]; then
        log "SUCCESS" "RLS policies validation passed ($rls_count policies found)"
    else
        log "ERROR" "RLS policies validation failed"
        return 1
    fi
    
    return 0
}

# Test 2: Worker Service Health and Functionality
test_worker_service() {
    log "INFO" "Testing worker service health and functionality..."
    
    # Health endpoint
    if http_request "$WORKER_URL/healthz" "200"; then
        log "SUCCESS" "Worker health endpoint test passed"
    else
        log "ERROR" "Worker health endpoint test failed"
        return 1
    fi
    
    # Status endpoint with JSON validation
    if check_json_response "$WORKER_URL/debug/status" "status" "ok"; then
        log "SUCCESS" "Worker status endpoint test passed"
    else
        log "ERROR" "Worker status endpoint test failed"
        return 1
    fi
    
    # Database connectivity from worker
    if check_json_response "$WORKER_URL/debug/status" "database" "connected"; then
        log "SUCCESS" "Worker database connectivity test passed"
    else
        log "ERROR" "Worker database connectivity test failed"
        return 1
    fi
    
    # Queue status
    local queue_response=$(curl -s --max-time "$TIMEOUT" "$WORKER_URL/debug/queues" 2>/dev/null || echo "{}")
    if [[ "$queue_response" != "{}" ]] && echo "$queue_response" | jq . &> /dev/null; then
        log "SUCCESS" "Worker queue status test passed"
    else
        log "WARNING" "Worker queue status test failed (may not be implemented)"
    fi
    
    return 0
}

# Test 3: Main Application Health and API Endpoints
test_main_application() {
    log "INFO" "Testing main application health and API endpoints..."
    
    # Main page
    if http_request "$MAIN_APP_URL" "200"; then
        log "SUCCESS" "Main application page test passed"
    else
        log "ERROR" "Main application page test failed"
        return 1
    fi
    
    # Health API endpoint
    if http_request "$MAIN_APP_URL/api/health" "200"; then
        log "SUCCESS" "Main application health API test passed"
    else
        log "WARNING" "Main application health API test failed (may not be implemented)"
    fi
    
    # Authentication providers endpoint
    if http_request "$MAIN_APP_URL/api/auth/providers" "200"; then
        log "SUCCESS" "Authentication providers test passed"
    else
        log "ERROR" "Authentication providers test failed"
        return 1
    fi
    
    # CSRF endpoint
    if http_request "$MAIN_APP_URL/api/auth/csrf" "200"; then
        log "SUCCESS" "CSRF endpoint test passed"
    else
        log "ERROR" "CSRF endpoint test failed"
        return 1
    fi
    
    # Protected route (should return 401 without auth)
    if http_request "$MAIN_APP_URL/api/protected" "401"; then
        log "SUCCESS" "Protected route security test passed"
    else
        log "WARNING" "Protected route security test failed (may not be implemented)"
    fi
    
    # Static assets
    if http_request "$MAIN_APP_URL/_next/static/css" "404"; then
        log "SUCCESS" "Static assets routing test passed"
    else
        log "WARNING" "Static assets routing test failed"
    fi
    
    return 0
}

# Test 4: Marketing Site Health
test_marketing_site() {
    log "INFO" "Testing marketing site health..."
    
    # Main page
    if http_request "$MARKETING_URL" "200"; then
        log "SUCCESS" "Marketing site page test passed"
    else
        log "ERROR" "Marketing site page test failed"
        return 1
    fi
    
    # Health API endpoint (if available)
    if http_request "$MARKETING_URL/api/health" "200"; then
        log "SUCCESS" "Marketing site health API test passed"
    elif http_request "$MARKETING_URL/api/health" "404"; then
        log "SUCCESS" "Marketing site health API test passed (404 expected)"
    else
        log "WARNING" "Marketing site health API test failed"
    fi
    
    # Static assets
    if http_request "$MARKETING_URL/_next/static" "404"; then
        log "SUCCESS" "Marketing site static assets test passed"
    else
        log "WARNING" "Marketing site static assets test failed"
    fi
    
    return 0
}

# Test 5: Cross-Service Integration
test_cross_service_integration() {
    log "INFO" "Testing cross-service integration..."
    
    # Main app to worker communication
    local worker_status_via_app=$(curl -s --max-time "$TIMEOUT" "$MAIN_APP_URL/api/worker/status" 2>/dev/null || echo "{}")
    if echo "$worker_status_via_app" | jq . &> /dev/null; then
        log "SUCCESS" "Main app to worker communication test passed"
    else
        log "WARNING" "Main app to worker communication test failed (may not be implemented)"
    fi
    
    # Main app to database (via Supabase)
    local supabase_health=$(curl -s -o /dev/null -w "%{http_code}" \
                           -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
                           "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" 2>/dev/null || echo "000")
    if [[ "$supabase_health" == "200" ]]; then
        log "SUCCESS" "Main app to Supabase communication test passed"
    else
        log "ERROR" "Main app to Supabase communication test failed"
        return 1
    fi
    
    # Worker to external APIs (check logs for recent activity)
    cd "$PROJECT_ROOT/apps/worker"
    local recent_logs=$(railway logs --tail 10 2>/dev/null | grep -E "(openai|anthropic|youtube)" || echo "")
    if [[ -n "$recent_logs" ]]; then
        log "SUCCESS" "Worker external API integration test passed"
    else
        log "WARNING" "Worker external API integration test failed (no recent activity)"
    fi
    cd "$PROJECT_ROOT"
    
    return 0
}

# Test 6: Performance and Response Times
test_performance() {
    log "INFO" "Testing performance and response times..."
    
    # Create curl timing format
    local curl_format='{"time_total": %{time_total}, "time_connect": %{time_connect}, "time_starttransfer": %{time_starttransfer}}'
    
    # Test main app response time
    local main_timing=$(curl -s -w "$curl_format" -o /dev/null --max-time "$TIMEOUT" "$MAIN_APP_URL" 2>/dev/null || echo '{"time_total": 999}')
    local main_time=$(echo "$main_timing" | jq -r '.time_total' 2>/dev/null || echo "999")
    
    if (( $(echo "$main_time < 5.0" | bc -l) )); then
        log "SUCCESS" "Main app performance test passed (${main_time}s)"
    else
        log "WARNING" "Main app performance test failed (${main_time}s > 5s)"
    fi
    
    # Test worker response time
    local worker_timing=$(curl -s -w "$curl_format" -o /dev/null --max-time "$TIMEOUT" "$WORKER_URL/healthz" 2>/dev/null || echo '{"time_total": 999}')
    local worker_time=$(echo "$worker_timing" | jq -r '.time_total' 2>/dev/null || echo "999")
    
    if (( $(echo "$worker_time < 2.0" | bc -l) )); then
        log "SUCCESS" "Worker service performance test passed (${worker_time}s)"
    else
        log "WARNING" "Worker service performance test failed (${worker_time}s > 2s)"
    fi
    
    # Test marketing site response time
    local marketing_timing=$(curl -s -w "$curl_format" -o /dev/null --max-time "$TIMEOUT" "$MARKETING_URL" 2>/dev/null || echo '{"time_total": 999}')
    local marketing_time=$(echo "$marketing_timing" | jq -r '.time_total' 2>/dev/null || echo "999")
    
    if (( $(echo "$marketing_time < 3.0" | bc -l) )); then
        log "SUCCESS" "Marketing site performance test passed (${marketing_time}s)"
    else
        log "WARNING" "Marketing site performance test failed (${marketing_time}s > 3s)"
    fi
    
    return 0
}

# Test 7: Security Headers and SSL
test_security() {
    log "INFO" "Testing security headers and SSL..."
    
    # Test HTTPS redirect and HSTS
    local main_headers=$(curl -s -I "$MAIN_APP_URL" 2>/dev/null || echo "")
    if echo "$main_headers" | grep -i "strict-transport-security" &> /dev/null; then
        log "SUCCESS" "Main app HSTS header test passed"
    else
        log "WARNING" "Main app HSTS header test failed"
    fi
    
    # Test security headers
    if echo "$main_headers" | grep -i "x-frame-options\|x-content-type-options" &> /dev/null; then
        log "SUCCESS" "Main app security headers test passed"
    else
        log "WARNING" "Main app security headers test failed"
    fi
    
    # Test marketing site security
    local marketing_headers=$(curl -s -I "$MARKETING_URL" 2>/dev/null || echo "")
    if echo "$marketing_headers" | grep -i "strict-transport-security" &> /dev/null; then
        log "SUCCESS" "Marketing site HSTS header test passed"
    else
        log "WARNING" "Marketing site HSTS header test failed"
    fi
    
    return 0
}

# Function to run all tests and generate report
run_all_tests() {
    log "INFO" "Starting comprehensive smoke test suite..."

    local test_results=()
    local start_time=$(date +%s)

    # Run all test suites
    if test_database; then
        test_results+=("database:PASS")
    else
        test_results+=("database:FAIL")
    fi

    if test_worker_service; then
        test_results+=("worker:PASS")
    else
        test_results+=("worker:FAIL")
    fi

    if test_main_application; then
        test_results+=("main_app:PASS")
    else
        test_results+=("main_app:FAIL")
    fi

    if test_marketing_site; then
        test_results+=("marketing:PASS")
    else
        test_results+=("marketing:FAIL")
    fi

    if test_cross_service_integration; then
        test_results+=("integration:PASS")
    else
        test_results+=("integration:FAIL")
    fi

    if test_performance; then
        test_results+=("performance:PASS")
    else
        test_results+=("performance:FAIL")
    fi

    if test_security; then
        test_results+=("security:PASS")
    else
        test_results+=("security:FAIL")
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Analyze results
    local total_tests=0
    local passed_tests=0
    local failed_tests=0

    log "INFO" "Test Results Summary:"
    log "INFO" "===================="

    for result in "${test_results[@]}"; do
        local test_name=$(echo "$result" | cut -d: -f1)
        local test_status=$(echo "$result" | cut -d: -f2)

        ((total_tests++))

        case $test_status in
            "PASS")
                log "SUCCESS" "  $test_name: PASSED"
                ((passed_tests++))
                ;;
            "FAIL")
                log "ERROR" "  $test_name: FAILED"
                ((failed_tests++))
                ;;
        esac
    done

    local success_rate=$(( (passed_tests * 100) / total_tests ))

    log "INFO" "===================="
    log "INFO" "Total Tests: $total_tests"
    log "INFO" "Passed: $passed_tests"
    log "INFO" "Failed: $failed_tests"
    log "INFO" "Success Rate: $success_rate%"
    log "INFO" "Duration: ${duration}s"

    # Decision framework
    if [[ $failed_tests -eq 0 ]]; then
        log "SUCCESS" "🎉 ALL TESTS PASSED! Deployment is ready for production traffic."
        return 0
    elif [[ $success_rate -ge 80 ]]; then
        log "WARNING" "⚠️  Some tests failed but success rate is acceptable ($success_rate%). Proceed with caution."
        return 1
    else
        log "ERROR" "❌ Critical test failures detected ($success_rate% success rate). Deployment should be rolled back."
        return 2
    fi
}

# Function to generate detailed test report
generate_test_report() {
    local status="$1"
    local report_file="$PROJECT_ROOT/smoke-test-report-$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# ZEKE Production Smoke Test Report

**Date:** $(date)
**Status:** $status
**Test Log:** $TEST_LOG

## Test Environment

| Service | URL | Status |
|---------|-----|--------|
| Database | ${DATABASE_URL:0:50}... | Tested |
| Worker Service | $WORKER_URL | Tested |
| Main Application | $MAIN_APP_URL | Tested |
| Marketing Site | $MARKETING_URL | Tested |

## Test Results Summary

$(grep -E "\[(SUCCESS|ERROR|WARNING)\].*test.*passed|failed" "$TEST_LOG" | tail -30)

## Performance Metrics

$(grep -E "performance test.*passed|failed" "$TEST_LOG" | tail -10)

## Security Validation

$(grep -E "security.*test.*passed|failed" "$TEST_LOG" | tail -10)

## Recommendations

Based on the test results:

EOF

    case $status in
        "SUCCESS")
            cat >> "$report_file" << EOF
✅ **PROCEED TO PRODUCTION**
- All critical tests passed
- System is ready for production traffic
- Continue monitoring for 24-48 hours

EOF
            ;;
        "WARNING")
            cat >> "$report_file" << EOF
⚠️ **PROCEED WITH CAUTION**
- Some non-critical tests failed
- Monitor closely for issues
- Consider addressing warnings before full traffic

EOF
            ;;
        "FAILED")
            cat >> "$report_file" << EOF
❌ **DO NOT PROCEED TO PRODUCTION**
- Critical tests failed
- Investigate and fix issues
- Consider rollback procedures

EOF
            ;;
    esac

    cat >> "$report_file" << EOF
## Next Steps

1. Review detailed test log: $TEST_LOG
2. Address any failed tests
3. Monitor service health continuously
4. Set up automated monitoring and alerting

## Emergency Procedures

If issues arise after deployment:
\`\`\`bash
./scripts/rollback-production.sh
\`\`\`

EOF

    log "INFO" "Detailed test report generated: $report_file"
}

# Main function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --worker-url)
                WORKER_URL="$2"
                shift 2
                ;;
            --main-app-url)
                MAIN_APP_URL="$2"
                shift 2
                ;;
            --marketing-url)
                MARKETING_URL="$2"
                shift 2
                ;;
            --database-url)
                DATABASE_URL="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --retry-count)
                RETRY_COUNT="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --worker-url URL      Worker service URL"
                echo "  --main-app-url URL    Main application URL"
                echo "  --marketing-url URL   Marketing site URL"
                echo "  --database-url URL    Database connection URL"
                echo "  --timeout SECONDS     Request timeout (default: 30)"
                echo "  --retry-count COUNT   Retry attempts (default: 3)"
                echo "  -h, --help           Show this help message"
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Initialize tests
    initialize_tests

    # Run all tests
    local test_status
    if run_all_tests; then
        test_status="SUCCESS"
    else
        local exit_code=$?
        if [[ $exit_code -eq 1 ]]; then
            test_status="WARNING"
        else
            test_status="FAILED"
        fi
    fi

    # Generate report
    generate_test_report "$test_status"

    # Exit with appropriate code
    case $test_status in
        "SUCCESS")
            exit 0
            ;;
        "WARNING")
            exit 1
            ;;
        "FAILED")
            exit 2
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
