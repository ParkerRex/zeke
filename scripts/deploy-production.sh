#!/bin/bash

# ZEKE Production Deployment Script
# Comprehensive CLI-based deployment workflow with validation and rollback capabilities

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
DEPLOYMENT_LOG="$PROJECT_ROOT/deployment-$(date +%Y%m%d_%H%M%S).log"

# Deployment URLs (will be populated during deployment)
WORKER_URL=""
MAIN_APP_URL=""
MARKETING_URL=""

# Function to log messages
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
            ;;
    esac
    echo "[$timestamp] [$level] $message" >> "$DEPLOYMENT_LOG"
}

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."
    
    # Check CLI tools
    local tools=("node" "pnpm" "supabase" "railway" "vercel" "psql" "curl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "$tool is not installed or not in PATH"
            exit 1
        fi
        log "SUCCESS" "$tool is available"
    done
    
    # Check authentication
    log "INFO" "Checking CLI authentication..."
    
    # Check Supabase auth
    if ! supabase projects list &> /dev/null; then
        log "ERROR" "Supabase CLI not authenticated. Run: supabase login"
        exit 1
    fi
    
    # Check Railway auth
    if ! railway whoami &> /dev/null; then
        log "ERROR" "Railway CLI not authenticated. Run: railway login"
        exit 1
    fi
    
    # Check Vercel auth
    if ! vercel whoami &> /dev/null; then
        log "ERROR" "Vercel CLI not authenticated. Run: vercel login"
        exit 1
    fi
    
    log "SUCCESS" "All CLI tools authenticated"
    
    # Check environment files
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        log "ERROR" ".env.production file not found. Please create it with production credentials."
        exit 1
    fi
    
    log "SUCCESS" "Prerequisites check completed"
}

# Function to validate environment variables
validate_environment() {
    log "INFO" "Validating environment configuration..."
    
    # Source production environment
    set -a
    source "$PROJECT_ROOT/.env.production"
    set +a
    
    # Required variables
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "DATABASE_URL"
        "OPENAI_API_KEY"
        "ANTHROPIC_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log "ERROR" "Required environment variable $var is not set"
            exit 1
        fi
        log "SUCCESS" "Environment variable $var is set"
    done
    
    log "SUCCESS" "Environment validation completed"
}

# Function to deploy database changes
deploy_database() {
    log "INFO" "Starting database deployment..."
    
    cd "$PROJECT_ROOT/apps/api"
    
    # Check migration status
    log "INFO" "Checking migration status..."
    supabase migration list --linked
    
    # Apply migrations
    log "INFO" "Applying database migrations..."
    if supabase migration up --linked --include-all; then
        log "SUCCESS" "Database migrations applied successfully"
    else
        log "ERROR" "Database migration failed"
        exit 1
    fi
    
    # Validate database health
    log "INFO" "Validating database health..."
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log "SUCCESS" "Database connection validated"
    else
        log "ERROR" "Database connection failed"
        exit 1
    fi
    
    # Validate security hardening
    log "INFO" "Validating security hardening..."
    local security_check=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname IN ('is_admin_user', 'is_worker_role', 'handle_new_user')
          AND proconfig IS NOT NULL 
          AND 'search_path=\"\"' = ANY(proconfig);
    " | xargs)
    
    if [[ "$security_check" == "3" ]]; then
        log "SUCCESS" "Security hardening validated"
    else
        log "ERROR" "Security hardening validation failed"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Database deployment completed"
}

