#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping worker containers...${NC}"

if command -v docker >/dev/null 2>&1; then
    # Stop all zeke-worker containers
    local worker_containers=$(docker ps -q --filter "name=zeke-worker-local" 2>/dev/null || true)
    if [ -n "$worker_containers" ]; then
        echo -e "${YELLOW}🔄 Stopping worker containers...${NC}"
        echo "$worker_containers" | xargs docker stop >/dev/null 2>&1 || true
        echo "$worker_containers" | xargs docker rm >/dev/null 2>&1 || true
        echo -e "${GREEN}✅ Worker containers stopped${NC}"
    else
        echo -e "${GREEN}✅ No worker containers were running${NC}"
    fi
else
    echo -e "${RED}❌ Docker not available${NC}"
    exit 1
fi
