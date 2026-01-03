# Zeke

AI-powered research intelligence platform that transforms content into actionable insights.

## Quick Start

```bash
# Install dependencies
bun install
cp .env.example .env

# Start everything (Docker + Apps)
bun dev

# First time only - run migrations (in another terminal)
cd packages/db && bun run migrate:dev
```

This starts:
- **Docker**: PostgreSQL (5435), Redis (6379), MinIO (9000)
- **API**: http://localhost:3003
- **Dashboard**: http://localhost:3001
- **Engine**: http://localhost:3010
- **Website**: not started by `bun dev` (use `bun run dev:website`)

Run a single app if needed:

```bash
bun run dev:api
bun run dev:dashboard
bun run dev:website
bun run dev:desktop
```

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/getting-started.md) | Quick setup guide |
| [Architecture](./docs/architecture.md) | System design |
| [Development](./docs/development.md) | Dev workflows |
| [Deployment](./docs/deployment.md) | Docker & production |

### Apps & Packages

- **Apps**: [API](./docs/apps/api.md) · [Dashboard](./docs/apps/dashboard.md) · [Engine](./docs/apps/engine.md) · [Website](./docs/apps/website.md) · [Desktop](./docs/apps/desktop.md)
- **Packages**: [Database](./docs/packages/database.md) · [Jobs](./docs/packages/jobs.md) · [Auth](./docs/packages/auth.md) · [Storage](./docs/packages/storage.md) · [Cache](./docs/packages/cache.md) · [UI](./docs/packages/ui.md)

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Bun |
| API | Hono + TRPC |
| Frontend | Next.js 15, React 19 |
| Database | PostgreSQL + Drizzle ORM (pgvector) |
| Auth | Better Auth (with 2FA) |
| Storage | MinIO (S3-compatible) |
| Jobs | pg-boss (PostgreSQL-backed) |
| AI | OpenAI via Vercel AI SDK |
| Payments | Stripe |

## Project Structure

```
apps/
  api/           Hono + TRPC API (port 3003)
  dashboard/     Next.js frontend (port 3001)
  engine/        Content fetching service (port 3010)
  website/       Marketing site (port 3000)
  desktop/       Tauri native app

packages/
  db/            Drizzle schema and queries
  auth/          Better Auth config
  jobs/          pg-boss background tasks
  storage/       MinIO client
  ui/            Shared React components
  cache/         Redis client
```

## Commands

### Development

| Command | Description |
|---------|-------------|
| `bun dev` | Start full stack (Docker + all apps) |
| `bun run stop` | Stop apps (Docker keeps running) |
| `bun run stop -- --docker` | Stop everything including Docker |
| `bun run dev:api` | API only |
| `bun run dev:dashboard` | Dashboard only |
| `bun run dev:website` | Website only |
| `bun run dev:desktop` | Desktop only |

### Build & Quality

| Command | Description |
|---------|-------------|
| `bun run build` | Build all apps |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code |
| `bun run typecheck` | TypeScript check |

### Database

| Command | Description |
|---------|-------------|
| `cd packages/db && bun run migrate:dev` | Apply migrations (local) |
| `cd packages/db && bun run migrate` | Apply migrations (prod) |
| `cd packages/db && bun run migrate:studio` | Open Drizzle Studio |

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Dashboard | 3001 | http://localhost:3001 |
| API | 3003 | http://localhost:3003 |
| Engine | 3010 | http://localhost:3010 |
| PostgreSQL | 5435 | localhost:5435 |
| Redis | 6379 | localhost:6379 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |

## Production Deployment

Images are hosted on Docker Hub (`parkerrex/zeke-*`), deployed to VPS at `152.53.88.183`.

### Deploy

```bash
# Build + push images for production
./scripts/containers.sh build prod

# Deploy to VPS
rsync -avz -e "ssh -i ~/.ssh/netcup-vps" deploy/ root@152.53.88.183:/opt/zeke/
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose --profile production pull && \
   docker compose --profile production up -d"
```

### VPS Commands

```bash
# Start production
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose --profile production up -d"

# Stop production
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose --profile production down"

# View logs
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose logs -f"

# Check status
ssh -i ~/.ssh/netcup-vps root@152.53.88.183 \
  "cd /opt/zeke && docker compose ps"
```

See [Deployment Guide](./docs/deployment.md) for full details.
