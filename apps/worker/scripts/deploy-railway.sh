#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚂 ZEKE Worker Railway Deployment${NC}"

# Check if Railway CLI is installed
if ! command -v railway >/dev/null 2>&1; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo -e "${YELLOW}💡 Install with: npm install -g @railway/cli${NC}"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami >/dev/null 2>&1; then
    echo -e "${YELLOW}🔐 Not logged in to Railway${NC}"
    echo -e "${YELLOW}💡 Run: railway login${NC}"
    exit 1
fi

# Get current directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"

echo -e "${BLUE}📁 Working directory: $ROOT_DIR${NC}"
echo -e "${BLUE}📁 Repository root: $REPO_ROOT${NC}"

# Check if railway.toml exists
if [[ ! -f "$ROOT_DIR/railway.toml" ]]; then
    echo -e "${RED}❌ railway.toml not found${NC}"
    echo -e "${YELLOW}💡 Create railway.toml configuration first${NC}"
    exit 1
fi

# Build the application
echo -e "${YELLOW}🔨 Building worker application...${NC}"
cd "$ROOT_DIR"

# Copy pnpm-lock.yaml temporarily for Docker build
echo -e "${YELLOW}📋 Copying pnpm-lock.yaml...${NC}"
cp "$REPO_ROOT/pnpm-lock.yaml" "$ROOT_DIR/pnpm-lock.yaml"

# Check for updated database types
echo -e "${YELLOW}🔍 Checking database types...${NC}"
TYPES_FILE="$REPO_ROOT/packages/supabase/src/types/db.ts"
if [[ -f "$TYPES_FILE" ]]; then
    echo -e "${GREEN}✅ Database types found${NC}"
    # Check if types are recent (modified within last hour)
    if [[ $(find "$TYPES_FILE" -mmin -60 2>/dev/null) ]]; then
        echo -e "${GREEN}✅ Types are recent (modified within last hour)${NC}"
    else
        echo -e "${YELLOW}⚠️  Database types may be outdated${NC}"
        echo -e "${YELLOW}💡 Run 'pnpm run types:generate' to update${NC}"
    fi
else
    echo -e "${RED}❌ Database types not found${NC}"
    echo -e "${YELLOW}💡 Generate types first: cd apps/api && supabase gen types typescript --local --schema public > ../../packages/supabase/src/types/db.ts${NC}"
    exit 1
fi

# Build TypeScript
echo -e "${YELLOW}🔧 Building TypeScript...${NC}"
npm run build

# Clean up temporary file
rm -f "$ROOT_DIR/pnpm-lock.yaml"

echo -e "${GREEN}✅ Build completed${NC}"

# Deploy to Railway
echo -e "${YELLOW}🚂 Deploying to Railway...${NC}"

# Check if project exists
if railway status >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Railway project found${NC}"
else
    echo -e "${YELLOW}🆕 No Railway project found${NC}"
    echo -e "${YELLOW}💡 Run 'railway init' to create a new project${NC}"
    
    read -p "Create new Railway project? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway init
    else
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

# Set environment variables (if not already set)
echo -e "${YELLOW}🔧 Checking environment variables...${NC}"

# Check required environment variables
REQUIRED_VARS=("DATABASE_URL" "OPENAI_API_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! railway variables get "$var" >/dev/null 2>&1; then
        MISSING_VARS+=("$var")
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Missing environment variables: ${MISSING_VARS[*]}${NC}"
    echo -e "${YELLOW}💡 Set them with: railway variables set KEY=value${NC}"
    echo -e "${YELLOW}💡 Or set them in the Railway dashboard${NC}"
    
    read -p "Continue deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

# Deploy
echo -e "${YELLOW}🚀 Starting deployment...${NC}"
railway up

# Check deployment status
echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"
sleep 10

if railway status | grep -q "Deployed"; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(railway domain 2>/dev/null || echo "No domain configured")
    if [[ "$DEPLOYMENT_URL" != "No domain configured" ]]; then
        echo -e "${BLUE}🌐 Deployment URL: ${YELLOW}$DEPLOYMENT_URL${NC}"
        echo -e "${BLUE}🏥 Health check: ${YELLOW}$DEPLOYMENT_URL/healthz${NC}"
        echo -e "${BLUE}📊 Status: ${YELLOW}$DEPLOYMENT_URL/debug/status${NC}"
    else
        echo -e "${YELLOW}💡 Configure a domain with: railway domain${NC}"
    fi
    
    # Show logs
    echo -e "\n${BLUE}📋 Recent logs:${NC}"
    railway logs --tail 20
    
else
    echo -e "${RED}❌ Deployment may have failed${NC}"
    echo -e "${YELLOW}📋 Check logs with: railway logs${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Railway deployment complete!${NC}"
echo -e "${BLUE}💡 Monitor with: railway logs -f${NC}"
echo -e "${BLUE}💡 Check status with: railway status${NC}"
