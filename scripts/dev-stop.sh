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

safe_kill_pid() {
  local pid=$1
  # Avoid killing docker/orbstack/containerd processes by PID
  local cmd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
  if echo "$cmd" | grep -Eiq '(docker|containerd|orbstack|orbctl|vpnkit|vmnetd)'; then
    echo -e "${YELLOW}↪️  Skipping system/docker process (pid=$pid): $cmd${NC}"
    return 0
  fi
  kill -TERM "$pid" 2>/dev/null || true
  sleep 0.5
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL "$pid" 2>/dev/null || true
  fi
}

# Function to stop processes listening on a port (SIGTERM first). Skips Docker/OrbStack daemons.
kill_port() {
  local port=$1
  local service=$2
  if lsof -i :"$port" >/dev/null 2>&1; then
    echo -e "${YELLOW}🔌 Stopping $service on port $port...${NC}"
    for pid in $(lsof -ti :"$port" 2>/dev/null || true); do
      safe_kill_pid "$pid"
    done
    echo -e "${GREEN}✅ $service stopped (or not listening)${NC}"
  else
    echo -e "${GREEN}✅ $service not running on port $port${NC}"
  fi
}

# Gracefully stop worker Docker container(s) rather than killing host processes bound to 808x
stop_worker_containers() {
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker not available; skipping container stop${NC}"
    return 0
  fi
  # Stop known names
  local candidates
  candidates=$(docker ps --format '{{.ID}} {{.Names}} {{.Ports}}' | \
    awk '/zeke-worker-local/ {print $1" "$2} /0\.0\.0\.0:8080|:8080->/ {print $1" "$2} /0\.0\.0\.0:8081|:8081->/ {print $1" "$2} /0\.0\.0\.0:8082|:8082->/ {print $1" "$2}' | sort -u)
  if [ -n "$candidates" ]; then
    echo -e "${YELLOW}🔌 Stopping worker containers...${NC}"
    echo "$candidates" | awk '{print $1}' | xargs -r docker stop >/dev/null 2>&1 || true
    echo -e "${GREEN}✅ Worker containers stopped${NC}"
  else
    echo -e "${GREEN}✅ No worker containers running${NC}"
  fi
}

# Stop Next.js (port 3000)
kill_port 3000 "Next.js"

# Stop Worker containers gracefully; avoid killing Docker/OrbStack daemons
stop_worker_containers

# Additional cleanup of legacy container names (if still present but not running)
if command -v docker >/dev/null 2>&1; then
  for name in zeke-worker-local zeke-worker-local-8080 zeke-worker-local-8081 zeke-worker-local-8082; do
    if docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
      docker rm -f "$name" >/dev/null 2>&1 || true
    fi
  done
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
