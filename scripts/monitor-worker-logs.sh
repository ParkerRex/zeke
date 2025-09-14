#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ZEKE Worker Log Monitor${NC}"
echo -e "${YELLOW}Monitoring Supabase and Worker logs for issues...${NC}"

# Function to check if a service is running
service_running() {
    local port="$1"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to monitor logs with filtering
monitor_logs() {
    local service="$1"
    local container="$2"
    local filter="$3"
    
    echo -e "\n${BLUE}📋 Monitoring $service logs...${NC}"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container"; then
        echo -e "${GREEN}✅ $service container is running${NC}"
        
        # Monitor logs with filtering
        docker logs -f "$container" 2>&1 | while read line; do
            # Check for worker role issues
            if echo "$line" | grep -i "worker" | grep -iE "(error|fail|denied|permission|auth)" >/dev/null; then
                echo -e "${RED}🚨 WORKER ISSUE: $line${NC}"
            # Check for connection issues
            elif echo "$line" | grep -iE "(connection.*fail|timeout|refused)" >/dev/null; then
                echo -e "${YELLOW}⚠️  CONNECTION: $line${NC}"
            # Check for general errors
            elif echo "$line" | grep -iE "(error|exception|fatal)" >/dev/null; then
                echo -e "${RED}❌ ERROR: $line${NC}"
            # Show normal logs if verbose mode
            elif [[ "${VERBOSE:-}" == "true" ]]; then
                echo -e "${NC}📝 $line${NC}"
            fi
        done
    else
        echo -e "${RED}❌ $service container not found${NC}"
    fi
}

# Function to check worker role status
check_worker_role() {
    echo -e "\n${BLUE}🔍 Checking worker role status...${NC}"
    
    if service_running 54322; then
        # Check if worker role exists
        if PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -t -c "SELECT 1 FROM pg_roles WHERE rolname = 'worker';" 2>/dev/null | grep -q 1; then
            echo -e "${GREEN}✅ Worker role exists${NC}"
            
            # Test worker role connection
            if PGPASSWORD=worker_password psql "postgresql://worker:worker_password@127.0.0.1:54322/postgres" -c "SELECT current_user;" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Worker role can connect${NC}"
            else
                echo -e "${RED}❌ Worker role cannot connect${NC}"
            fi
        else
            echo -e "${RED}❌ Worker role does not exist${NC}"
            echo -e "${YELLOW}💡 Run: bash scripts/fix-worker-role.sh${NC}"
        fi
    else
        echo -e "${RED}❌ Supabase database not running${NC}"
    fi
}

# Function to check worker service status
check_worker_service() {
    echo -e "\n${BLUE}🔍 Checking worker service status...${NC}"
    
    if service_running 8082; then
        echo -e "${GREEN}✅ Worker service is running on port 8082${NC}"
        
        # Test health endpoint
        if curl -fsS http://localhost:8082/healthz >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Worker health check passed${NC}"
        else
            echo -e "${RED}❌ Worker health check failed${NC}"
        fi
        
        # Test status endpoint
        if curl -fsS http://localhost:8082/debug/status >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Worker status endpoint accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  Worker status endpoint issues (may be normal during startup)${NC}"
        fi
    else
        echo -e "${RED}❌ Worker service not running on port 8082${NC}"
    fi
}

# Parse command line arguments
MODE="${1:-monitor}"
VERBOSE="${VERBOSE:-false}"

case "$MODE" in
    "check")
        check_worker_role
        check_worker_service
        ;;
    "supabase")
        monitor_logs "Supabase Database" "supabase_db_zeke" "worker"
        ;;
    "worker")
        monitor_logs "Worker Service" "zeke-worker-local-8082" "error"
        ;;
    "monitor"|*)
        echo -e "${YELLOW}🔄 Running initial checks...${NC}"
        check_worker_role
        check_worker_service
        
        echo -e "\n${BLUE}📊 Starting log monitoring...${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo -e "${YELLOW}Use VERBOSE=true for all logs${NC}"
        
        # Monitor both services in parallel
        (monitor_logs "Supabase Database" "supabase_db_zeke" "worker") &
        (monitor_logs "Worker Service" "zeke-worker-local-8082" "error") &
        
        # Wait for both background processes
        wait
        ;;
esac
