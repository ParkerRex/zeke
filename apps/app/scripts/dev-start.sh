#!/usr/bin/env bash
set -euo pipefail

# This script is called from the app's package.json dev script
# It ensures Supabase is running and migrations are applied before starting the app

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Preparing app development environment...${NC}"

# Function to check if a service is running
service_running() {
    local port="$1"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if Supabase is running, start if not
if ! service_running 54321; then
    echo -e "${YELLOW}🔄 Starting Supabase...${NC}"
    supabase start
    
    # Wait for Supabase to be ready
    echo -e "${YELLOW}⏳ Waiting for Supabase to be ready...${NC}"
    for i in {1..30}; do
        if service_running 54321; then
            break
        fi
        sleep 2
    done
    
    if ! service_running 54321; then
        echo -e "${RED}❌ Supabase failed to start${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Supabase is ready${NC}"
else
    echo -e "${GREEN}✅ Supabase is already running${NC}"
fi

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
if pnpm run db:migrate >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Database migrations may have failed, but continuing...${NC}"
fi

echo -e "${GREEN}✅ App development environment is ready${NC}"