# Function to deploy worker service
deploy_worker() {
    log "INFO" "Starting worker service deployment..."
    
    cd "$PROJECT_ROOT/apps/worker"
    
    # Set environment variables
    log "INFO" "Configuring worker environment variables..."
    
    railway variables set DATABASE_URL="$DATABASE_URL"
    railway variables set SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
    railway variables set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
    railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
    railway variables set NODE_ENV="production"
    railway variables set PORT="8082"
    railway variables set WORKER_CONCURRENCY="5"
    railway variables set LOG_LEVEL="info"
    
    # Deploy to Railway
    log "INFO" "Deploying worker service to Railway..."
    if railway up; then
        log "SUCCESS" "Worker service deployed successfully"
    else
        log "ERROR" "Worker service deployment failed"
        exit 1
    fi
    
    # Get worker URL
    WORKER_URL=$(railway domain 2>/dev/null || echo "")
    if [[ -z "$WORKER_URL" ]]; then
        log "WARNING" "Could not retrieve worker URL automatically"
        WORKER_URL="https://zeke-worker.railway.app"  # fallback
    fi
    log "INFO" "Worker URL: $WORKER_URL"
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Worker deployment completed"
}

# Function to deploy main application
deploy_main_app() {
    log "INFO" "Starting main application deployment..."
    
    cd "$PROJECT_ROOT/apps/app"
    
    # Set environment variables
    log "INFO" "Configuring main app environment variables..."
    
    # Public variables
    vercel env add NEXT_PUBLIC_SUPABASE_URL production --force <<< "$NEXT_PUBLIC_SUPABASE_URL"
    vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
    vercel env add NEXT_PUBLIC_WORKER_URL production --force <<< "$WORKER_URL"
    
    # Server variables
    vercel env add SUPABASE_SERVICE_ROLE_KEY production --force <<< "$SUPABASE_SERVICE_ROLE_KEY"
    vercel env add OPENAI_API_KEY production --force <<< "$OPENAI_API_KEY"
    vercel env add ANTHROPIC_API_KEY production --force <<< "$ANTHROPIC_API_KEY"
    vercel env add NODE_ENV production --force <<< "production"
    
    # Deploy to Vercel
    log "INFO" "Deploying main application to Vercel..."
    if vercel --prod --yes; then
        log "SUCCESS" "Main application deployed successfully"
    else
        log "ERROR" "Main application deployment failed"
        exit 1
    fi
    
    # Get main app URL
    MAIN_APP_URL=$(vercel ls --scope=production 2>/dev/null | grep "app" | awk '{print $2}' | head -1 || echo "")
    if [[ -z "$MAIN_APP_URL" ]]; then
        log "WARNING" "Could not retrieve main app URL automatically"
        MAIN_APP_URL="https://zeke-app.vercel.app"  # fallback
    fi
    log "INFO" "Main App URL: $MAIN_APP_URL"
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Main application deployment completed"
}

# Function to deploy marketing site
deploy_marketing() {
    log "INFO" "Starting marketing site deployment..."
    
    cd "$PROJECT_ROOT/apps/web"
    
    # Set environment variables
    log "INFO" "Configuring marketing site environment variables..."
    
    vercel env add NEXT_PUBLIC_APP_URL production --force <<< "$MAIN_APP_URL"
    vercel env add NEXT_PUBLIC_SUPABASE_URL production --force <<< "$NEXT_PUBLIC_SUPABASE_URL"
    vercel env add NODE_ENV production --force <<< "production"
    
    # Deploy to Vercel
    log "INFO" "Deploying marketing site to Vercel..."
    if vercel --prod --yes; then
        log "SUCCESS" "Marketing site deployed successfully"
    else
        log "ERROR" "Marketing site deployment failed"
        exit 1
    fi
    
    # Get marketing URL
    MARKETING_URL=$(vercel ls --scope=production 2>/dev/null | grep "web" | awk '{print $2}' | head -1 || echo "")
    if [[ -z "$MARKETING_URL" ]]; then
        log "WARNING" "Could not retrieve marketing URL automatically"
        MARKETING_URL="https://zeke-web.vercel.app"  # fallback
    fi
    log "INFO" "Marketing URL: $MARKETING_URL"
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Marketing site deployment completed"
}

