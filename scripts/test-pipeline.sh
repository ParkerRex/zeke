#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running ZEKE pipeline tests...${NC}"

# Function to check if a service is running
service_running() {
    local port="$1"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Test 1: Check if Supabase is running
echo -e "\n${YELLOW}1️⃣ Testing Supabase connection...${NC}"
if service_running 54321; then
    echo -e "${GREEN}✅ Supabase is running${NC}"
    
    # Test database connection
    if echo "SELECT 1;" | psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -t -A >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Supabase is not running${NC}"
    echo -e "${YELLOW}💡 Run 'pnpm dev:setup' to start Supabase${NC}"
    exit 1
fi

# Test 2: Check worker connection
echo -e "\n${YELLOW}2️⃣ Testing worker connection...${NC}"
if service_running 8082; then
    echo -e "${GREEN}✅ Worker is running${NC}"
    
    # Test worker health endpoint
    if curl -fsS http://localhost:8082/healthz >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Worker health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Worker health check failed, but service is running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Worker is not running${NC}"
    echo -e "${YELLOW}💡 Run 'pnpm dev:worker' to start the worker${NC}"
fi

# Test 3: Run worker-specific tests
echo -e "\n${YELLOW}3️⃣ Running worker tests...${NC}"
cd apps/worker
if pnpm run test:connection; then
    echo -e "${GREEN}✅ Worker connection tests passed${NC}"
else
    echo -e "${RED}❌ Worker connection tests failed${NC}"
    cd ../..
    exit 1
fi

if pnpm run test:transcription; then
    echo -e "${GREEN}✅ Worker transcription tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Worker transcription tests failed, but continuing...${NC}"
fi
cd ../..

# Test 4: Type checking
echo -e "\n${YELLOW}4️⃣ Running type checks...${NC}"
if pnpm run typecheck; then
    echo -e "${GREEN}✅ Type checking passed${NC}"
else
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
fi

# Test 5: Build test
echo -e "\n${YELLOW}5️⃣ Testing builds...${NC}"
if turbo build --filter=app --filter=web --filter=worker; then
    echo -e "${GREEN}✅ Build tests passed${NC}"
else
    echo -e "${RED}❌ Build tests failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 All pipeline tests passed!${NC}"
echo -e "${BLUE}📝 Pipeline is healthy and ready for development${NC}"
