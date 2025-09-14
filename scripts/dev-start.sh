#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting ZEKE development services...${NC}"

# Apply development optimizations for memory efficiency
echo -e "${YELLOW}🔧 Applying development optimizations...${NC}"
export NODE_ENV=development
export NEXT_DISABLE_SOURCEMAPS=true
export NEXT_DISABLE_SWC_MINIFY=true
export NEXT_REDUCE_MEMORY=true
export TURBOPACK_MEMORY_LIMIT=2048
export DISABLE_SENTRY=true
export DISABLE_ARCJET=true
export DISABLE_LOGTAIL=true
export DISABLE_ANALYTICS=true
export LOG_LEVEL=error

# Node.js memory optimization flags
export NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128 --gc-interval=100"

echo -e "${GREEN}✅ Development optimizations applied${NC}"

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
MIGRATION_OUTPUT=$(supabase migration up --local 2>&1)
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Database migrations failed with exit code $MIGRATION_EXIT_CODE${NC}"
    echo -e "${YELLOW}📝 Error details:${NC}"
    echo "$MIGRATION_OUTPUT" | head -5
    echo -e "${YELLOW}⚠️  Continuing anyway...${NC}"
fi

# Generate types
echo -e "${YELLOW}🔄 Generating database types...${NC}"
TYPES_OUTPUT=$(pnpm run types:generate 2>&1)
TYPES_EXIT_CODE=$?

if [ $TYPES_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Database types generated successfully${NC}"
    echo -e "${BLUE}📁 Types written to: packages/supabase/src/types/db.ts${NC}"
else
    echo -e "${RED}❌ Type generation failed with exit code $TYPES_EXIT_CODE${NC}"
    echo -e "${YELLOW}📝 Error details:${NC}"
    echo "$TYPES_OUTPUT" | head -10
    echo -e "${YELLOW}⚠️  Continuing with existing types...${NC}"
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
echo -e "  • Supabase Studio: ${YELLOW}http://127.0.0.1:54323${NC}"
echo -e "  • Worker API: ${YELLOW}http://localhost:8082${NC}"
echo -e "\n${YELLOW}💡 Use Ctrl+C to stop all services, or run 'pnpm stop' in another terminal${NC}"
