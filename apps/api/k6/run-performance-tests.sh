#!/bin/bash

# Performance Testing Script for Zeke Dashboard
# Runs k6 tests for bootstrap and chat endpoints per PRD requirements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Zeke Dashboard Performance Testing Suite${NC}"
echo "========================================"

# Configuration
API_URL=${API_URL:-"http://localhost:3001"}
AUTH_TOKEN=${AUTH_TOKEN:-"test-jwt-token"}
OUTPUT_DIR="./performance-reports"

# Create output directory
mkdir -p $OUTPUT_DIR

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}k6 is not installed. Please install it first:${NC}"
    echo "brew install k6 (on macOS)"
    echo "or visit: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if API is running
if ! curl -f -s "${API_URL}/health" > /dev/null; then
    echo -e "${YELLOW}Warning: API at ${API_URL} is not responding${NC}"
    echo "Please ensure the API server is running"
    exit 1
fi

echo -e "\n${GREEN}Test Configuration:${NC}"
echo "API URL: $API_URL"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# Function to run a test and check results
run_test() {
    local test_name=$1
    local test_file=$2
    local output_file="${OUTPUT_DIR}/${test_name}-$(date +%Y%m%d-%H%M%S)"
    
    echo -e "\n${GREEN}Running: ${test_name}${NC}"
    echo "----------------------------------------"
    
    # Run k6 test
    if k6 run \
        --out json="${output_file}.json" \
        --summary-export="${output_file}-summary.json" \
        -e API_URL="${API_URL}" \
        -e AUTH_TOKEN="${AUTH_TOKEN}" \
        "${test_file}" 2>&1 | tee "${output_file}.log"; then
        
        echo -e "${GREEN}✓ ${test_name} completed successfully${NC}"
        
        # Parse and display key metrics
        if [ -f "${output_file}-summary.json" ]; then
            echo -e "\n${GREEN}Key Metrics:${NC}"
            
            # Extract metrics using jq if available
            if command -v jq &> /dev/null; then
                # Bootstrap specific metrics
                if [[ "$test_name" == "Bootstrap Performance" ]]; then
                    P50=$(jq -r '.metrics.bootstrap_duration.values."p(50)"' "${output_file}-summary.json" 2>/dev/null || echo "N/A")
                    P95=$(jq -r '.metrics.bootstrap_duration.values."p(95)"' "${output_file}-summary.json" 2>/dev/null || echo "N/A")
                    ERROR_RATE=$(jq -r '.metrics.http_req_failed.values.rate' "${output_file}-summary.json" 2>/dev/null || echo "N/A")
                    
                    echo "  Bootstrap P50: ${P50}ms (Target: <300ms)"
                    echo "  Bootstrap P95: ${P95}ms (Target: <500ms)"
                    echo "  Error Rate: $(echo "scale=2; ${ERROR_RATE} * 100" | bc)% (Target: <1%)"
                fi
                
                # Chat streaming specific metrics
                if [[ "$test_name" == "Chat Streaming Performance" ]]; then
                    START_P95=$(jq -r '.metrics.chat_start_time.values."p(95)"' "${output_file}-summary.json" 2>/dev/null || echo "N/A")
                    CHUNK_P95=$(jq -r '.metrics.chunk_latency.values."p(95)"' "${output_file}-summary.json" 2>/dev/null || echo "N/A")
                    FAILURE_RATE=$(jq -r '.metrics.http_req_failed.values.rate' "${output_file}-summary.json" 2>/dev/null || echo "N/A")
                    
                    echo "  Chat Start P95: $(echo "scale=2; ${START_P95} / 1000" | bc)s (Target: ≤2s)"
                    echo "  Chunk Latency P95: ${CHUNK_P95}ms (Target: <200ms)"
                    echo "  Failure Rate: $(echo "scale=3; ${FAILURE_RATE} * 100" | bc)% (Target: <0.5%)"
                fi
            fi
        fi
        
        return 0
    else
        echo -e "${RED}✗ ${test_name} failed${NC}"
        return 1
    fi
}

# Run tests
BOOTSTRAP_PASSED=false
CHAT_PASSED=false

# Test 1: Bootstrap Performance
if run_test "Bootstrap Performance" "./bootstrap-performance.js"; then
    BOOTSTRAP_PASSED=true
fi

# Test 2: Chat Streaming Performance
if run_test "Chat Streaming Performance" "./chat-streaming-performance.js"; then
    CHAT_PASSED=true
fi

# Generate combined report
echo -e "\n${GREEN}Generating Combined Report...${NC}"
cat > "${OUTPUT_DIR}/performance-summary.md" << EOF
# Zeke Dashboard Performance Test Results

Date: $(date)
API URL: ${API_URL}

## Test Results Summary

| Test | Status | PRD Compliance |
|------|--------|----------------|
| Bootstrap Performance | $(if $BOOTSTRAP_PASSED; then echo '✓ Passed'; else echo '✗ Failed'; fi) | $(if $BOOTSTRAP_PASSED; then echo 'Met requirements'; else echo 'Failed to meet requirements'; fi) |
| Chat Streaming | $(if $CHAT_PASSED; then echo '✓ Passed'; else echo '✗ Failed'; fi) | $(if $CHAT_PASSED; then echo 'Met requirements'; else echo 'Failed to meet requirements'; fi) |

## PRD Performance Requirements

- **SSR Bootstrap P95**: < 500ms
- **Chat Start Time**: ≤ 2s
- **Chunk Latency**: < 200ms
- **Bootstrap Error Rate**: < 1%
- **Chat Failure Rate**: < 0.5%

## Detailed Results

See individual test reports in: ${OUTPUT_DIR}
EOF

echo -e "\n${GREEN}Performance Testing Complete!${NC}"
echo "========================================"
echo "Summary report: ${OUTPUT_DIR}/performance-summary.md"
echo "Individual reports: ${OUTPUT_DIR}/"

# Exit with appropriate code
if $BOOTSTRAP_PASSED && $CHAT_PASSED; then
    echo -e "\n${GREEN}All performance requirements met! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some performance requirements not met ✗${NC}"
    echo "Please review the reports for details"
    exit 1
fi