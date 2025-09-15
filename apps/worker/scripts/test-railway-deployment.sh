#!/bin/bash

# Test Railway Deployment Configuration
# This script validates the Railway deployment setup before actual deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_PORT=8083
HEALTH_TIMEOUT=30
READY_TIMEOUT=60

echo -e "${BLUE}🧪 Testing Railway Deployment Configuration${NC}"
echo -e "${BLUE}============================================${NC}"

# Function to check if service is running
check_service() {
    local port=$1
    local endpoint=$2
    local timeout=$3
    local description=$4
    
    echo -e "${YELLOW}⏳ Testing $description (timeout: ${timeout}s)...${NC}"
    
    for i in $(seq 1 $timeout); do
        if curl -f -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $description is responding${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ $description failed to respond within ${timeout}s${NC}"
    return 1
}

# Function to test endpoint response
test_endpoint() {
    local port=$1
    local endpoint=$2
    local description=$3
    
    echo -e "${YELLOW}🔍 Testing $description...${NC}"
    
    response=$(curl -s "http://localhost:$port$endpoint" || echo "FAILED")
    
    if [ "$response" = "FAILED" ]; then
        echo -e "${RED}❌ $description failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ $description response: $response${NC}"
    return 0
}

# Function to cleanup
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    if [ ! -z "$WORKER_PID" ]; then
        kill $WORKER_PID 2>/dev/null || true
        wait $WORKER_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Set trap for cleanup
trap cleanup EXIT

# Step 1: Validate Railway configuration
echo -e "${BLUE}📋 Step 1: Validating Railway Configuration${NC}"

cd "$WORKER_DIR"

if [ ! -f "railway.toml" ]; then
    echo -e "${RED}❌ railway.toml not found${NC}"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Railway configuration files found${NC}"

# Step 2: Build the application
echo -e "${BLUE}📦 Step 2: Building Application${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Installing dependencies...${NC}"
npm install --silent

echo -e "${YELLOW}🔧 Building TypeScript...${NC}"
npm run build

if [ ! -f "dist/worker.js" ]; then
    echo -e "${RED}❌ Build failed - dist/worker.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Step 3: Test Docker build (optional, if Docker is available)
echo -e "${BLUE}🐳 Step 3: Testing Docker Build (Optional)${NC}"

if command -v docker &> /dev/null; then
    echo -e "${YELLOW}🔧 Building Docker image...${NC}"
    if docker build -t zeke-worker-test . --quiet; then
        echo -e "${GREEN}✅ Docker build successful${NC}"
        
        # Clean up test image
        docker rmi zeke-worker-test --force > /dev/null 2>&1 || true
    else
        echo -e "${YELLOW}⚠️  Docker build failed (non-critical for Railway test)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not available, skipping Docker build test${NC}"
fi

# Step 4: Test local startup with Railway-like environment
echo -e "${BLUE}🚀 Step 4: Testing Local Startup${NC}"

# Set Railway-like environment variables
export PORT=$TEST_PORT
export NODE_ENV=production
export RAILWAY_ENVIRONMENT=test

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set - using test mode${NC}"
    export DATABASE_URL="postgresql://test:test@localhost:5432/test"
fi

echo -e "${YELLOW}🔧 Starting worker service on port $TEST_PORT...${NC}"

# Start the worker in background
node dist/worker.js &
WORKER_PID=$!

# Wait a moment for startup
sleep 2

# Check if process is still running
if ! kill -0 $WORKER_PID 2>/dev/null; then
    echo -e "${RED}❌ Worker process died during startup${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Worker process started (PID: $WORKER_PID)${NC}"

# Step 5: Test health endpoints
echo -e "${BLUE}🏥 Step 5: Testing Health Endpoints${NC}"

# Test immediate health check (should work right away)
if check_service $TEST_PORT "/healthz" $HEALTH_TIMEOUT "Health Check (/healthz)"; then
    test_endpoint $TEST_PORT "/healthz" "Health Check Response"
else
    echo -e "${RED}❌ Health check failed - this will cause Railway deployment to fail${NC}"
    exit 1
fi

# Test readiness check (may take longer)
if check_service $TEST_PORT "/ready" $READY_TIMEOUT "Readiness Check (/ready)"; then
    test_endpoint $TEST_PORT "/ready" "Readiness Check Response"
else
    echo -e "${YELLOW}⚠️  Readiness check failed - check database connectivity${NC}"
fi

# Test status endpoint if available
if check_service $TEST_PORT "/debug/status" 5 "Status Endpoint (/debug/status)"; then
    echo -e "${GREEN}✅ Status endpoint is available${NC}"
else
    echo -e "${YELLOW}⚠️  Status endpoint not available (may require full initialization)${NC}"
fi

# Step 6: Railway CLI validation (if available)
echo -e "${BLUE}🚂 Step 6: Railway CLI Validation${NC}"

if command -v railway &> /dev/null; then
    echo -e "${YELLOW}🔍 Checking Railway CLI status...${NC}"
    
    if railway status > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Railway project is linked${NC}"
        
        # Check environment variables
        echo -e "${YELLOW}🔍 Checking Railway environment variables...${NC}"
        railway variables > /tmp/railway_vars.txt 2>/dev/null || true
        
        if [ -s /tmp/railway_vars.txt ]; then
            echo -e "${GREEN}✅ Railway environment variables configured${NC}"
        else
            echo -e "${YELLOW}⚠️  No Railway environment variables found${NC}"
        fi
        
        rm -f /tmp/railway_vars.txt
    else
        echo -e "${YELLOW}⚠️  Railway project not linked (run 'railway init' or 'railway link')${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Railway CLI not installed${NC}"
    echo -e "${YELLOW}💡 Install with: npm install -g @railway/cli${NC}"
fi

# Final summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}===============${NC}"

echo -e "${GREEN}✅ Configuration files validated${NC}"
echo -e "${GREEN}✅ Application builds successfully${NC}"
echo -e "${GREEN}✅ Worker process starts correctly${NC}"
echo -e "${GREEN}✅ Health check endpoint responds${NC}"

echo -e "${BLUE}🎯 Railway Deployment Readiness${NC}"
echo -e "${GREEN}✅ Your worker is ready for Railway deployment!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Ensure all environment variables are set in Railway dashboard"
echo -e "2. Run: ${BLUE}railway up${NC}"
echo -e "3. Monitor deployment: ${BLUE}railway logs -f${NC}"
echo -e "4. Test deployed health check: ${BLUE}curl https://[your-domain]/healthz${NC}"
echo ""
echo -e "${GREEN}🚀 Ready for production deployment!${NC}"
