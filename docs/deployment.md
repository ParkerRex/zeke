# Deployment Guide

Docker deployment and production configuration.

## Local Docker

### Full Stack

```bash
# Build and run everything
./deploy/run-local.sh

# View logs
cd deploy && docker compose --profile staging logs -f

# Stop
cd deploy && docker compose --profile staging down
```

### Individual Services

```bash
# Start infrastructure only
docker compose up -d postgres redis minio

# Build specific app
docker build -f apps/api/Dockerfile -t zeke-api .
```

## Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                    (Fly.io Proxy)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────┴───────┐ ┌───────┴───────┐ ┌───────┴───────┐
│   API (x3)    │ │ Dashboard (x2)│ │  Website (x2) │
│   Fly.io      │ │   Vercel      │ │   Vercel      │
└───────────────┘ └───────────────┘ └───────────────┘
        │
┌───────┴─────────────────────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │       │
│  │  (Neon/RDS)  │  │  (Upstash)   │  │ (Cloudflare) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Environment Configuration

### Staging

```bash
# deploy/env/staging/.env
NODE_ENV=staging
DATABASE_PRIMARY_URL=postgresql://...
REDIS_URL=redis://...
```

### Production

```bash
# deploy/env/production/.env
NODE_ENV=production
DATABASE_PRIMARY_URL=postgresql://...
REDIS_URL=redis://...
```

## Docker Images

### API

```dockerfile
# apps/api/Dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build:api

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
EXPOSE 3003
CMD ["bun", "run", "dist/index.js"]
```

### Build Commands

```bash
# Build staging images
bun run docker:build:staging

# Deploy to staging
bun run docker:deploy:staging

# Build production
bun run docker:build:production
```

## Database Migrations

### Production Migration

```bash
# Set production database URL
export DATABASE_SESSION_POOLER_URL=postgresql://...

# Run migrations
cd packages/db && bun run migrate
```

### Rollback

```bash
# Drizzle doesn't have built-in rollback
# Create a reverse migration manually
```

## Health Checks

### API Health

```bash
curl https://api.zekehq.com/health
# Returns: { "status": "ok", "region": "iad", ... }

curl https://api.zekehq.com/health/db
# Returns: { "database": "connected", ... }

curl https://api.zekehq.com/health/pools
# Returns: { "pools": { "primary": { ... } } }
```

## Secrets Management

### Required Secrets

| Secret | Description |
|--------|-------------|
| `DATABASE_PRIMARY_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session signing key (32+ chars) |
| `API_SECRET_KEY` | API authentication key |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing |
| `RESEND_API_KEY` | Email service key |
| `MINIO_*` | Storage credentials |

### Fly.io Secrets

```bash
fly secrets set DATABASE_PRIMARY_URL=postgresql://...
fly secrets set AUTH_SECRET=...
fly secrets list
```

## Scaling

### Horizontal Scaling

```bash
# Scale API instances
fly scale count 3 --app zeke-api

# Scale by region
fly scale count 2 --region iad --app zeke-api
fly scale count 1 --region lhr --app zeke-api
```

### Database Connection Pooling

Use connection pooler URL for production:
```bash
DATABASE_PRIMARY_POOLER_URL=postgresql://pooler.neon.tech/...
```

## Monitoring

### Logs

```bash
# Fly.io logs
fly logs --app zeke-api

# Docker logs
docker compose logs -f api
```

### Metrics

- Sentry for error tracking
- OpenPanel for analytics
- Fly.io dashboard for infrastructure

## Rollback

### Fly.io

```bash
# List releases
fly releases --app zeke-api

# Rollback to previous
fly deploy --image registry.fly.io/zeke-api:v123
```

### Vercel

Rollback via Vercel dashboard or:
```bash
vercel rollback
```

## SSL/TLS

### Custom Domains

```bash
# Add domain to Fly.io
fly certs create api.zekehq.com

# Check certificate status
fly certs show api.zekehq.com
```

## Backup

### Database

```bash
# Dump database
pg_dump $DATABASE_PRIMARY_URL > backup.sql

# Restore
psql $DATABASE_PRIMARY_URL < backup.sql
```

### MinIO

```bash
# Sync buckets
mc mirror minio/vault backup/vault
```

## Troubleshooting

### Connection Issues

```bash
# Test database connection
psql $DATABASE_PRIMARY_URL -c "SELECT 1"

# Test Redis
redis-cli -u $REDIS_URL PING
```

### Memory Issues

```bash
# Check memory usage
fly ssh console --app zeke-api
cat /proc/meminfo
```

### Slow Queries

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```