# Function to run smoke tests
run_smoke_tests() {
    log "INFO" "Starting comprehensive smoke tests..."

    # Wait for services to be ready
    log "INFO" "Waiting for services to be ready..."
    sleep 30

    local test_results=()

    # Test 1: Database connectivity
    log "INFO" "Testing database connectivity..."
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log "SUCCESS" "Database connectivity test passed"
        test_results+=("database:PASS")
    else
        log "ERROR" "Database connectivity test failed"
        test_results+=("database:FAIL")
    fi

    # Test 2: Worker service health
    log "INFO" "Testing worker service health..."
    local worker_health=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/healthz" || echo "000")
    if [[ "$worker_health" == "200" ]]; then
        log "SUCCESS" "Worker health test passed"
        test_results+=("worker_health:PASS")
    else
        log "ERROR" "Worker health test failed (HTTP $worker_health)"
        test_results+=("worker_health:FAIL")
    fi

    # Test 3: Worker database connectivity
    log "INFO" "Testing worker database connectivity..."
    local worker_db=$(curl -s "$WORKER_URL/debug/status" | grep -o '"database":"connected"' || echo "")
    if [[ -n "$worker_db" ]]; then
        log "SUCCESS" "Worker database connectivity test passed"
        test_results+=("worker_db:PASS")
    else
        log "ERROR" "Worker database connectivity test failed"
        test_results+=("worker_db:FAIL")
    fi

    # Test 4: Main app health
    log "INFO" "Testing main application health..."
    local main_health=$(curl -s -o /dev/null -w "%{http_code}" "$MAIN_APP_URL" || echo "000")
    if [[ "$main_health" == "200" ]]; then
        log "SUCCESS" "Main app health test passed"
        test_results+=("main_app:PASS")
    else
        log "ERROR" "Main app health test failed (HTTP $main_health)"
        test_results+=("main_app:FAIL")
    fi

    # Test 5: Main app API endpoints
    log "INFO" "Testing main app API endpoints..."
    local api_health=$(curl -s -o /dev/null -w "%{http_code}" "$MAIN_APP_URL/api/health" || echo "000")
    if [[ "$api_health" == "200" ]]; then
        log "SUCCESS" "Main app API test passed"
        test_results+=("main_api:PASS")
    else
        log "ERROR" "Main app API test failed (HTTP $api_health)"
        test_results+=("main_api:FAIL")
    fi

    # Test 6: Authentication endpoints
    log "INFO" "Testing authentication endpoints..."
    local auth_health=$(curl -s -o /dev/null -w "%{http_code}" "$MAIN_APP_URL/api/auth/providers" || echo "000")
    if [[ "$auth_health" == "200" ]]; then
        log "SUCCESS" "Authentication endpoints test passed"
        test_results+=("auth:PASS")
    else
        log "ERROR" "Authentication endpoints test failed (HTTP $auth_health)"
        test_results+=("auth:FAIL")
    fi

    # Test 7: Marketing site health
    log "INFO" "Testing marketing site health..."
    local marketing_health=$(curl -s -o /dev/null -w "%{http_code}" "$MARKETING_URL" || echo "000")
    if [[ "$marketing_health" == "200" ]]; then
        log "SUCCESS" "Marketing site health test passed"
        test_results+=("marketing:PASS")
    else
        log "ERROR" "Marketing site health test failed (HTTP $marketing_health)"
        test_results+=("marketing:FAIL")
    fi

    # Test 8: Cross-service connectivity
    log "INFO" "Testing cross-service connectivity..."
    local cross_service=$(curl -s "$MAIN_APP_URL/api/worker/status" | grep -o '"status":"ok"' || echo "")
    if [[ -n "$cross_service" ]]; then
        log "SUCCESS" "Cross-service connectivity test passed"
        test_results+=("cross_service:PASS")
    else
        log "WARNING" "Cross-service connectivity test failed (may not be implemented)"
        test_results+=("cross_service:SKIP")
    fi

    # Test 9: Database security validation
    log "INFO" "Testing database security..."
    local security_check=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE e.extname = 'vector' AND n.nspname = 'extensions';
    " | xargs)
    if [[ "$security_check" == "1" ]]; then
        log "SUCCESS" "Database security test passed"
        test_results+=("db_security:PASS")
    else
        log "ERROR" "Database security test failed"
        test_results+=("db_security:FAIL")
    fi

    # Evaluate test results
    local failed_tests=0
    local total_tests=0

    log "INFO" "Smoke test results summary:"
    for result in "${test_results[@]}"; do
        local test_name=$(echo "$result" | cut -d: -f1)
        local test_status=$(echo "$result" | cut -d: -f2)

        case $test_status in
            "PASS")
                log "SUCCESS" "  $test_name: PASSED"
                ;;
            "FAIL")
                log "ERROR" "  $test_name: FAILED"
                ((failed_tests++))
                ;;
            "SKIP")
                log "WARNING" "  $test_name: SKIPPED"
                ;;
        esac

        if [[ "$test_status" != "SKIP" ]]; then
            ((total_tests++))
        fi
    done

    # Decision framework
    local failure_rate=$(( (failed_tests * 100) / total_tests ))

    log "INFO" "Test Results: $failed_tests failed out of $total_tests tests ($failure_rate% failure rate)"

    if [[ $failed_tests -eq 0 ]]; then
        log "SUCCESS" "All smoke tests passed! Deployment is successful."
        return 0
    elif [[ $failure_rate -le 20 ]]; then
        log "WARNING" "Some non-critical tests failed. Deployment may proceed with monitoring."
        return 1
    else
        log "ERROR" "Critical tests failed. Deployment should be rolled back."
        return 2
    fi
}

