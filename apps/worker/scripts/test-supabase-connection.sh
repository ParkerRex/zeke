#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Supabase Connection Test for Railway Deployment${NC}"

# Supabase Cloud configuration
SUPABASE_URL="https://hblelrtwdpukaymtpchv.supabase.co"
SUPABASE_PROJECT_ID="hblelrtwdpukaymtpchv"
SUPABASE_POOLER_HOST="aws-0-us-east-1.pooler.supabase.com"
SUPABASE_POOLER_PORT="5432"
SUPABASE_DB_NAME="postgres"

# Function to test database connection
test_connection() {
    local connection_string="$1"
    local description="$2"
    
    echo -e "\n${BLUE}🔗 Testing $description...${NC}"
    
    if PGPASSWORD="$WORKER_PASSWORD" psql "$connection_string" -c "SELECT current_user, current_database(), version();" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $description connection successful${NC}"
        
        # Get connection details
        local result=$(PGPASSWORD="$WORKER_PASSWORD" psql "$connection_string" -t -c "SELECT current_user || ' @ ' || current_database() || ' (' || split_part(version(), ' ', 2) || ')';")
        echo -e "${BLUE}   Connected as: ${result}${NC}"
        
        return 0
    else
        echo -e "${RED}❌ $description connection failed${NC}"
        return 1
    fi
}

# Function to test worker role permissions
test_permissions() {
    local connection_string="$1"
    local description="$2"
    
    echo -e "\n${BLUE}🔐 Testing $description permissions...${NC}"
    
    # Test basic permissions
    if PGPASSWORD="$WORKER_PASSWORD" psql "$connection_string" -c "
        SELECT 
            has_database_privilege('worker', 'postgres', 'CREATE') as can_create_db,
            has_schema_privilege('worker', 'public', 'CREATE') as can_create_schema,
            has_schema_privilege('worker', 'public', 'USAGE') as can_use_schema;
    " >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $description permissions verified${NC}"
        
        # Show permission details
        local perms=$(PGPASSWORD="$WORKER_PASSWORD" psql "$connection_string" -t -c "
            SELECT 
                'DB CREATE: ' || has_database_privilege('worker', 'postgres', 'CREATE') ||
                ', SCHEMA CREATE: ' || has_schema_privilege('worker', 'public', 'CREATE') ||
                ', SCHEMA USAGE: ' || has_schema_privilege('worker', 'public', 'USAGE');
        ")
        echo -e "${BLUE}   Permissions: ${perms}${NC}"
        
        return 0
    else
        echo -e "${RED}❌ $description permission check failed${NC}"
        return 1
    fi
}

# Function to test pg-boss schema
test_pgboss_schema() {
    local connection_string="$1"
    
    echo -e "\n${BLUE}📋 Testing pg-boss schema...${NC}"
    
    # Check if pgboss schema exists
    local schema_exists=$(PGPASSWORD="$WORKER_PASSWORD" psql "$connection_string" -t -c "
        SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgboss');
    " 2>/dev/null || echo "f")
    
    if [[ "$schema_exists" == *"t"* ]]; then
        echo -e "${GREEN}✅ pgboss schema exists${NC}"
        
        # Count pgboss tables
        local table_count=$(PGPASSWORD="$WORKER_PASSWORD" psql "$connection_string" -t -c "
            SELECT count(*) FROM information_schema.tables WHERE table_schema = 'pgboss';
        " 2>/dev/null || echo "0")
        
        echo -e "${BLUE}   pgboss tables: ${table_count}${NC}"
    else
        echo -e "${YELLOW}⚠️  pgboss schema does not exist (will be created on first run)${NC}"
    fi
}

# Function to test main application tables
test_app_tables() {
    local connection_string="$1"
    
    echo -e "\n${BLUE}📊 Testing application tables...${NC}"
    
    local tables=("sources" "stories" "content" "story_overlays")
    local existing_tables=0
    
    for table in "${tables[@]}"; do
        local exists=$(PGPASSWORD="$WORKER_PASSWORD" psql "$connection_string" -t -c "
            SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');
        " 2>/dev/null || echo "f")
        
        if [[ "$exists" == *"t"* ]]; then
            echo -e "${GREEN}   ✅ $table table exists${NC}"
            ((existing_tables++))
        else
            echo -e "${RED}   ❌ $table table missing${NC}"
        fi
    done
    
    if [[ $existing_tables -eq ${#tables[@]} ]]; then
        echo -e "${GREEN}✅ All application tables exist${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some application tables are missing${NC}"
        return 1
    fi
}

# Main execution
echo -e "${YELLOW}This script tests the Supabase Cloud database connection for Railway deployment.${NC}"
echo -e "${BLUE}Supabase Project: $SUPABASE_PROJECT_ID${NC}"

# Get worker password
if [[ -n "${WORKER_DB_PASSWORD:-}" ]]; then
    WORKER_PASSWORD="$WORKER_DB_PASSWORD"
    echo -e "${GREEN}✅ Using WORKER_DB_PASSWORD from environment${NC}"
else
    echo -e "${YELLOW}🔑 Enter worker role password:${NC}"
    read -s WORKER_PASSWORD
    echo
fi

if [[ -z "$WORKER_PASSWORD" ]]; then
    echo -e "${RED}❌ Worker password is required${NC}"
    exit 1
fi

# Test connections
echo -e "\n${BLUE}🧪 Running connection tests...${NC}"

# Test Session Pooler (recommended for production)
POOLER_URL="postgresql://worker:$WORKER_PASSWORD@$SUPABASE_POOLER_HOST:$SUPABASE_POOLER_PORT/$SUPABASE_DB_NAME"
if test_connection "$POOLER_URL" "Supabase Session Pooler"; then
    test_permissions "$POOLER_URL" "Session Pooler"
    test_pgboss_schema "$POOLER_URL"
    test_app_tables "$POOLER_URL"
    POOLER_SUCCESS=true
else
    POOLER_SUCCESS=false
fi

# Test Direct Connection (fallback)
DIRECT_URL="postgresql://worker:$WORKER_PASSWORD@db.hblelrtwdpukaymtpchv.supabase.co:5432/$SUPABASE_DB_NAME"
if test_connection "$DIRECT_URL" "Supabase Direct Connection"; then
    test_permissions "$DIRECT_URL" "Direct Connection"
    DIRECT_SUCCESS=true
else
    DIRECT_SUCCESS=false
fi

# Summary
echo -e "\n${BLUE}📋 Connection Test Summary${NC}"

if [[ "$POOLER_SUCCESS" == "true" ]]; then
    echo -e "${GREEN}✅ Session Pooler: Ready for Railway deployment${NC}"
    echo -e "${BLUE}   Recommended DATABASE_URL: postgresql://worker:***@$SUPABASE_POOLER_HOST:$SUPABASE_POOLER_PORT/$SUPABASE_DB_NAME${NC}"
elif [[ "$DIRECT_SUCCESS" == "true" ]]; then
    echo -e "${YELLOW}⚠️  Direct Connection: Working but Session Pooler preferred${NC}"
    echo -e "${BLUE}   Fallback DATABASE_URL: postgresql://worker:***@db.hblelrtwdpukaymtpchv.supabase.co:5432/$SUPABASE_DB_NAME${NC}"
else
    echo -e "${RED}❌ No working connections found${NC}"
    echo -e "${YELLOW}💡 Check worker role exists and password is correct${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Supabase connection test complete!${NC}"
echo -e "${BLUE}💡 Use the recommended DATABASE_URL in your Railway environment variables${NC}"
