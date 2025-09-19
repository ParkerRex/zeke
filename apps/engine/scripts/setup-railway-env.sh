#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚂 ZEKE Engine Railway Environment Setup${NC}"

# Check if Railway CLI is installed and logged in
if ! command -v railway >/dev/null 2>&1; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo -e "${YELLOW}💡 Install with: npm install -g @railway/cli${NC}"
    exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
    echo -e "${YELLOW}🔐 Not logged in to Railway${NC}"
    echo -e "${YELLOW}💡 Run: railway login${NC}"
    exit 1
fi

# Function to prompt for input with default
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    echo -e "${YELLOW}$prompt${NC}"
    if [[ -n "$default" ]]; then
        echo -e "${BLUE}Default: $default${NC}"
    fi
    read -r input
    
    if [[ -z "$input" && -n "$default" ]]; then
        input="$default"
    fi
    
    eval "$var_name='$input'"
}

# Function to prompt for secret input
prompt_secret() {
    local prompt="$1"
    local var_name="$2"
    
    echo -e "${YELLOW}$prompt${NC}"
    read -s input
    echo
    eval "$var_name='$input'"
}

# Check if project is linked
if ! railway status >/dev/null 2>&1; then
    echo -e "${YELLOW}🆕 No Railway project linked${NC}"
    echo -e "${YELLOW}💡 Run 'railway init' or 'railway link' first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Railway project linked${NC}"

# Get current environment variables
echo -e "${BLUE}📋 Checking existing environment variables...${NC}"
EXISTING_VARS=$(railway variables 2>/dev/null || echo "")

# Function to check if variable exists
var_exists() {
    local var_name="$1"
    echo "$EXISTING_VARS" | grep -q "^$var_name=" || return 1
}

# Function to set variable if not exists or if user wants to update
set_variable() {
    local var_name="$1"
    local var_value="$2"
    local is_secret="${3:-false}"
    
    if var_exists "$var_name"; then
        echo -e "${YELLOW}⚠️  $var_name already exists${NC}"
        read -p "Update it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    if [[ "$is_secret" == "true" ]]; then
        railway variables set "$var_name=$var_value" --secret
    else
        railway variables set "$var_name=$var_value"
    fi
    
    echo -e "${GREEN}✅ Set $var_name${NC}"
}

echo -e "\n${BLUE}🔧 Setting up environment variables...${NC}"

# Core configuration
echo -e "\n${BLUE}📦 Core Configuration${NC}"

prompt_with_default "Node environment:" "production" NODE_ENV
set_variable "NODE_ENV" "$NODE_ENV"

prompt_with_default "Port:" "8080" PORT
set_variable "PORT" "$PORT"

prompt_with_default "pg-boss schema:" "pgboss" BOSS_SCHEMA
set_variable "BOSS_SCHEMA" "$BOSS_SCHEMA"

prompt_with_default "Enable pg-boss migrations:" "true" BOSS_MIGRATE
set_variable "BOSS_MIGRATE" "$BOSS_MIGRATE"

prompt_with_default "Use SSL for database:" "true" USE_SSL
set_variable "USE_SSL" "$USE_SSL"

# Supabase Cloud Database Configuration
echo -e "\n${BLUE}🗄️  Supabase Cloud Database Configuration${NC}"

echo -e "${GREEN}✅ Using existing Supabase Cloud database${NC}"
echo -e "${BLUE}Project: hblelrtwdpukaymtpchv.supabase.co${NC}"
echo -e "${BLUE}This avoids creating duplicate database infrastructure.${NC}"

# Set Supabase configuration variables
echo -e "\n${YELLOW}🔧 Setting Supabase configuration...${NC}"

