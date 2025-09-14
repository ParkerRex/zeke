#!/bin/bash

# Emergency Rollback Script for RLS Optimizations
# This script provides a safe way to rollback the RLS optimizations
# without creating a migration file that would auto-execute

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  EMERGENCY ROLLBACK: RLS Optimizations${NC}"
echo "=================================================="
echo ""
echo "This script will rollback the RLS optimizations to their original state."
echo "This should only be used if the optimizations are causing issues."
echo ""

# Confirmation prompt
read -p "Are you sure you want to rollback the RLS optimizations? (yes/no): " confirm
if [[ $confirm != "yes" ]]; then
    echo -e "${YELLOW}Rollback cancelled.${NC}"
    exit 0
fi

# Determine environment
if [[ "$1" == "--production" ]]; then
    ENVIRONMENT="production"
    DB_FLAG="--linked"
    echo -e "${RED}🚨 PRODUCTION ROLLBACK${NC}"
else
    ENVIRONMENT="local"
    DB_FLAG="--local"
    echo -e "${YELLOW}📍 Local rollback${NC}"
fi

echo ""
echo -e "${YELLOW}🔄 Starting rollback process...${NC}"

# Create backup before rollback
echo -e "\n${YELLOW}📦 Creating backup before rollback...${NC}"
BACKUP_FILE="backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql"
if [[ "$ENVIRONMENT" == "production" ]]; then
    supabase db dump --linked > "$BACKUP_FILE"
else
    supabase db dump --local > "$BACKUP_FILE"
fi
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"

# Apply rollback SQL directly
echo -e "\n${YELLOW}🔄 Applying rollback SQL...${NC}"

# Execute the rollback SQL directly without creating a migration
supabase db query $DB_FLAG "$(cat docs/database/rollback-migrations/20250914173620_rollback_rls_optimizations.sql)"

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Rollback SQL applied successfully${NC}"
else
    echo -e "${RED}❌ Rollback failed! Check the error above.${NC}"
    echo -e "${YELLOW}💡 You can restore from backup: $BACKUP_FILE${NC}"
    exit 1
fi

# Verify rollback
echo -e "\n${YELLOW}🔍 Verifying rollback...${NC}"

# Check that original policies are restored
ORIGINAL_POLICIES_COUNT=$(supabase db query $DB_FLAG "
SELECT COUNT(*) FROM pg_policies 
WHERE tablename IN ('users', 'subscriptions', 'highlights') 
AND policyname IN ('Can view own user data.', 'Can only view own subs data.', 'highlights_owner_all');
" | tail -n +3 | head -n 1 | xargs)

if [[ "$ORIGINAL_POLICIES_COUNT" == "3" ]]; then
    echo -e "${GREEN}✅ Original policies restored${NC}"
else
    echo -e "${RED}❌ Policy verification failed${NC}"
    exit 1
fi

# Check that consolidated policies are removed
CONSOLIDATED_POLICIES_COUNT=$(supabase db query $DB_FLAG "
SELECT COUNT(*) FROM pg_policies 
WHERE policyname LIKE '%_consolidated';
" | tail -n +3 | head -n 1 | xargs)

if [[ "$CONSOLIDATED_POLICIES_COUNT" == "0" ]]; then
    echo -e "${GREEN}✅ Consolidated policies removed${NC}"
else
    echo -e "${RED}❌ Consolidated policies still exist${NC}"
    exit 1
fi

# Generate types after rollback
if [[ "$ENVIRONMENT" == "local" ]]; then
    echo -e "\n${YELLOW}🔄 Regenerating database types...${NC}"
    pnpm types:generate
    echo -e "${GREEN}✅ Database types regenerated${NC}"
fi

echo -e "\n${GREEN}🎉 Rollback completed successfully!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "- RLS optimizations have been rolled back"
echo "- Original policy structure restored"
echo "- Database backup created: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "1. Test application functionality"
echo "2. Monitor for any remaining issues"
echo "3. Consider investigating the root cause of the optimization issues"
echo ""
echo -e "${YELLOW}💡 To re-apply optimizations later, run: pnpm db:migrate${NC}"
