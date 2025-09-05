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
if [ -f worker/.env.local ]; then
    export $(grep -v '^#' worker/.env.local | xargs)
elif [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

DATABASE_URL="${DATABASE_URL:-}"
BOSS_SCHEMA="${BOSS_SCHEMA:-pgboss}"

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

# Check Worker
if curl -s http://localhost:8080/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Worker running on port 8080${NC}"
else
    echo -e "${YELLOW}⚠️  Worker not responding on port 8080${NC}"
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

# Test job creation
echo -e "\n${YELLOW}🧪 Creating Test Job:${NC}"

TEST_JOB_DATA='{"test": true, "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
TEST_JOB_ID=$(echo "
INSERT INTO $BOSS_SCHEMA.job (name, data, state, priority, retrylimit, createdon, startafter)
VALUES ('test-pipeline', '$TEST_JOB_DATA', 'created', 1, 3, NOW(), NOW())
RETURNING id;
" | psql "$DATABASE_URL" -t -A 2>/dev/null)

if [ -n "$TEST_JOB_ID" ]; then
    echo -e "${GREEN}✅ Test job created with ID: $TEST_JOB_ID${NC}"

    # Wait a moment for processing
    sleep 2

    # Check if job was processed
    JOB_STATE=$(echo "SELECT state FROM $BOSS_SCHEMA.job WHERE id = '$TEST_JOB_ID';" | psql "$DATABASE_URL" -t -A 2>/dev/null)
    echo -e "${BLUE}📊 Job state: $JOB_STATE${NC}"

    # Clean up test job
    echo "DELETE FROM $BOSS_SCHEMA.job WHERE id = '$TEST_JOB_ID';" | psql "$DATABASE_URL" >/dev/null 2>&1
    echo -e "${GREEN}✅ Test job cleaned up${NC}"
else
    echo -e "${RED}❌ Failed to create test job${NC}"
fi

echo -e "\n${GREEN}🎉 Pipeline test completed!${NC}"
echo -e "\n${BLUE}💡 Monitoring Tips:${NC}"
echo -e "   🔍 Watch logs: ${YELLOW}cd worker && npm run logs${NC}"
echo -e "   🎛️  Database UI: ${YELLOW}open http://127.0.0.1:54323${NC}"
echo -e "   📊 Job queue: ${YELLOW}cd worker && bash scripts/test-transcription.sh${NC}"
echo -e "   🔄 Re-run test: ${YELLOW}bash scripts/test-pipeline.sh${NC}"
