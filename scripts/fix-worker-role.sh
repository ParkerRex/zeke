#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_URL=${DB_URL:-"postgresql://postgres:postgres@127.0.0.1:54322/postgres"}
WORKER_PASS=${WORKER_PASS:-"worker_password"}

echo -e "${BLUE}🔧 Ensuring 'worker' role and grants in local Supabase...${NC}"

PW_SQL=$(printf "%s" "$WORKER_PASS" | sed "s/'/''/g")

psql -v ON_ERROR_STOP=1 "$DB_URL" <<SQL
DO \$do\$
DECLARE pw text := '${PW_SQL}';
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'worker') THEN
    EXECUTE format('CREATE ROLE worker WITH LOGIN PASSWORD %L', pw);
  ELSE
    EXECUTE format('ALTER ROLE worker WITH LOGIN PASSWORD %L', pw);
  END IF;
END
\$do\$;

-- Basic grants for pg-boss schema
GRANT USAGE, CREATE ON SCHEMA pgboss TO worker;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pgboss TO worker;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pgboss TO worker;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA pgboss TO worker;
GRANT USAGE ON TYPE pgboss.job_state TO worker;

-- Public schema access for local dev
GRANT USAGE ON SCHEMA public TO worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO worker;
SQL

echo -e "${GREEN}✅ Role and grants ensured${NC}"

echo -e "${BLUE}🧪 Testing login as worker...${NC}"
PGPASSWORD="$WORKER_PASS" psql "postgresql://worker@127.0.0.1:54322/postgres" -c "SELECT 'ok' as login, now();" || {
  echo -e "${RED}❌ Worker login test failed${NC}"; exit 1;
}

echo -e "${GREEN}✅ Worker login OK${NC}"
echo -e "${YELLOW}Next:${NC} run: bash scripts/worker-rebuild-run-8082.sh, then open http://localhost:3000/testing"
