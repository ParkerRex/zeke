#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Zeke development environment...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists pnpm; then
    echo -e "${RED}❌ pnpm not found. Please install it first.${NC}"
    echo "   npm install -g pnpm"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check if ports are available
echo -e "${YELLOW}🔍 Checking ports...${NC}"

if port_in_use 3000; then
    echo -e "${RED}❌ Port 3000 is already in use (Next.js)${NC}"
    echo "   Please stop the process using port 3000 or use a different port"
    exit 1
fi

if port_in_use 54321; then
    echo -e "${YELLOW}⚠️  Port 54321 is in use (Supabase API) - this is expected if Supabase is already running${NC}"
fi

echo -e "${GREEN}✅ Port check completed${NC}"

# Start Supabase
echo -e "${BLUE}🗄️  Starting Supabase...${NC}"
if npx supabase start; then
    echo -e "${GREEN}✅ Supabase started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start Supabase${NC}"
    exit 1
fi

# Apply migrations
echo -e "${BLUE}📦 Applying database migrations...${NC}"
if npx supabase migration up --local; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Failed to apply migrations${NC}"
    exit 1
fi

# Generate types
echo -e "${BLUE}🔧 Generating TypeScript types...${NC}"
if npx supabase gen types typescript --local --schema public > src/libs/supabase/types.ts; then
    echo -e "${GREEN}✅ Types generated successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Failed to generate types (continuing anyway)${NC}"
fi

# Test worker connection
echo -e "${BLUE}🔌 Testing worker database connection...${NC}"
cd worker
if bash scripts/test-connection.sh; then
    echo -e "${GREEN}✅ Worker connection test passed${NC}"
else
    echo -e "${RED}❌ Worker connection test failed${NC}"
    cd ..
    exit 1
fi
cd ..

echo -e "${GREEN}🎉 Development environment setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Services started:${NC}"
echo -e "   🗄️  Supabase API:    http://127.0.0.1:54321"
echo -e "   🎛️  Supabase Studio: http://127.0.0.1:54323"
echo -e "   📧 Inbucket:        http://127.0.0.1:54324"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo -e "   1. Start Next.js:    ${YELLOW}pnpm run dev:next${NC}"
echo -e "   2. Start Worker:     ${YELLOW}bash worker/scripts/deploy-local-worker.sh${NC}"
echo -e "   3. Or start both:    ${YELLOW}pnpm run dev:full${NC}"
echo ""
echo -e "${BLUE}🛑 To stop everything:${NC}"
echo -e "   ${YELLOW}pnpm run stop${NC}"
