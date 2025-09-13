#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Rebuilding and restarting worker on port 8082...${NC}"

# Stop existing worker container
echo -e "${YELLOW}🛑 Stopping existing worker container...${NC}"
if command -v docker >/dev/null 2>&1; then
    local worker_container=$(docker ps -q --filter "name=zeke-worker-local-8082" 2>/dev/null || true)
    if [ -n "$worker_container" ]; then
        docker stop "$worker_container" >/dev/null 2>&1 || true
        docker rm "$worker_container" >/dev/null 2>&1 || true
        echo -e "${GREEN}✅ Existing worker container stopped${NC}"
    else
        echo -e "${GREEN}✅ No existing worker container found${NC}"
    fi
else
    echo -e "${RED}❌ Docker not available${NC}"
    exit 1
fi

# Rebuild and start worker
echo -e "${YELLOW}🔄 Rebuilding and starting worker...${NC}"
PORT=8082 bash ../worker/scripts/deploy-local-worker.sh

echo -e "${GREEN}🎉 Worker rebuilt and restarted on port 8082!${NC}"
echo -e "${BLUE}📝 Worker logs: ${YELLOW}docker logs -f zeke-worker-local-8082${NC}"
