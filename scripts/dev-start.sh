#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting ZEKE development services...${NC}"

# Function to check if a service is running
service_running() {
    local service_name="$1"
    local port="$2"
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
        if service_running "$service_name" "$port"; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        sleep 2
    done
    
    echo -e "${RED}❌ $service_name failed to start on port $port${NC}"
    return 1
}

# Check if Supabase is running, start if not
if ! service_running "Supabase" 54321; then
    echo -e "${YELLOW}🔄 Starting Supabase...${NC}"
    supabase start
    wait_for_service "Supabase" 54321
else
    echo -e "${GREEN}✅ Supabase is already running${NC}"
fi

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
if supabase migration up --local >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Database migrations may have failed, but continuing...${NC}"
fi

# Generate types
echo -e "${YELLOW}🔄 Generating database types...${NC}"
if pnpm run types:generate >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database types generated${NC}"
else
    echo -e "${YELLOW}⚠️  Type generation may have failed, but continuing...${NC}"
fi

# Start worker container
echo -e "${YELLOW}🔄 Starting worker container...${NC}"
if PORT=8082 bash apps/worker/scripts/deploy-local-worker.sh >/dev/null 2>&1; then
    wait_for_service "Worker" 8082 15
else
    echo -e "${YELLOW}⚠️  Worker may have failed to start, but continuing...${NC}"
fi

echo -e "\n${GREEN}🎉 All services are ready!${NC}"
echo -e "${BLUE}📝 Starting development servers...${NC}"
echo -e "\n${BLUE}🌐 Service URLs:${NC}"
echo -e "  • Main App: ${YELLOW}http://localhost:3000${NC}"
echo -e "  • Marketing Site: ${YELLOW}http://localhost:3001${NC}"
echo -e "  • Storybook: ${YELLOW}http://localhost:6006${NC}"
echo -e "  • Supabase Studio: ${YELLOW}http://127.0.0.1:54323${NC}"
echo -e "  • Worker API: ${YELLOW}http://localhost:8082${NC}"
echo -e "\n${YELLOW}💡 Use Ctrl+C to stop all services, or run 'pnpm stop' in another terminal${NC}"
