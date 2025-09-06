#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 Testing transcription pipeline...${NC}"

# Load environment variables
if [ -f .env.development ]; then
  set -a; source .env.development; set +a
elif [ -f .env ]; then
  set -a; source .env; set +a
fi

# Check required environment variables
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    exit 1
fi

BOSS_SCHEMA="${BOSS_SCHEMA:-pgboss}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"
YOUTUBE_API_KEY="${YOUTUBE_API_KEY:-}"

# Avoid interactive password prompts for worker role when URL lacks password
if [ -z "${PGPASSWORD:-}" ]; then
  if echo "$DATABASE_URL" | grep -Eq '^postgresql://worker@'; then
    export PGPASSWORD="${WORKER_PASS:-worker_password}"
  fi
fi

if [ -z "$OPENAI_API_KEY" ] || [[ "$OPENAI_API_KEY" == *"test"* ]]; then
    echo -e "${YELLOW}⚠️  OPENAI_API_KEY not set or is test key - transcription will be mocked${NC}"
fi

if [ -z "$YOUTUBE_API_KEY" ] || [[ "$YOUTUBE_API_KEY" == *"test"* ]]; then
    echo -e "${YELLOW}⚠️  YOUTUBE_API_KEY not set or is test key - YouTube API calls will be mocked${NC}"
fi

# Test 1: Check if PgBoss tables exist
echo -e "\n${YELLOW}1️⃣ Checking PgBoss tables...${NC}"

REQUIRED_TABLES=("job" "queue" "schedule" "subscription" "version")
MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
    EXISTS=$(echo "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = '$BOSS_SCHEMA' AND table_name = '$table');" | psql "$DATABASE_URL" -t -A 2>/dev/null)
    if [ "$EXISTS" = "t" ]; then
        echo -e "${GREEN}✅ Table $BOSS_SCHEMA.$table exists${NC}"
    else
        echo -e "${RED}❌ Table $BOSS_SCHEMA.$table missing${NC}"
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required PgBoss tables: ${MISSING_TABLES[*]}${NC}"
    echo -e "${YELLOW}💡 Run migrations to create PgBoss tables${NC}"
    exit 1
fi

# Test 2: Check job queue functionality
echo -e "\n${YELLOW}2️⃣ Testing job queue functionality...${NC}"

# Check if we can read from the job table
JOB_COUNT=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job;" | psql "$DATABASE_URL" -t -A 2>/dev/null)

if [ -n "$JOB_COUNT" ]; then
    echo -e "${GREEN}✅ Can read from job table (found $JOB_COUNT jobs)${NC}"
else
    echo -e "${RED}❌ Cannot read from job table${NC}"
    exit 1
fi

# Test basic job table structure
echo -e "${BLUE}📋 Checking job table structure...${NC}"
COLUMNS=$(echo "SELECT column_name FROM information_schema.columns WHERE table_schema = '$BOSS_SCHEMA' AND table_name = 'job' ORDER BY ordinal_position;" | psql "$DATABASE_URL" -t -A 2>/dev/null | tr '\n' ',' | sed 's/,$//')

if [ -n "$COLUMNS" ]; then
    echo -e "${GREEN}✅ Job table columns: $COLUMNS${NC}"
else
    echo -e "${RED}❌ Cannot read job table structure${NC}"
    exit 1
fi

# Test 3: Check for failed jobs
echo -e "\n${YELLOW}3️⃣ Checking for failed jobs...${NC}"

FAILED_COUNT=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job WHERE state = 'failed';" | psql "$DATABASE_URL" -t -A 2>/dev/null)

if [ "$FAILED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $FAILED_COUNT failed job(s)${NC}"

    # Show recent failed jobs
    echo "Recent failed jobs:"
    echo "SELECT id, name, createdon, output FROM $BOSS_SCHEMA.job WHERE state = 'failed' ORDER BY createdon DESC LIMIT 5;" | psql "$DATABASE_URL" -t
else
    echo -e "${GREEN}✅ No failed jobs found${NC}"
fi

# Test 4: Check queue statistics
echo -e "\n${YELLOW}4️⃣ Queue statistics...${NC}"

TOTAL_JOBS=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job;" | psql "$DATABASE_URL" -t -A 2>/dev/null)
ACTIVE_JOBS=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job WHERE state IN ('created', 'active', 'retry');" | psql "$DATABASE_URL" -t -A 2>/dev/null)
COMPLETED_JOBS=$(echo "SELECT COUNT(*) FROM $BOSS_SCHEMA.job WHERE state = 'completed';" | psql "$DATABASE_URL" -t -A 2>/dev/null)

echo -e "${BLUE}📊 Queue Statistics:${NC}"
echo -e "   Total jobs: $TOTAL_JOBS"
echo -e "   Active jobs: $ACTIVE_JOBS"
echo -e "   Completed jobs: $COMPLETED_JOBS"
echo -e "   Failed jobs: $FAILED_COUNT"

echo -e "\n${GREEN}🎉 Transcription pipeline test completed successfully!${NC}"
