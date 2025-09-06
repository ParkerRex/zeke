#!/usr/bin/env bash
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${BLUE}🧹 Removing invalid YouTube channel sources...${NC}"

# Load DB URL from worker/.env.development, fallback to root .env.development
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ]; then
  if [ -f worker/.env.development ]; then set -a; source worker/.env.development; set +a; DB_URL="$DATABASE_URL"; fi
fi
if [ -z "$DB_URL" ]; then
  if [ -f .env.development ]; then set -a; source .env.development; set +a; fi
fi
DB_URL="${DATABASE_URL:-$DB_URL}"

if [ -z "$DB_URL" ]; then
  echo -e "${YELLOW}⚠️  DATABASE_URL not set. Provide it or create worker/.env.development${NC}"
  exit 1
fi

psql "$DB_URL" -f scripts/sql/db-clean-youtube-bad.sql

echo -e "${GREEN}✅ Cleanup done.${NC}"

