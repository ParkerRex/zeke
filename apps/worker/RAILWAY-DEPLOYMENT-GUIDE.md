# ZEKE Worker Railway Deployment Guide

## 🚂 Overview

This guide covers the complete Railway deployment workflow for the ZEKE worker service, from initial setup to production deployment with monitoring.

## 📋 Prerequisites

- ✅ Railway CLI installed (`npm install -g @railway/cli`)
- ✅ Railway account created
- ✅ Docker working locally
- ✅ Worker service running locally (tested with `pnpm dev:worker`)

## 🎯 Deployment Strategy Recommendation

### **Hybrid Approach (Recommended)**

1. **Development/Testing**: Manual deployments for rapid iteration
2. **Staging**: Automated deployments from `develop` branch
3. **Production**: Automated deployments from `main` branch with manual approval

This provides flexibility during development while ensuring production stability.

## 🚀 Step-by-Step Deployment

### Phase 1: Initial Railway Setup

#### 1.1 Login and Initialize Project

```bash
# Login to Railway
railway login

# Navigate to worker directory
cd apps/worker

# Initialize Railway project
railway init

# Choose "Empty Project" when prompted
# Name it: "zeke-worker-production" (or similar)
```

#### 1.2 Link to Existing Project (Alternative)

If you want to create the project via Railway dashboard first:

```bash
# Create project in Railway dashboard, then:
railway link [PROJECT_ID]
```

### Phase 2: Supabase Cloud Database Configuration

#### 2.1 Use Existing Supabase Cloud Database

**✅ No need to add Railway PostgreSQL** - We'll use your existing Supabase Cloud database:
- **Project ID**: `hblelrtwdpukaymtpchv`
- **URL**: `https://hblelrtwdpukaymtpchv.supabase.co`
- **Database**: Already configured with all tables and schemas

#### 2.2 Configure Worker Role in Supabase Cloud

The worker role should already exist in your Supabase database. If not, connect to your Supabase database:

```bash
# Connect to your Supabase Cloud database
# Use the connection string from Supabase Dashboard > Settings > Database
PGPASSWORD="CDMciR2rVarPwDuK" psql "postgresql://postgres.hblelrtwdpukaymtpchv:CDMciR2rVarPwDuK@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -c "
-- Create worker role if it doesn't exist
CREATE ROLE worker WITH LOGIN PASSWORD 'your-secure-worker-password';
GRANT CREATE ON DATABASE postgres TO worker;
GRANT USAGE ON SCHEMA public TO worker;
GRANT CREATE ON SCHEMA public TO worker;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO worker;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO worker;
"
```

#### 2.3 Get Supabase Connection Details

From your Supabase Dashboard > Settings > Database:
- **Host**: `aws-0-us-east-1.pooler.supabase.com` (Session Pooler)
- **Database**: `postgres`
- **Port**: `5432`
- **User**: `worker` (the role we created)
- **Password**: Your secure worker password

### Phase 3: Environment Variables Configuration

#### 3.1 Set Required Environment Variables

```bash
# Supabase Cloud database configuration (using Session Pooler for better performance)
railway variables set DATABASE_URL="postgresql://worker:your-secure-worker-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase configuration (for compatibility with existing packages)
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://hblelrtwdpukaymtpchv.supabase.co"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibGVscnR3ZHB1a2F5bXRwY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Njg1MDMsImV4cCI6MjA3MjQ0NDUwM30.PooTgnM30B30on2FBbdri2_eKqIZoR3YZb8i-jtKdjo"
railway variables set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibGVscnR3ZHB1a2F5bXRwY2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg2ODUwMywiZXhwIjoyMDcyNDQ0NTAzfQ.v9LrwYqgSqKb_K0kPrcthSK9-d8bFjWQZOwnN0bDuUw"

# API Keys (replace with your actual keys)
railway variables set OPENAI_API_KEY="your-openai-api-key"
railway variables set YOUTUBE_API_KEY="your-youtube-api-key"

# Worker configuration
railway variables set NODE_ENV="production"
railway variables set PORT="8080"
railway variables set BOSS_SCHEMA="pgboss"
railway variables set BOSS_MIGRATE="false"  # Set to false since schema already exists
railway variables set USE_SSL="true"

# Worker role password for maintenance
railway variables set WORKER_DB_PASSWORD="your-secure-worker-password"
```

#### 3.2 Verify Environment Variables

```bash
# List all environment variables
railway variables

# Test specific variable
railway run echo $DATABASE_URL
```

### Phase 4: Initial Deployment

#### 4.1 Test Local Build

```bash
# Ensure local build works
pnpm build

# Test Docker build locally
docker build -t zeke-worker-test .
```

#### 4.2 Deploy to Railway

```bash
# Deploy using our custom script
pnpm deploy:railway

# Or deploy directly
railway up
```

#### 4.3 Monitor Deployment

```bash
# Watch deployment logs
railway logs -f

# Check deployment status
railway status

# Test health endpoint (once deployed)
curl https://[your-railway-domain]/healthz
```

### Phase 5: Database Schema Verification

#### 5.1 Verify Existing Supabase Schema

Since we're using your existing Supabase Cloud database, the schema should already be in place:

