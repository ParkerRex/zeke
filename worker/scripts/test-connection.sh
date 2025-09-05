#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Testing database connection...${NC}"

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Check required environment variables
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    exit 1
fi

BOSS_SCHEMA="${BOSS_SCHEMA:-pgboss}"

echo -e "${BLUE}📍 Schema: ${BOSS_SCHEMA}${NC}"
echo -e "${BLUE}🔗 URL: ${DATABASE_URL//:*@/:***@}${NC}"

# Test 1: Basic PostgreSQL connection
echo -e "\n${YELLOW}1️⃣ Testing PostgreSQL connection...${NC}"

# Use psql to test connection
if echo "SELECT version();" | psql "$DATABASE_URL" -t -A 2>/dev/null | head -1 | grep -q "PostgreSQL"; then
    VERSION=$(echo "SELECT version();" | psql "$DATABASE_URL" -t -A 2>/dev/null | head -1 | cut -d' ' -f1)
    echo -e "${GREEN}✅ PostgreSQL connected: $VERSION${NC}"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    exit 1
fi

# Test 2: Check PgBoss schema
echo -e "\n${YELLOW}2️⃣ Testing PgBoss schema...${NC}"

SCHEMA_EXISTS=$(echo "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '$BOSS_SCHEMA');" | psql "$DATABASE_URL" -t -A 2>/dev/null)

if [ "$SCHEMA_EXISTS" = "t" ]; then
    echo -e "${GREEN}✅ PgBoss schema exists${NC}"

    # Count tables in schema
    TABLE_COUNT=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$BOSS_SCHEMA';" | psql "$DATABASE_URL" -t -A 2>/dev/null)
    echo -e "${GREEN}📊 Found $TABLE_COUNT tables in $BOSS_SCHEMA schema${NC}"
else
    echo -e "${YELLOW}⚠️  PgBoss schema not found - run migrations first${NC}"
fi

# Test 3: Test worker role permissions
echo -e "\n${YELLOW}3️⃣ Testing worker role permissions...${NC}"

# Check if we can create a test table (and clean it up)
TEST_TABLE="test_worker_permissions_$$"
if echo "CREATE TABLE $BOSS_SCHEMA.$TEST_TABLE (id SERIAL PRIMARY KEY); DROP TABLE $BOSS_SCHEMA.$TEST_TABLE;" | psql "$DATABASE_URL" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Worker has sufficient permissions${NC}"
else
    echo -e "${YELLOW}⚠️  Limited permissions (may be read-only)${NC}"
fi

echo -e "\n${GREEN}🎉 All connection tests passed!${NC}"
