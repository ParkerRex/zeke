#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧰 Bootstrap: starting (idempotent) full local stack...${NC}"

command_exists() { command -v "$1" >/dev/null 2>&1; }

if ! command_exists pnpm; then
  echo -e "${RED}❌ pnpm not found. Install: npm i -g pnpm${NC}"; exit 1;
fi
if ! command_exists node; then
  echo -e "${RED}❌ Node.js not found. Install Node 20+${NC}"; exit 1;
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "${NODE_MAJOR}" -lt 20 ]; then
  echo -e "${RED}❌ Node ${NODE_MAJOR}.x detected. Please use Node 20+ (e.g., nvm use 20).${NC}"; exit 1;
fi
if ! command_exists docker; then
  echo -e "${YELLOW}⚠️ Docker not found. Worker will not run in a container.${NC}"
fi

# Helper: check if a port is in use
port_in_use() { lsof -i :"$1" >/dev/null 2>&1; }

echo -e "${BLUE}🔎 Checking for running services to restart...${NC}"
NEED_RESTART=0
for P in 3000 8080 8081 8082 54321 54323; do
  if port_in_use "$P"; then NEED_RESTART=1; break; fi
done
if command -v docker >/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' | grep -Eq '^zeke-worker-local(-[0-9]+)?$'; then NEED_RESTART=1; fi
fi
if [ "$NEED_RESTART" = "1" ]; then
  echo -e "${YELLOW}↪️  Services appear to be running. Stopping before restart...${NC}"
  pnpm run stop || true
else
  echo -e "${GREEN}✔ No conflicting services detected${NC}"
fi
if ! command_exists psql; then
  echo -e "${YELLOW}⚠️ psql not found. You may be prompted later by Supabase CLI.${NC}"
fi

echo -e "${BLUE}📦 Installing dependencies (if needed)...${NC}"
if [[ ! -d "node_modules" || "${FORCE_INSTALL:-}" = "1" ]]; then
  pnpm install || { echo -e "${RED}❌ pnpm install (root) failed${NC}"; exit 1; }
else
  echo -e "${GREEN}✔ root deps present${NC}"
fi
if [[ ! -d "worker/node_modules" || "${FORCE_INSTALL:-}" = "1" ]]; then
  (cd worker && pnpm install) || { echo -e "${RED}❌ pnpm install (worker) failed${NC}"; exit 1; }
else
  echo -e "${GREEN}✔ worker deps present${NC}"
fi

echo -e "${BLUE}🗄️  Starting Supabase containers...${NC}"
npx supabase start || { echo -e "${RED}❌ Supabase start failed${NC}"; exit 1; }

echo -e "${BLUE}🧱 Applying migrations...${NC}"
npx supabase migration up --local || { echo -e "${RED}❌ Migration up failed${NC}"; exit 1; }

echo -e "${BLUE}🔧 Generating DB types...${NC}"
npx supabase gen types typescript --local --schema public > src/lib/supabase/types.ts || true
mkdir -p worker/src/lib/supabase
cp -f src/lib/supabase/types.ts worker/src/lib/supabase/types.ts || true

# Ensure worker role password
LOCAL_DB_URL=${LOCAL_DB_URL:-"postgresql://postgres:postgres@127.0.0.1:54322/postgres"}
WORKER_ENV_FILE="worker/.env.development"
PASS_LINE=""
if [[ -f "$WORKER_ENV_FILE" ]]; then
  PASS_LINE=$(grep -E '^WORKER_DB_PASSWORD=' "$WORKER_ENV_FILE" | head -n1 || true)
fi
WORKER_PASS=${PASS_LINE#WORKER_DB_PASSWORD=}
if [[ -z "${WORKER_PASS:-}" ]]; then
  echo -e "${YELLOW}⚠️ WORKER_DB_PASSWORD not set in ${WORKER_ENV_FILE}. Using default 'worker_password'.${NC}"
  WORKER_PASS="worker_password"
fi

echo -e "${BLUE}🔐 Ensuring worker role password matches env...${NC}"
DB_URL="$LOCAL_DB_URL" WORKER_PASS="$WORKER_PASS" bash scripts/fix-worker-role.sh || {
  echo -e "${RED}❌ Failed to set/verify worker role password${NC}"; exit 1;
}

echo -e "${GREEN}✅ Database ready${NC}"

# Stripe fixtures (optional)
if command -v stripe >/dev/null 2>&1; then
  if [[ -n "${STRIPE_SECRET_KEY:-}" && -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
    echo -e "${BLUE}💳 Running Stripe fixtures...${NC}"
    stripe fixtures ./stripe-fixtures.json --api-key "$STRIPE_SECRET_KEY" || echo -e "${YELLOW}⚠️ Stripe fixtures failed or partially applied${NC}"
  else
    echo -e "${YELLOW}⚠️ Stripe SK/WEBHOOK secret not set. Skipping fixtures. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to seed pricing.${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Stripe CLI not installed. Skipping fixtures.${NC}"
fi

echo -e "${BLUE}🚀 Launching Next.js + Worker (concurrently)...${NC}"
pnpm run dev:full
