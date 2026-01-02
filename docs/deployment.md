# Deployment Guide

Self-hosted Docker deployment on VPS.

## Quick Reference

| Command | Description |
|---------|-------------|
| `bun dev` | Start local dev (Docker + apps) |
| `bun run stop` | Stop local apps |
| `bun run stop -- --docker` | Stop local apps + Docker |
| `./scripts/containers.sh build prod` | Build production images |
| `./scripts/containers.sh push prod` | Push to Docker Hub |

## VPS Management

### SSH Access

```bash
# Connect to VPS
ssh -i ~/.ssh/netcup-vps root@152.53.88.183
```

### Start Production

```bash
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose --profile production up -d"
```

### Stop Production

```bash
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose --profile production down"
```

### View Logs

```bash
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose logs -f"

# Specific service
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose logs api --tail=50"
```

### Check Status

```bash
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose ps"
```

## Full Deployment Flow

### 1. Build Images

```bash
# Build all images for linux/amd64
./scripts/containers.sh build prod

# Or build individually
docker buildx build --platform linux/amd64 \
  -t parkerrex/zeke-api:prod \
  -f apps/api/Dockerfile \
  --push .
```

### 2. Push to Docker Hub

```bash
# Login (if needed)
docker login

# Push all images
docker push parkerrex/zeke-api:prod
docker push parkerrex/zeke-dashboard:prod
docker push parkerrex/zeke-website:prod
docker push parkerrex/zeke-engine:prod
```

### 3. Deploy to VPS

```bash
# Sync deploy configs
rsync -avz -e "ssh -i ~/.ssh/netcup-vps" \
  deploy/ root@152.53.88.183:/opt/zeke/

# Pull new images and restart
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose --profile production pull && \
   docker compose --profile production up -d --force-recreate"
```

## Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Caddy (Reverse Proxy)                     │
│                    Ports 80/443 + Auto SSL                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───┴───┐  ┌──────────┐  ┌┴─────────┐  ┌───────┴───┐
│  API  │  │ Dashboard │  │ Website  │  │  Engine   │
│ :3003 │  │   :3001   │  │  :3000   │  │   :3010   │
└───────┘  └──────────┘  └──────────┘  └───────────┘
    │           │              │              │
┌───┴───────────┴──────────────┴──────────────┴───┐
│                   Data Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Postgres │  │  Redis   │  │  MinIO   │       │
│  │  :5432   │  │  :6379   │  │:9000/9001│       │
│  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────┘
```

## Environment Files

Environment files are stored in `deploy/env/{environment}/`:

```
deploy/env/production/
├── api.env
├── dashboard.env
├── engine.env
└── website.env
```

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_PRIMARY_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session signing key (32+ chars) |
| `API_SECRET_KEY` | API authentication key (32+ chars) |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `RESEND_API_KEY` | Email service key |

## DNS Configuration

Add A records pointing to VPS IP (`152.53.88.183`):

| Domain | Type | Value |
|--------|------|-------|
| `app.zekehq.com` | A | 152.53.88.183 |
| `api.zekehq.com` | A | 152.53.88.183 |
| `www.zekehq.com` | A | 152.53.88.183 |
| `zekehq.com` | A | 152.53.88.183 |
| `engine.zekehq.com` | A | 152.53.88.183 |

## Health Checks

```bash
# API
curl http://152.53.88.183:3003/health

# Dashboard
curl http://152.53.88.183:3001/api/health

# Engine
curl http://152.53.88.183:3010/health
```

## Database Migrations

```bash
# Set production database URL
export DATABASE_PRIMARY_URL=postgresql://postgres:password@152.53.88.183:5432/zeke

# Run migrations
cd packages/db && bun run migrate
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose logs api --tail=50"

# Check env file
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cat /opt/zeke/env/production/api.env"
```

### SSL Certificate Issues

Caddy auto-provisions SSL. If failing, check:
1. DNS records are pointing to VPS
2. Ports 80/443 are open
3. Caddy logs: `docker compose logs caddy`

### Database Connection

```bash
# Test from VPS
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "docker exec zeke-postgres psql -U postgres -c 'SELECT 1'"
```

### Restart Individual Service

```bash
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose --profile production up -d api --force-recreate"
```

## Backup

### Database

```bash
# Dump
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "docker exec zeke-postgres pg_dump -U postgres zeke > /opt/zeke/backup.sql"

# Copy locally
scp -i ~/.ssh/netcup-vps root@152.53.88.183:/opt/zeke/backup.sql ./backup.sql
```

### Restore

```bash
scp -i ~/.ssh/netcup-vps ./backup.sql root@152.53.88.183:/opt/zeke/backup.sql
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "docker exec -i zeke-postgres psql -U postgres zeke < /opt/zeke/backup.sql"
```
