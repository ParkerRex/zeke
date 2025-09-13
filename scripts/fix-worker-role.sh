#!/usr/bin/env bash
set -euo pipefail

# Fix worker role password for local development
# Usage: DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres WORKER_PASS=worker_password bash scripts/fix-worker-role.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing worker role password...${NC}"

# Check required environment variables
: "${DB_URL:?Set DB_URL to postgres admin connection string}"
: "${WORKER_PASS:?Set WORKER_PASS to desired worker password}"

echo -e "${YELLOW}🔄 Setting worker role password...${NC}"

# Create or update worker role with password
psql "$DB_URL" -c "
DO \$\$
BEGIN
  -- Create role if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'worker') THEN
    CREATE ROLE worker WITH LOGIN;
    RAISE NOTICE 'Created worker role';
  ELSE
    RAISE NOTICE 'Worker role already exists';
  END IF;
  
  -- Set password
  EXECUTE format('ALTER ROLE worker WITH PASSWORD %L', '$WORKER_PASS');
  RAISE NOTICE 'Updated worker password';
END
\$\$;
" >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Worker role password updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update worker role password${NC}"
    exit 1
fi

# Test the connection
echo -e "${YELLOW}🔄 Testing worker connection...${NC}"
WORKER_URL=$(echo "$DB_URL" | sed -E "s#postgresql://[^@]*@#postgresql://worker:${WORKER_PASS}@#")

if PGPASSWORD="$WORKER_PASS" psql "$WORKER_URL" -c "SELECT 'Worker connection successful' as status;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Worker can connect successfully${NC}"
else
    echo -e "${RED}❌ Worker connection test failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Worker role setup complete!${NC}"