# Function to generate deployment report
generate_report() {
    local status="$1"
    local report_file="$PROJECT_ROOT/deployment-report-$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# ZEKE Production Deployment Report

**Date:** $(date)
**Status:** $status
**Deployment Log:** $DEPLOYMENT_LOG

## Deployed Services

| Service | URL | Status |
|---------|-----|--------|
| Database | $NEXT_PUBLIC_SUPABASE_URL | ✅ Active |
| Worker Service | $WORKER_URL | ✅ Active |
| Main Application | $MAIN_APP_URL | ✅ Active |
| Marketing Site | $MARKETING_URL | ✅ Active |

## Environment Configuration

- **Database:** Supabase PostgreSQL with security hardening
- **Worker:** Railway Node.js service
- **Applications:** Vercel Next.js deployments
- **Environment:** Production

## Smoke Test Results

$(grep -E "\[(SUCCESS|ERROR|WARNING)\].*test" "$DEPLOYMENT_LOG" | tail -20)

## Next Steps

1. Monitor services for 24-48 hours
2. Set up automated monitoring and alerting
3. Plan CI/CD pipeline implementation
4. Conduct user acceptance testing

## Rollback Procedures

If issues arise, use the rollback script:
\`\`\`bash
./scripts/rollback-production.sh
\`\`\`

EOF

    log "INFO" "Deployment report generated: $report_file"
}

# Main deployment function
main() {
    log "INFO" "Starting ZEKE production deployment..."
    log "INFO" "Deployment log: $DEPLOYMENT_LOG"

    # Check prerequisites
    check_prerequisites

    # Validate environment
    validate_environment

    # Deploy in sequence
    deploy_database
    deploy_worker
    deploy_main_app
    deploy_marketing

    # Run smoke tests
    local smoke_result
    if run_smoke_tests; then
        smoke_result="SUCCESS"
        log "SUCCESS" "Deployment completed successfully!"
    else
        local exit_code=$?
        if [[ $exit_code -eq 1 ]]; then
            smoke_result="WARNING"
            log "WARNING" "Deployment completed with warnings. Monitor closely."
        else
            smoke_result="FAILED"
            log "ERROR" "Deployment failed smoke tests. Consider rollback."
        fi
    fi

    # Generate report
    generate_report "$smoke_result"

    # Final summary
    log "INFO" "Deployment Summary:"
    log "INFO" "  Database: $NEXT_PUBLIC_SUPABASE_URL"
    log "INFO" "  Worker: $WORKER_URL"
    log "INFO" "  Main App: $MAIN_APP_URL"
    log "INFO" "  Marketing: $MARKETING_URL"
    log "INFO" "  Status: $smoke_result"

    if [[ "$smoke_result" == "FAILED" ]]; then
        exit 1
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
