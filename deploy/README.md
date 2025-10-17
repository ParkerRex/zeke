# Zeke Deployment

This directory contains Docker Compose configuration for deploying the full Zeke stack.

## Directory Structure

```
deploy/
├── env/                    # Environment files per environment
│   ├── local/             # Local development (Docker)
│   ├── staging/           # Staging environment
│   └── production/        # Production environment
├── proxy/                 # Caddy reverse proxy configuration
├── profiles/              # Docker Compose profile overrides
├── docker-compose.yml     # Main compose file
├── .env.example          # Example environment variables
└── run-local.sh          # Script to build and run locally
```

## Environments

### Local (Docker)

Run the full stack locally in Docker containers for testing production-like deployments:

```bash
# First time setup
./deploy/run-local.sh

# This will:
# 1. Build all Docker images with :local tags
# 2. Start all services using docker-compose
# 3. Use environment files from deploy/env/local/

# View logs
cd deploy
docker compose --profile staging logs -f

# Stop everything
docker compose --profile staging down
```

**Environment Files**: `deploy/env/local/*.env` (copied from staging examples)

**Services Running**:
- API: Port 3003
- Dashboard: Port 3001
- Website: Port 3000
- Engine: Port 3010
- Redis: Port 6379
- Caddy: Ports 80/443

### Staging

Deployed on VPS, uses pre-built images from CI/CD:

```bash
cd deploy
docker compose --profile staging up -d
```

**Environment Files**: `deploy/env/staging/*.env`

**Image Tags**: `zeke-*:staging`

### Production

Production deployment configuration:

```bash
cd deploy
docker compose --profile production up -d
```

**Environment Files**: `deploy/env/production/*.env`

**Image Tags**: `zeke-*:production`

## Building Images

### Local Development

The `run-local.sh` script builds all images from the monorepo root:

```bash
docker build -t zeke-api:local -f apps/api/Dockerfile .
docker build -t zeke-dashboard:local -f apps/dashboard/Dockerfile .
docker build -t zeke-website:local -f apps/website/Dockerfile .
docker build -t zeke-engine:local -f apps/engine/Dockerfile .
```

**Note**: Build context is the monorepo root (`.`) so Bun can resolve workspace dependencies during `bun install`.

### CI/CD

Images are built with staging/production tags and pushed to a container registry.

## Environment Variables

Each service requires its own environment file:

- `api.env` - API service configuration (database, auth, Stripe, OpenAI)
- `dashboard.env` - Dashboard service configuration
- `website.env` - Website service configuration  
- `engine.env` - Engine service configuration

Copy from `.env.example` files in `deploy/env/staging/` and customize for each environment.

## Docker Compose Profiles

The compose file uses profiles to control which services run:

- `staging` - All services for staging environment
- `production` - All services for production environment

Services without a profile (like Redis in dev) run by default.

## Troubleshooting

**"Missing environment variables"**
- Ensure all required env files exist in `deploy/env/{environment}/`
- Copy from `.env.example` files and fill in values

**"Container fails to start"**
- Check logs: `docker compose --profile staging logs <service-name>`
- Verify environment variables are set correctly
- Ensure dependent services (Redis, etc.) are healthy