# Supabase URL and keys (from your existing configuration)
set_variable "NEXT_PUBLIC_SUPABASE_URL" "https://hblelrtwdpukaymtpchv.supabase.co"
set_variable "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibGVscnR3ZHB1a2F5bXRwY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Njg1MDMsImV4cCI6MjA3MjQ0NDUwM30.PooTgnM30B30on2FBbdri2_eKqIZoR3YZb8i-jtKdjo" true
set_variable "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibGVscnR3ZHB1a2F5bXRwY2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg2ODUwMywiZXhwIjoyMDcyNDQ0NTAzfQ.v9LrwYqgSqKb_K0kPrcthSK9-d8bFjWQZOwnN0bDuUw" true

# Worker role configuration
echo -e "\n${YELLOW}🔑 Worker Role Configuration${NC}"
echo -e "${YELLOW}Configure the worker role for your Supabase database.${NC}"

prompt_secret "Enter worker role password for Supabase database:" WORKER_PASSWORD

# Supabase Session Pooler connection (recommended for production)
SUPABASE_DB_URL="postgresql://worker:$WORKER_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

set_variable "DATABASE_URL" "$SUPABASE_DB_URL" true
set_variable "WORKER_DB_PASSWORD" "$WORKER_PASSWORD" true

echo -e "\n${YELLOW}🔧 Worker role setup in Supabase...${NC}"
echo -e "${BLUE}Connect to your Supabase database and run this SQL:${NC}"
echo -e "${GREEN}"
cat << EOF
-- Connect to Supabase via Dashboard > SQL Editor or psql
-- Create worker role and grant permissions
CREATE ROLE worker WITH LOGIN PASSWORD '$WORKER_PASSWORD';
GRANT CREATE ON DATABASE postgres TO worker;
GRANT USAGE ON SCHEMA public TO worker;
GRANT CREATE ON SCHEMA public TO worker;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO worker;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO worker;
EOF
echo -e "${NC}"

echo -e "\n${BLUE}💡 You can also run this via Supabase Dashboard > SQL Editor${NC}"
read -p "Press Enter after creating the worker role in Supabase..."

# API Keys
echo -e "\n${BLUE}🔑 API Keys${NC}"

if ! var_exists "OPENAI_API_KEY"; then
    prompt_secret "Enter OpenAI API key:" OPENAI_API_KEY
    if [[ -n "$OPENAI_API_KEY" ]]; then
        set_variable "OPENAI_API_KEY" "$OPENAI_API_KEY" true
    fi
else
    echo -e "${GREEN}✅ OPENAI_API_KEY already set${NC}"
fi

if ! var_exists "YOUTUBE_API_KEY"; then
    prompt_secret "Enter YouTube API key (optional):" YOUTUBE_API_KEY
    if [[ -n "$YOUTUBE_API_KEY" ]]; then
        set_variable "YOUTUBE_API_KEY" "$YOUTUBE_API_KEY" true
    fi
else
    echo -e "${GREEN}✅ YOUTUBE_API_KEY already set${NC}"
fi

# Optional configuration
echo -e "\n${BLUE}⚙️  Optional Configuration${NC}"

prompt_with_default "Log level:" "info" LOG_LEVEL
set_variable "LOG_LEVEL" "$LOG_LEVEL"

prompt_with_default "Log format:" "json" LOG_FORMAT
set_variable "LOG_FORMAT" "$LOG_FORMAT"

# Summary
echo -e "\n${GREEN}🎉 Environment setup complete!${NC}"
echo -e "\n${BLUE}📋 Summary of configured variables:${NC}"
railway variables | grep -E "(NODE_ENV|PORT|DATABASE_URL|OPENAI_API_KEY|BOSS_SCHEMA)" || true

echo -e "\n${BLUE}🚀 Next steps:${NC}"
echo -e "${YELLOW}1. Verify database worker role is created${NC}"
echo -e "${YELLOW}2. Test deployment: pnpm deploy:railway${NC}"
echo -e "${YELLOW}3. Check health: curl https://[your-domain]/healthz${NC}"
echo -e "${YELLOW}4. Monitor logs: railway logs -f${NC}"

echo -e "\n${GREEN}✅ Ready for deployment!${NC}"
