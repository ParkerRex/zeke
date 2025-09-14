# 🚂 Railway + Supabase Cloud Integration Guide

## 📋 Overview

This guide explains how to deploy the ZEKE worker service to Railway while using your existing Supabase Cloud database, avoiding the complexity and cost of duplicate database infrastructure.

## ✅ Why Use Existing Supabase Cloud Database?

### Benefits
- **🔄 Consistency**: Same database used by all ZEKE services
- **💰 Cost Effective**: No duplicate database infrastructure
- **🛡️ Security**: Centralized database security and access control
- **📊 Monitoring**: Single database to monitor and maintain
- **🔧 Maintenance**: Unified backup, migration, and scaling strategy

### Your Existing Setup
- **Project ID**: `hblelrtwdpukaymtpchv`
- **URL**: `https://hblelrtwdpukaymtpchv.supabase.co`
- **Database**: Already configured with all tables, schemas, and data
- **Integration**: Used by `packages/supabase/**` and `apps/api/**`

## 🔧 Configuration Changes Made

### 1. Railway Configuration (`railway.toml`)
```toml
# Updated to use Supabase Cloud instead of Railway PostgreSQL
DATABASE_URL = "postgresql://worker:${{WORKER_DB_PASSWORD}}@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL = "https://hblelrtwdpukaymtpchv.supabase.co"
BOSS_MIGRATE = "false"  # Schema already exists in Supabase
```

### 2. Environment Setup Script (`setup-railway-env.sh`)
- **Removed**: Railway PostgreSQL provisioning
- **Added**: Supabase Cloud configuration
- **Updated**: Connection strings to use Supabase Session Pooler
- **Enhanced**: Worker role setup instructions for Supabase

### 3. Deployment Guide Updates
- **Removed**: Railway database creation steps
- **Added**: Supabase worker role configuration
- **Updated**: Connection testing procedures
- **Enhanced**: Troubleshooting for Supabase connections

## 🌐 Networking & Connection Considerations

### Connection Methods

#### 1. Session Pooler (Recommended for Railway)
```bash
DATABASE_URL="postgresql://worker:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```
**Benefits**:
- ✅ Connection pooling for better performance
- ✅ Reduced connection overhead
- ✅ Better suited for serverless/container environments
- ✅ Automatic connection management

#### 2. Direct Connection (Fallback)
```bash
DATABASE_URL="postgresql://worker:password@db.hblelrtwdpukaymtpchv.supabase.co:5432/postgres"
```
**Use Cases**:
- Debugging connection issues
- Development testing
- Fallback if Session Pooler has issues

### SSL/TLS Configuration
```javascript
// Automatic SSL detection in worker/src/db.ts
const useSsl = !(
  cnn.includes('127.0.0.1') ||
  cnn.includes('localhost') ||
  cnn.includes('host.docker.internal')
);
```
- **Supabase Cloud**: SSL automatically enabled
- **Local Development**: SSL disabled for local Supabase

## 🔐 Authentication & Security

### Worker Role Setup
The worker role needs to be created in your Supabase Cloud database:

```sql
-- Execute in Supabase Dashboard > SQL Editor
CREATE ROLE worker WITH LOGIN PASSWORD 'your-secure-password';
GRANT CREATE ON DATABASE postgres TO worker;
GRANT USAGE ON SCHEMA public TO worker;
GRANT CREATE ON SCHEMA public TO worker;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO worker;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO worker;
```

### Environment Variables for Railway
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://hblelrtwdpukaymtpchv.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Worker Database Connection
DATABASE_URL="postgresql://worker:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
WORKER_DB_PASSWORD="your-secure-password"

# Worker Configuration
BOSS_SCHEMA="pgboss"
BOSS_MIGRATE="false"  # Schema already exists
USE_SSL="true"
```

## 🧪 Testing & Validation

### Connection Testing
```bash
# Test Supabase connection before deployment
cd apps/worker
pnpm test:supabase

# This will test:
# - Session Pooler connection
# - Direct connection (fallback)
# - Worker role permissions
# - pg-boss schema existence
# - Application table verification
```

### Deployment Validation
```bash
# After Railway deployment
curl https://[your-railway-domain]/healthz
curl https://[your-railway-domain]/debug/status

# Check Railway logs
railway logs -f

# Monitor worker job processing
railway logs -f | grep -E "(job|boss|worker)"
```

## 🚀 Deployment Workflow

### Step 1: Prepare Supabase
```bash
# 1. Create worker role in Supabase (via SQL Editor)
# 2. Test connection locally
pnpm test:supabase
```

### Step 2: Configure Railway
```bash
# 1. Initialize Railway project
cd apps/worker
railway init

# 2. Set up environment variables
pnpm setup:railway

# 3. Deploy
pnpm deploy:railway
```

### Step 3: Verify Deployment
```bash
# 1. Check health endpoints
# 2. Monitor logs
# 3. Verify job processing
```

## 🔍 Monitoring & Troubleshooting

### Connection Issues
```bash
# Test from Railway environment
railway run psql $DATABASE_URL -c "SELECT current_user, current_database();"

# Check worker role permissions
railway run psql $DATABASE_URL -c "SELECT has_database_privilege('worker', 'postgres', 'CREATE');"
```

### Performance Monitoring
- **Supabase Dashboard**: Monitor database performance
- **Railway Dashboard**: Monitor application performance
- **Worker Logs**: Monitor job processing

### Common Issues & Solutions

#### 1. Connection Timeouts
- **Solution**: Use Session Pooler instead of direct connection
- **Configuration**: Increase connection timeout in `db.ts`

#### 2. Permission Denied
- **Solution**: Verify worker role permissions in Supabase
- **Check**: Run permission test script

#### 3. Schema Not Found
- **Solution**: Ensure `BOSS_MIGRATE=true` for first deployment
- **Verify**: Check pgboss schema exists

## 📊 Performance Considerations

### Connection Pooling
```javascript
// Optimized for Supabase Cloud in worker/src/db.ts
const pool = new Pool({
  connectionString: cnn,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  keepAlive: true,
  max: 3,  // Conservative for Supabase limits
  idleTimeoutMillis: 30_000,
  query_timeout: 30_000,
  statement_timeout: 30_000,
});
```

### Supabase Limits
- **Connection Limit**: Varies by plan (check Supabase dashboard)
- **Session Pooler**: Recommended for production workloads
- **Query Timeout**: Configured for long-running jobs

## 🎯 Next Steps

1. **Test Connection**: `pnpm test:supabase`
2. **Setup Railway**: `pnpm setup:railway`
3. **Deploy**: `pnpm deploy:railway`
4. **Monitor**: Check health endpoints and logs
5. **Scale**: Monitor performance and adjust resources

## 📞 Support

- **Connection Issues**: Use `test-supabase-connection.sh`
- **Railway Issues**: Check Railway logs and dashboard
- **Database Issues**: Monitor Supabase dashboard
- **Worker Issues**: Check worker logs and status endpoints

---

*This integration leverages your existing Supabase infrastructure while providing the scalability and deployment benefits of Railway.*
