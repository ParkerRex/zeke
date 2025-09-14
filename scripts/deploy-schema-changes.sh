#!/usr/bin/env bash
set -euo pipefail

# ZEKE Database Schema Deployment Script
# Handles migration application and type synchronization across services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  ZEKE Database Schema Deployment${NC}"

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$REPO_ROOT/apps/api"
WORKER_DIR="$REPO_ROOT/apps/worker"
TYPES_FILE="$REPO_ROOT/packages/supabase/src/types/db.ts"

# Environment detection
ENVIRONMENT="${1:-production}"
SKIP_MIGRATION="${2:-false}"

echo -e "${BLUE}📁 Repository root: $REPO_ROOT${NC}"
echo -e "${BLUE}🌍 Environment: $ENVIRONMENT${NC}"

# Validate environment
if [[ ! -d "$API_DIR" ]]; then
    echo -e "${RED}❌ API directory not found: $API_DIR${NC}"
    exit 1
fi

if [[ ! -f "$API_DIR/supabase/config.toml" ]]; then
    echo -e "${RED}❌ Supabase config not found${NC}"
    exit 1
fi

# Check Supabase CLI
if ! command -v supabase >/dev/null 2>&1; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo -e "${YELLOW}💡 Install with: npm install -g supabase${NC}"
    exit 1
fi

# Step 1: Backup current types
echo -e "${YELLOW}📋 Backing up current types...${NC}"
if [[ -f "$TYPES_FILE" ]]; then
    cp "$TYPES_FILE" "$TYPES_FILE.backup"
    echo -e "${GREEN}✅ Types backed up to db.ts.backup${NC}"
fi

# Step 2: Apply migrations (if not skipped)
if [[ "$SKIP_MIGRATION" != "true" ]]; then
    echo -e "${YELLOW}🔄 Applying database migrations...${NC}"
    cd "$API_DIR"
    
    if [[ "$ENVIRONMENT" == "local" ]]; then
        supabase migration up --local
    else
        supabase migration up --linked
    fi
    
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping migration application${NC}"
fi

# Step 3: Generate new types
echo -e "${YELLOW}🔧 Generating TypeScript types...${NC}"
cd "$API_DIR"

if [[ "$ENVIRONMENT" == "local" ]]; then
    supabase gen types typescript --local --schema public > "$TYPES_FILE"
else
    # For production, use project ID from environment or config
    PROJECT_ID="${SUPABASE_PROJECT_ID:-$(grep 'project_id' supabase/config.toml | cut -d'"' -f2)}"
    if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "zeke" ]]; then
        echo -e "${RED}❌ Production PROJECT_ID not found${NC}"
        echo -e "${YELLOW}💡 Set SUPABASE_PROJECT_ID environment variable${NC}"
        exit 1
    fi
    supabase gen types typescript --project-id "$PROJECT_ID" --schema public > "$TYPES_FILE"
fi

echo -e "${GREEN}✅ Types generated successfully${NC}"

# Step 4: Check for type changes
echo -e "${YELLOW}🔍 Checking for type changes...${NC}"
if [[ -f "$TYPES_FILE.backup" ]]; then
    if diff -q "$TYPES_FILE" "$TYPES_FILE.backup" >/dev/null; then
        echo -e "${GREEN}✅ No type changes detected${NC}"
        rm -f "$TYPES_FILE.backup"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Type changes detected${NC}"
        echo -e "${BLUE}📊 Showing diff:${NC}"
        diff "$TYPES_FILE.backup" "$TYPES_FILE" || true
    fi
fi

# Step 5: Validate TypeScript compilation
echo -e "${YELLOW}🔧 Validating TypeScript compilation...${NC}"

# Check main app
echo -e "${BLUE}📱 Checking main app...${NC}"
cd "$REPO_ROOT/apps/app"
if pnpm run typecheck >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Main app types valid${NC}"
else
    echo -e "${RED}❌ Main app type errors detected${NC}"
    pnpm run typecheck
    exit 1
fi

# Check worker
echo -e "${BLUE}🔧 Checking worker...${NC}"
cd "$WORKER_DIR"
if pnpm run lint >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Worker types valid${NC}"
else
    echo -e "${RED}❌ Worker type errors detected${NC}"
    pnpm run lint
    exit 1
fi

# Step 6: Clean up
rm -f "$TYPES_FILE.backup"

echo -e "\n${GREEN}🎉 Schema deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  • Commit the updated types: ${YELLOW}git add packages/supabase/src/types/db.ts${NC}"
echo -e "  • Deploy services with updated types"
echo -e "  • Run integration tests"

# Optional: Show deployment commands
if [[ "$ENVIRONMENT" != "local" ]]; then
    echo -e "\n${BLUE}🚀 Deployment commands:${NC}"
    echo -e "  • Worker: ${YELLOW}cd apps/worker && pnpm run deploy:railway${NC}"
    echo -e "  • Main app: ${YELLOW}Deploy via Vercel dashboard or CLI${NC}"
fi
