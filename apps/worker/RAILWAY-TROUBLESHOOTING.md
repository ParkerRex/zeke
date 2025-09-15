# 🚂 Railway Deployment Troubleshooting Guide

## 🚨 Health Check Failures

### **Issue: "service unavailable" during health checks**

**Symptoms:**
- Railway deployment succeeds but health checks fail
- Error: "1/1 replicas never became healthy! Healthcheck failed!"
- All 5 health check attempts return "service unavailable"

**Root Causes & Solutions:**

#### 1. **Startup Timing Issues**
```bash
# Problem: Service takes too long to initialize
# Solution: Increased health check timeout to 60s in railway.toml

[deploy]
healthcheckTimeout = 60  # Increased from 30s
```

#### 2. **Database Connection Delays**
```bash
# Problem: pg-boss initialization blocks startup
# Solution: HTTP server starts BEFORE database connection

# Check logs for database connection issues:
railway logs -f | grep -E "(boss_init|db_connection)"
```

#### 3. **Port Configuration Issues**
```bash
# Problem: Health check hits wrong port
# Verify Railway sets PORT correctly:
railway run echo $PORT

# Should output: 8080
```

#### 4. **Environment Variable Issues**
```bash
# Check all required variables are set:
railway variables

# Required variables:
# - DATABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - NODE_ENV=production
# - PORT=8080
```

### **Debugging Steps**

#### Step 1: Check Railway Logs
```bash
# View real-time deployment logs
railway logs -f

# Look for these key log entries:
# ✅ "worker_service_starting" - Service initialization
# ✅ "http_server_started" - HTTP server ready
# ✅ "worker_service_ready" - Full initialization complete
# ❌ "worker_startup_failed" - Startup error
```

#### Step 2: Test Health Endpoint
```bash
# Get your Railway domain
DOMAIN=$(railway domain)

# Test health check (should return "ok")
curl -v https://$DOMAIN/healthz

# Test readiness check (returns JSON status)
curl -v https://$DOMAIN/ready

# Test detailed status (if available)
curl -v https://$DOMAIN/debug/status
```

#### Step 3: Validate Local Build
```bash
# Test the exact same configuration locally
cd apps/worker
./scripts/test-railway-deployment.sh
```

#### Step 4: Check Database Connectivity
```bash
# Test database connection from Railway
railway run psql $DATABASE_URL -c "SELECT version();"

# Test worker role permissions
railway run psql $DATABASE_URL -c "SELECT current_user;"
```

## 🔧 Common Fixes

### **Fix 1: Increase Health Check Timeout**
```toml
# railway.toml
[deploy]
healthcheckTimeout = 60  # Increased from 30s
```

### **Fix 2: Verify Environment Variables**
```bash
# Set missing variables
railway variables set DATABASE_URL="postgresql://worker:PASSWORD@..."
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-key"
railway variables set NODE_ENV="production"
railway variables set PORT="8080"
```

### **Fix 3: Database Connection Issues**
```bash
# Check if database is accessible
railway run curl -f https://hblelrtwdpukaymtpchv.supabase.co

# Verify SSL configuration
railway variables set USE_SSL="true"
```

### **Fix 4: Force Redeploy**
```bash
# Sometimes Railway needs a fresh deployment
railway up --detach
```

## 📊 Health Check Endpoints

### `/healthz` - Basic Health Check
- **Purpose**: Railway health check endpoint
- **Response**: `"ok"` (200 status)
- **Available**: Immediately after HTTP server starts
- **Use**: Railway deployment health checks

### `/ready` - Readiness Check
- **Purpose**: Full service readiness
- **Response**: JSON with status and timestamp
- **Available**: After complete initialization
- **Use**: Application readiness verification

### `/debug/status` - Detailed Status
- **Purpose**: Comprehensive service status
- **Response**: JSON with database stats, job counts, etc.
- **Available**: After pg-boss initialization
- **Use**: Debugging and monitoring

## 🚨 Emergency Procedures

### **Immediate Rollback**
```bash
# Get deployment history
railway deployments

# Rollback to previous deployment
railway rollback [DEPLOYMENT_ID]
```

### **Force Restart**
```bash
# Restart the service
railway restart
```

### **Check Resource Usage**
```bash
# Monitor resource consumption
railway metrics

# Check if hitting memory/CPU limits
```

## 📈 Monitoring & Alerts

### **Set Up Monitoring**
```bash
# Monitor health endpoint
watch -n 30 'curl -f https://your-domain.railway.app/healthz'

# Monitor logs for errors
railway logs -f | grep -E "(error|failed|timeout)"
```

### **Key Metrics to Watch**
- **Health Check Response Time**: < 5s
- **Startup Time**: < 90s
- **Memory Usage**: < 400MB
- **CPU Usage**: < 50%

## 🔍 Advanced Debugging

### **Enable Debug Logging**
```bash
# Add debug environment variable
railway variables set DEBUG="*"

# Or specific debug patterns
railway variables set DEBUG="worker:*,boss:*"
```

### **Database Query Debugging**
```bash
# Check pg-boss tables
railway run psql $DATABASE_URL -c "\dt pgboss.*"

# Check job queue status
railway run psql $DATABASE_URL -c "SELECT name, state, count(*) FROM pgboss.job GROUP BY 1,2;"
```

### **Network Debugging**
```bash
# Test internal connectivity
railway run curl -v http://localhost:8080/healthz

# Test external connectivity
railway run curl -v https://api.openai.com/v1/models
```

## 📞 Getting Help

### **Railway Support**
- **Discord**: https://discord.gg/railway
- **Documentation**: https://docs.railway.app/
- **Status Page**: https://status.railway.app/

### **ZEKE-Specific Issues**
- **Test Script**: `./scripts/test-railway-deployment.sh`
- **Local Development**: `pnpm dev:worker`
- **Integration Tests**: `pnpm test:integration`

---

**Remember**: The health check endpoint (`/healthz`) is designed to respond immediately, even before full service initialization. If it's failing, the issue is likely with basic HTTP server startup, not database connectivity.
