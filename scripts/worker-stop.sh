#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping worker processes and freeing ports...${NC}"

# Kill ports commonly used by the worker
for PORT in 8080 8081 8082; do
  if lsof -i :"$PORT" >/dev/null 2>&1; then
    echo -e "${YELLOW}🔌 Killing processes on port ${PORT}${NC}"
    lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true
  fi
done

# Kill tsx watch worker dev processes
pkill -f "tsx.*src/worker.ts" 2>/dev/null || true

# Stop Docker containers by conventional names
if command -v docker >/dev/null 2>&1; then
  for NAME in zeke-worker-local zeke-worker-local-8080 zeke-worker-local-8081 zeke-worker-local-8082; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${NAME}$"; then
      echo -e "${YELLOW}🔌 Removing container ${NAME}${NC}"
      docker rm -f "$NAME" >/dev/null 2>&1 || true
    fi
  done
fi

echo -e "${GREEN}✅ Worker stopped and ports freed${NC}"

