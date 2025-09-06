#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Zeke Pipeline...${NC}"

# Load environment variables
if [ -f worker/.env.development ]; then
    export $(grep -v '^#' worker/.env.development | xargs)
elif [ -f .env.development ]; then
    export $(grep -v '^#' .env.development | xargs)
fi

DATABASE_URL="${DATABASE_URL:-}"
BOSS_SCHEMA="${BOSS_SCHEMA:-pgboss}"

# Avoid interactive password prompts for worker role when URL lacks password
if [ -z "${PGPASSWORD:-}" ]; then
  if echo "$DATABASE_URL" | grep -Eq '^postgresql://worker@'; then
    export PGPASSWORD="${WORKER_PASS:-worker_password}"
  fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Current System Status:${NC}"

# Check if services are running
echo -e "\n${YELLOW}🔍 Service Health Check:${NC}"

# Check Next.js
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Next.js running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Next.js not responding on port 3000${NC}"
fi

# Check Worker (allow custom port and correct health path)
WORKER_PORT="${WORKER_PORT:-8081}"
if curl -s "http://localhost:${WORKER_PORT}/healthz" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Worker running on port ${WORKER_PORT}${NC}"
else
    echo -e "${YELLOW}⚠️  Worker not responding on port ${WORKER_PORT}${NC}"
fi

# Check Supabase
if curl -s http://127.0.0.1:54321/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Supabase API running on port 54321${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase API not responding${NC}"
fi

# Database stats
echo -e "\n${YELLOW}📈 Database Statistics:${NC}"

# Job queue stats
TOTAL_JOBS=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job;" | psql "$DATABASE_URL" -t -A 2>/dev/null || echo "0")
ACTIVE_JOBS=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job WHERE state IN ('created', 'active', 'retry');" | psql "$DATABASE_URL" -t -A 2>/dev/null || echo "0")
COMPLETED_JOBS=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job WHERE state = 'completed';" | psql "$DATABASE_URL" -t -A 2>/dev/null || echo "0")
FAILED_JOBS=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job WHERE state = 'failed';" | psql "$DATABASE_URL" -t -A 2>/dev/null || echo "0")

echo -e "   📋 Total jobs: $TOTAL_JOBS"
echo -e "   🔄 Active jobs: $ACTIVE_JOBS"
echo -e "   ✅ Completed jobs: $COMPLETED_JOBS"
echo -e "   ❌ Failed jobs: $FAILED_JOBS"

# Content stats (if tables exist)
RAW_ITEMS=$(echo "SELECT COUNT(*) FROM raw_items;" | psql "$DATABASE_URL" -t -A 2>/dev/null || echo "N/A")
CONTENTS=$(echo "SELECT COUNT(*) FROM contents;" | psql "$DATABASE_URL" -t -A 2>/dev/null || echo "N/A")
STORIES=$(echo "SELECT COUNT(*) FROM stories;" | psql "$DATABASE_URL" -t -A 2>/dev/null || echo "N/A")

echo -e "   📰 Raw items: $RAW_ITEMS"
echo -e "   📄 Contents: $CONTENTS"
echo -e "   📚 Stories: $STORIES"

# Recent activity
echo -e "\n${YELLOW}⏰ Recent Activity:${NC}"

# Recent jobs
echo -e "${BLUE}Recent jobs (last 5):${NC}"
echo "SELECT id, name, state, created_on FROM $BOSS_SCHEMA.job ORDER BY created_on DESC LIMIT 5;" | psql "$DATABASE_URL" -t 2>/dev/null || echo "No jobs found"

############################################
# Test pipeline trigger via worker endpoint #
############################################
echo -e "\n${YELLOW}🧪 Triggering ingest via worker:${NC}"
if curl -fsS -X POST "http://localhost:${WORKER_PORT}/debug/ingest-now" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Ingest trigger sent to worker${NC}"
else
    echo -e "${YELLOW}⚠️  Could not reach worker ingest endpoint${NC}"
fi

echo -e "\n${GREEN}🎉 Pipeline test completed!${NC}"
echo -e "\n${BLUE}💡 Monitoring Tips:${NC}"
echo -e "   🔍 Watch logs: ${YELLOW}cd worker && npm run logs${NC}"
echo -e "   🎛️  Database UI: ${YELLOW}open http://127.0.0.1:54323${NC}"
echo -e "   📊 Job queue: ${YELLOW}cd worker && bash scripts/test-transcription.sh${NC}"
echo -e "   🔄 Re-run test: ${YELLOW}bash scripts/test-pipeline.sh${NC}"
