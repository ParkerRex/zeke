# Smoke Test Checklist

Run these commands to verify everything works end-to-end.

## Prerequisites
- [ ] Bun installed (`bun --version`)
- [ ] Docker running (`docker ps`)
- [ ] Clean install: `bun install`

## Dev Scripts (Native)

### Individual Services
```bash
# Start Redis (required for API)
bun redis:start

# Test API individually
bun dev:api
# Should start on http://localhost:3003
# Ctrl+C to stop

# Test Dashboard individually  
bun dev:dashboard
# Should start on http://localhost:3001
# Ctrl+C to stop

# Test Website individually
bun dev:website
# Should start on http://localhost:3000
# Ctrl+C to stop
```

### All Services
```bash
# Start everything at once
bun dev
# Should start Redis + API + Dashboard
# Ctrl+C to stop all

# Clean shutdown
bun stop
```

## Build Scripts

```bash
# Build all apps
bun build
# Should build packages/db, packages/ui, apps/dashboard, apps/website

# Typecheck
bun typecheck
# Should typecheck api, dashboard, website

# Lint
bun lint
# Should lint all files + run manypkg check
```

## Docker Scripts (Containerized)

### Local
```bash
# Build local containers
bun docker:build:local
# Should build 4 images: zeke-api:local, zeke-dashboard:local, etc.

# Run containers locally
bun docker:up:local
# Visit http://localhost:3001 (dashboard), http://localhost:3000 (website)

# View logs
bun docker:logs:local

# Stop containers
bun docker:down:local
```

### Staging (requires .env.deploy)
```bash
# Copy example config
cp .env.deploy.example .env.deploy
# Edit and set REGISTRY, STAGING_DOCKER_HOST

# Build and push
bun docker:build:staging

# Deploy to staging
bun docker:deploy:staging
```

### Production (requires .env.deploy)
```bash
# Build and push
bun docker:build:prod

# Deploy to production
bun docker:deploy:prod
```

## Database

```bash
# Run migrations (dev)
bun db:migrate

# Open Drizzle Studio
bun db:studio
```

## Expected Behavior

### ✅ Success Indicators
- No "Module not found" errors
- Docs explain the Bun-only workflow
- Services start on correct ports
- Hot reload works for API changes
- Docker containers build without errors
- All scripts complete without 404s

### ❌ Common Issues
- **Port already in use**: Kill existing processes or change ports
- **Redis connection failed**: Run `bun redis:start` first
- **Docker build fails**: Check Dockerfiles and .env files
- **Module resolution errors**: Check working directory in script

## Quick Verification

Run this one-liner to test everything:
```bash
bun install && \
bun lint && \
bun typecheck && \
echo "✓ All checks passed"
```
