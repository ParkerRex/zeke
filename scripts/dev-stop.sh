#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping ZEKE development services...${NC}"

# Function to stop processes on a port
stop_port() {
    local port="$1"
    local service_name="$2"
    
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}🔄 Stopping $service_name on port $port...${NC}"
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${YELLOW}🔄 Force stopping $service_name...${NC}"
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ $service_name stopped${NC}"
    else
        echo -e "${GREEN}✅ $service_name was not running${NC}"
    fi
}

# Stop Next.js development servers
stop_port 3000 "Main App (Next.js)"
stop_port 3001 "Marketing Site (Next.js)"
stop_port 6006 "Storybook"

# Stop worker containers
echo -e "${YELLOW}🔄 Stopping worker containers...${NC}"
if command -v docker >/dev/null 2>&1; then
    # Stop all zeke-worker containers
    local worker_containers=$(docker ps -q --filter "name=zeke-worker-local" 2>/dev/null || true)
    if [ -n "$worker_containers" ]; then
        echo "$worker_containers" | xargs docker stop >/dev/null 2>&1 || true
        echo "$worker_containers" | xargs docker rm >/dev/null 2>&1 || true
        echo -e "${GREEN}✅ Worker containers stopped${NC}"
    else
        echo -e "${GREEN}✅ No worker containers were running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not available, skipping container cleanup${NC}"
fi

# Stop Supabase (optional - commented out by default to preserve data)
# Uncomment the following lines if you want to stop Supabase as well
# echo -e "${YELLOW}🔄 Stopping Supabase...${NC}"
# supabase stop
# echo -e "${GREEN}✅ Supabase stopped${NC}"

# Kill any remaining turbo processes
echo -e "${YELLOW}🔄 Cleaning up turbo processes...${NC}"
pkill -f "turbo dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "storybook dev" 2>/dev/null || true

echo -e "\n${GREEN}🎉 All development services stopped!${NC}"
echo -e "${BLUE}📝 Note: Supabase is still running to preserve your data${NC}"
echo -e "${BLUE}📝 Run 'supabase stop' manually if you want to stop it too${NC}"
