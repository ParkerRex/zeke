#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up ZEKE development environment...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
service_running() {
    local service_name="$1"
    local port="$2"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $service_name is not running on port $port${NC}"
        return 1
    fi
}

# Check prerequisites
echo -e "\n${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
if [ "$MAJOR_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION found. Please install Node.js 20+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"

if ! command_exists pnpm; then
    echo -e "${RED}❌ pnpm not found. Please install pnpm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker not found. Please install Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker $(docker --version | cut -d' ' -f3 | sed 's/,//')${NC}"

if ! command_exists supabase; then
    echo -e "${RED}❌ Supabase CLI not found. Please install: npm install -g supabase${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI $(supabase --version | cut -d' ' -f2)${NC}"

# Check if Supabase is running
echo -e "\n${YELLOW}🔍 Checking Supabase status...${NC}"
if service_running "Supabase" 54321; then
    echo -e "${GREEN}✅ Supabase is already running${NC}"
else
    echo -e "${YELLOW}🔄 Starting Supabase...${NC}"
    supabase start
    
    # Wait for Supabase to be ready
    echo -e "${YELLOW}⏳ Waiting for Supabase to be ready...${NC}"
    for i in {1..30}; do
        if service_running "Supabase" 54321; then
            break
        fi
        sleep 2
    done
    
    if ! service_running "Supabase" 54321; then
        echo -e "${RED}❌ Supabase failed to start${NC}"
        exit 1
    fi
fi

# Run database migrations
echo -e "\n${YELLOW}🔄 Running database migrations...${NC}"
if supabase migration up --local; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${RED}❌ Database migrations failed${NC}"
    exit 1
fi

# Generate types
echo -e "\n${YELLOW}🔄 Generating database types...${NC}"
if pnpm run types:generate; then
    echo -e "${GREEN}✅ Database types generated${NC}"
else
    echo -e "${YELLOW}⚠️  Type generation failed, but continuing...${NC}"
fi

# Install dependencies if needed
echo -e "\n${YELLOW}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ] || [ ! -d "apps/app/node_modules" ] || [ ! -d "apps/web/node_modules" ]; then
    echo -e "${YELLOW}🔄 Installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo -e "\n${GREEN}🎉 Development environment setup complete!${NC}"
echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "  • Run ${YELLOW}pnpm dev${NC} to start all services"
echo -e "  • Run ${YELLOW}pnpm dev --filter=app${NC} to start only the main app"
echo -e "  • Run ${YELLOW}pnpm dev --filter=web${NC} to start only the marketing site"
echo -e "  • Run ${YELLOW}pnpm stop${NC} to stop all services"
echo -e "\n${BLUE}🌐 Service URLs:${NC}"
echo -e "  • Main App: ${YELLOW}http://localhost:3000${NC}"
echo -e "  • Marketing Site: ${YELLOW}http://localhost:3001${NC}"
echo -e "  • Storybook: ${YELLOW}http://localhost:6006${NC}"
echo -e "  • Supabase Studio: ${YELLOW}http://127.0.0.1:54323${NC}"
echo -e "  • Worker API: ${YELLOW}http://localhost:8082${NC}"
