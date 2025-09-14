# 🚂 Railway Deployment Checklist

## 📋 Pre-Deployment Checklist

### Local Environment
- [ ] Worker service running locally (`pnpm dev:worker`)
- [ ] All tests passing (`pnpm test:worker`)
- [ ] Docker build successful (`docker build -t test .`)
- [ ] Health endpoint responding (`curl http://localhost:8082/healthz`)

### Railway CLI Setup
- [ ] Railway CLI installed (`railway --version`)
- [ ] Logged into Railway (`railway whoami`)
- [ ] Project initialized or linked (`railway status`)

## 🚀 Deployment Steps

### Step 1: Initial Setup
```bash
# Navigate to worker directory
cd apps/worker

# Initialize Railway project (if not done)
railway init

# Or link to existing project
railway link [PROJECT_ID]
```

### Step 2: Supabase Database Setup
```bash
# ✅ No need to add Railway PostgreSQL - using existing Supabase Cloud
# Supabase Project: hblelrtwdpukaymtpchv.supabase.co

# Run environment setup script (configured for Supabase)
pnpm setup:railway
```

### Step 3: Environment Configuration
- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `DATABASE_URL` (Supabase Session Pooler with worker role)
- [ ] `NEXT_PUBLIC_SUPABASE_URL=https://hblelrtwdpukaymtpchv.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from existing config)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (from existing config)
- [ ] `OPENAI_API_KEY`
- [ ] `YOUTUBE_API_KEY` (optional)
- [ ] `BOSS_SCHEMA=pgboss`
- [ ] `BOSS_MIGRATE=false` (schema already exists)
- [ ] `USE_SSL=true`

### Step 4: Supabase Worker Role
Execute in Supabase Cloud database (via Dashboard > SQL Editor):
```sql
CREATE ROLE worker WITH LOGIN PASSWORD 'your-secure-password';
GRANT CREATE ON DATABASE postgres TO worker;
GRANT USAGE ON SCHEMA public TO worker;
GRANT CREATE ON SCHEMA public TO worker;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO worker;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO worker;
```

### Step 5: Deploy
```bash
# Deploy using custom script
pnpm deploy:railway

# Or deploy directly
railway up
```

## ✅ Post-Deployment Verification

### Health Checks
- [ ] Deployment successful (`railway status`)
- [ ] Health endpoint responding (`curl https://[domain]/healthz`)
- [ ] Status endpoint accessible (`curl https://[domain]/debug/status`)
- [ ] No errors in logs (`railway logs --tail 50`)

### Functionality Tests
- [ ] Worker role can connect to database
- [ ] pg-boss schema created successfully
- [ ] Job queues initialized
- [ ] Job workers started
- [ ] Heartbeat jobs running

### Monitoring Setup
- [ ] Railway dashboard monitoring configured
- [ ] Log aggregation working
- [ ] Health check alerts set up
- [ ] Resource usage within limits

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Test database connectivity
railway run psql $DATABASE_URL -c "SELECT version();"

# Check worker role
railway run psql $DATABASE_URL -c "SELECT current_user;"
```

#### Build Failures
```bash
# Check build logs
railway logs --deployment [DEPLOYMENT_ID]

# Test local build
docker build -t test-worker .
```

#### Environment Variable Issues
```bash
# List all variables
railway variables

# Test specific variable
railway run echo $DATABASE_URL
```

#### Job Processing Issues
```bash
# Check pg-boss tables
railway run psql $DATABASE_URL -c "\dt pgboss.*"

# Monitor job logs
railway logs -f | grep -E "(job|boss|worker)"
```

## 📊 Monitoring Commands

```bash
# View real-time logs
railway logs -f

# Check resource usage
railway metrics

# View deployment history
railway deployments

# Check service status
railway status

# Test health endpoint
curl https://[your-domain]/healthz

# Test status endpoint
curl https://[your-domain]/debug/status | jq
```

## 🔄 Ongoing Operations

### Regular Maintenance
- [ ] Monitor resource usage weekly
- [ ] Check logs for errors daily
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly

### Scaling Considerations
- [ ] Monitor job queue depth
- [ ] Track processing times
- [ ] Watch memory usage
- [ ] Monitor database connections

### Backup and Recovery
- [ ] Database backups configured
- [ ] Environment variables documented
- [ ] Rollback procedure tested
- [ ] Disaster recovery plan ready

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# View deployment history
railway deployments

# Rollback to previous deployment
railway rollback [DEPLOYMENT_ID]
```

### Scale Resources
```bash
# Increase memory/CPU in railway.toml
[resources]
memory = "1Gi"
cpu = "1"

# Redeploy
railway up
```

### Emergency Database Access
```bash
# Connect to Railway database
railway run psql $DATABASE_URL

# Check worker role status
SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'worker';
```

## 📞 Support Resources

- **Railway Documentation**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **ZEKE Worker Logs**: `railway logs -f`
- **Health Check**: `https://[domain]/healthz`
- **Status Check**: `https://[domain]/debug/status`

---

*Keep this checklist handy for all Railway deployments!*