```bash
# Verify pg-boss schema exists (should be created automatically by worker)
PGPASSWORD="your-worker-password" psql "postgresql://worker:your-worker-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -c "\dn pgboss"

# Verify main tables exist
PGPASSWORD="your-worker-password" psql "postgresql://worker:your-worker-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -c "\dt public.sources"

# Check worker role permissions
PGPASSWORD="your-worker-password" psql "postgresql://worker:your-worker-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -c "SELECT current_user, current_database();"
```

**Note**: The worker will automatically create the `pgboss` schema on first startup if `BOSS_MIGRATE=true`.

### Phase 6: Testing and Validation

#### 6.1 Health Checks

```bash
# Test health endpoint
curl https://[your-railway-domain]/healthz

# Test status endpoint
curl https://[your-railway-domain]/debug/status

# Check worker logs
railway logs --tail 50
```

#### 6.2 Job Processing Test

```bash
# Trigger a test job (if you have debug endpoints)
curl -X POST https://[your-railway-domain]/debug/test-job

# Monitor job processing in logs
railway logs -f | grep -E "(job|worker|boss)"
```

## 🔄 Automated Deployment Setup

### Option A: GitHub Integration (Recommended)

#### A.1 Connect Repository

1. Go to Railway dashboard → Your project → Settings → GitHub
2. Connect your GitHub repository
3. Select branch for auto-deployment (`main` for production)

#### A.2 Configure Build Settings

In Railway dashboard:
- **Build Command**: `cd apps/worker && npm run build`
- **Start Command**: `cd apps/worker && npm start`
- **Dockerfile Path**: `apps/worker/Dockerfile`

#### A.3 Environment-Specific Deployments

```bash
# Create separate Railway projects for different environments
railway init --name zeke-worker-staging
railway init --name zeke-worker-production

# Configure different branches
# Staging: auto-deploy from 'develop' branch
# Production: auto-deploy from 'main' branch
```

### Option B: GitHub Actions (Advanced)

Create `.github/workflows/deploy-worker-railway.yml`:

```yaml
name: Deploy Worker to Railway

on:
  push:
    branches: [main]
    paths: ['apps/worker/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
        
      - name: Deploy to Railway
        run: |
          cd apps/worker
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 🔒 Security Best Practices

### Environment Variable Management

```bash
# Use Railway's built-in secret management
railway variables set --secret OPENAI_API_KEY="your-key"

# For sensitive database passwords
railway variables set --secret WORKER_DB_PASSWORD="secure-password"

# Verify secrets are not exposed in logs
railway logs | grep -i "password\|secret\|key"
```

### Database Security

```bash
# Rotate worker role password regularly
railway run psql $DATABASE_URL -c "ALTER ROLE worker PASSWORD 'new-secure-password';"

# Update environment variable
railway variables set DATABASE_URL="postgresql://worker:new-secure-password@[host]:[port]/[db]"
```

## 📊 Monitoring and Logging

### Railway Dashboard Monitoring

1. **Metrics**: CPU, Memory, Network usage
2. **Logs**: Real-time log streaming
3. **Deployments**: Deployment history and rollback
4. **Variables**: Environment variable management

### Custom Monitoring Setup

```bash
# Add health check monitoring
railway variables set HEALTH_CHECK_URL="https://[your-domain]/healthz"

# Set up log aggregation (optional)
railway variables set LOG_LEVEL="info"
railway variables set LOG_FORMAT="json"
```

### Log Management

```bash
# View recent logs
railway logs --tail 100

# Follow logs in real-time
railway logs -f

# Filter logs by level
railway logs -f | grep -E "(ERROR|WARN)"

# Export logs for analysis
railway logs --tail 1000 > worker-logs.txt
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues

```bash
# Test database connectivity
railway run psql $DATABASE_URL -c "SELECT version();"

# Check worker role permissions
railway run psql $DATABASE_URL -c "SELECT current_user, current_database();"
```

#### Build Failures

```bash
# Check build logs
railway logs --deployment [DEPLOYMENT_ID]

# Test build locally
docker build -t test-worker .
docker run -p 8080:8080 test-worker
```

#### Environment Variable Issues

```bash
# Debug environment variables
railway run env

# Test specific variables
railway run echo $DATABASE_URL
```

## 🔄 Deployment Workflows

### Development Workflow

```bash
# 1. Develop locally
pnpm dev:worker

# 2. Test changes
pnpm test:worker

# 3. Deploy to staging
railway up --environment staging

# 4. Test staging deployment
curl https://staging-domain/healthz

# 5. Deploy to production (if tests pass)
railway up --environment production
```

### Production Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health checks working
- [ ] Monitoring configured
- [ ] Rollback plan ready

## 📈 Scaling and Performance

### Resource Configuration

```bash
# Configure resource limits in railway.toml
[resources]
memory = "1Gi"    # Adjust based on needs
cpu = "1"         # Adjust based on needs

# Enable auto-scaling (Railway Pro)
[scaling]
min_replicas = 1
max_replicas = 5
target_cpu = 70
```

### Performance Monitoring

```bash
# Monitor resource usage
railway metrics

# Check job queue performance
curl https://[domain]/debug/status | jq '.boss'
```

## 🎯 Next Steps

1. **Complete initial deployment** following Phase 1-6
2. **Set up automated deployments** (GitHub integration)
3. **Configure monitoring and alerting**
4. **Implement CI/CD pipeline** with testing
5. **Set up staging environment** for testing
6. **Document operational procedures**

---

*For additional help, check Railway documentation or contact the team.*
