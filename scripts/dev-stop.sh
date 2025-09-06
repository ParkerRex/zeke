#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Zeke development environment...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service=$2

    if lsof -i :"$port" >/dev/null 2>&1; then
        echo -e "${YELLOW}🔌 Stopping $service on port $port...${NC}"
        lsof -ti :"$port" | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ $service stopped${NC}"
    else
        echo -e "${GREEN}✅ $service not running on port $port${NC}"
    fi
}

# Stop Next.js (port 3000)
kill_port 3000 "Next.js"

# Stop Worker (common ports)
kill_port 8080 "Worker"
kill_port 8081 "Worker"
kill_port 8082 "Worker"

# Stop Docker worker container if present
if command -v docker >/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' | grep -q '^zeke-worker-local$'; then
    echo -e "${YELLOW}🔌 Stopping Docker worker container...${NC}"
    docker stop zeke-worker-local >/dev/null || true
    echo -e "${GREEN}✅ Docker worker container stopped${NC}"
  fi
  if docker ps --format '{{.Names}}' | grep -q '^zeke-worker-local-8082$'; then
    echo -e "${YELLOW}🔌 Stopping Docker worker container (8082)...${NC}"
    docker stop zeke-worker-local-8082 >/dev/null || true
    echo -e "${GREEN}✅ Docker worker container (8082) stopped${NC}"
  fi
fi

# Stop Supabase
echo -e "${BLUE}🗄️  Stopping Supabase...${NC}"
if command_exists npx; then
    if npx supabase stop; then
        echo -e "${GREEN}✅ Supabase stopped successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Supabase may not have been running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  npx not found${NC}"
fi

# Stop any remaining Node processes that might be related to the project
echo -e "${BLUE}🧹 Cleaning up any remaining processes...${NC}"

# Kill any tsx processes (worker dev mode)
pkill -f "tsx.*worker" 2>/dev/null || true

# Kill any next dev processes
pkill -f "next.*dev" 2>/dev/null || true

echo -e "${GREEN}🎉 Development environment stopped!${NC}"
echo ""
echo -e "${BLUE}💡 To start again, run:${NC}"
echo -e "   ${YELLOW}pnpm run dev${NC}         (full setup + start services with Docker worker)"
echo -e "   ${YELLOW}pnpm run dev:setup${NC}   (setup only)"
echo -e "   ${YELLOW}pnpm run dev:full${NC}    (start services only, Docker worker)"
