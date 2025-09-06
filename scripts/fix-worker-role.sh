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

psql "$DB_URL" <<SQL
DO \
\$\$\nBEGIN\n  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'worker') THEN\n    CREATE ROLE worker WITH LOGIN PASSWORD '$WORKER_PASS';\n  ELSE\n    ALTER ROLE worker WITH LOGIN PASSWORD '$WORKER_PASS';\n  END IF;\nEND\n\$\$;\n\n-- Basic grants for pg-boss schema
GRANT USAGE, CREATE ON SCHEMA pgboss TO worker;\n
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pgboss TO worker;\n
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pgboss TO worker;\n
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA pgboss TO worker;\n
GRANT USAGE ON TYPE pgboss.job_state TO worker;\n\n-- Public schema access for local dev
GRANT USAGE ON SCHEMA public TO worker;\n
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO worker;\n
SQL

echo -e "${GREEN}✅ Role and grants ensured${NC}"

echo -e "${BLUE}🧪 Testing login as worker...${NC}"
PGPASSWORD="$WORKER_PASS" psql "postgresql://worker@127.0.0.1:54322/postgres" -c "SELECT 'ok' as login, now();" || {
  echo -e "${RED}❌ Worker login test failed${NC}"; exit 1;
}

echo -e "${GREEN}✅ Worker login OK${NC}"
echo -e "${YELLOW}Next:${NC} run: bash scripts/worker-rebuild-run-8082.sh, then open http://localhost:3000/testing"

