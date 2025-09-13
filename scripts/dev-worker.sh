#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Starting ZEKE worker service...${NC}"

# Function to check if a service is running
service_running() {
    local port="$1"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local port="$2"
    local max_attempts="${3:-30}"
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready on port $port...${NC}"
    for i in $(seq 1 $max_attempts); do
        if service_running "$port"; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        sleep 2
    done
    
    echo -e "${RED}❌ $service_name failed to start on port $port${NC}"
    return 1
}

# Check if Supabase is running
if ! service_running 54321; then
    echo -e "${YELLOW}🔄 Supabase not running, starting it first...${NC}"
    supabase start
    wait_for_service "Supabase" 54321
fi

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
if supabase migration up --local >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Database migrations may have failed, but continuing...${NC}"
fi

# Start worker container
echo -e "${YELLOW}🔄 Starting worker container...${NC}"
PORT=8082 bash apps/worker/scripts/deploy-local-worker.sh

# Wait for worker to be ready
wait_for_service "Worker" 8082 15

echo -e "\n${GREEN}🎉 Worker service is ready!${NC}"
echo -e "${BLUE}🌐 Worker API: ${YELLOW}http://localhost:8082${NC}"
echo -e "${BLUE}📝 Worker logs: ${YELLOW}docker logs -f zeke-worker-local-8082${NC}"
