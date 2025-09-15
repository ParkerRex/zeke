#!/bin/bash

# Setup worker database credentials
# This script ensures the worker role has the correct password from environment variables

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up worker database credentials...${NC}"

# Load environment variables
if [ -f ".env.development" ]; then
    echo -e "${GREEN}📄 Loading .env.development${NC}"
    export $(grep -v '^#' .env.development | xargs)
elif [ -f ".env.local" ]; then
    echo -e "${GREEN}📄 Loading .env.local${NC}"
    export $(grep -v '^#' .env.local | xargs)
fi

# Check if required variables are set
if [ -z "${WORKER_DB_PASSWORD:-}" ]; then
    echo -e "${RED}❌ WORKER_DB_PASSWORD environment variable is not set${NC}"
    echo -e "${YELLOW}💡 Please set WORKER_DB_PASSWORD in your .env file${NC}"
    exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    echo -e "${YELLOW}💡 Please set DATABASE_URL in your .env file${NC}"
    exit 1
fi

# Extract connection details for admin connection
# We need to connect as postgres user to alter the worker role
ADMIN_URL=$(echo "$DATABASE_URL" | sed 's/worker:[^@]*@/postgres:postgres@/')

echo -e "${BLUE}🔑 Setting worker role password...${NC}"

# Set the worker password
psql "$ADMIN_URL" -c "ALTER ROLE worker PASSWORD '$WORKER_DB_PASSWORD';" || {
    echo -e "${RED}❌ Failed to set worker password${NC}"
    exit 1
}

echo -e "${GREEN}✅ Worker password updated successfully${NC}"

# Test the worker connection
echo -e "${BLUE}🧪 Testing worker connection...${NC}"

psql "$DATABASE_URL" -c "SELECT current_user, current_database();" || {
    echo -e "${RED}❌ Worker connection test failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Worker connection test successful${NC}"

# Test source_health table access
echo -e "${BLUE}🧪 Testing source_health table access...${NC}"

psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM public.source_health;" || {
    echo -e "${RED}❌ Worker cannot access source_health table${NC}"
    exit 1
}

echo -e "${GREEN}✅ Worker can access source_health table${NC}"

echo -e "${GREEN}🎉 Worker credentials setup complete!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  ✅ Worker role password updated"
echo -e "  ✅ Database connection verified"
echo -e "  ✅ Table access permissions confirmed"
echo -e "  ✅ Ready for source health operations"
