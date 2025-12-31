# Getting Started

Quick setup guide for Zeke development.

## Prerequisites

- [Bun](https://bun.sh) (latest)
- [Docker](https://docker.com) and Docker Compose
- Node.js 20+ (for some tooling)

## Installation

```bash
# Clone and install
git clone <repo-url>
cd zeke
bun install

# Copy environment file
cp .env.example .env
```

## First-Time Setup

```bash
# Start PostgreSQL to run migrations
docker compose up -d postgres

# Enable pgvector extension
psql postgresql://zeke:zeke_dev_password@localhost:5435/zeke \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run database migrations
cd packages/db && bun run migrate:dev && cd ../..
```

## Development

```bash
# Start everything (recommended)
bun dev
```

This single command:
1. Starts Docker services (PostgreSQL, Redis, MinIO)
2. Waits for health checks
3. Starts all applications (API, Dashboard, Engine)

### Individual Apps

```bash
bun run dev:api       # API only (port 3003)
bun run dev:dashboard # Dashboard only (port 3001)
bun run dev:website   # Website only (port 3000)
```

### Stopping Services

```bash
bun run stop              # Stop apps (Docker keeps running)
bun run stop -- --docker  # Stop everything including Docker
docker compose down       # Stop Docker services only
```

## Verify Setup

1. **API Health**: http://localhost:3003/health
2. **Dashboard**: http://localhost:3001
3. **Engine Health**: http://localhost:3010/health
4. **API Docs**: http://localhost:3003 (Scalar UI)
5. **MinIO Console**: http://localhost:9001

## Required Environment Variables

```bash
# Database
DATABASE_PRIMARY_URL=postgresql://zeke:zeke_dev_password@localhost:5435/zeke

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET=your-32-char-secret-key-here

# Encryption (generate with: openssl rand -hex 32)
ZEKE_ENCRYPTION_KEY=your-64-char-hex-key-here

# AI
OPENAI_API_KEY=sk-proj-...

# Redis
REDIS_URL=redis://localhost:6379

# Storage (MinIO)
MINIO_ROOT_USER=zeke_minio
MINIO_ROOT_PASSWORD=zeke_minio_password
MINIO_ENDPOINT=http://localhost:9000
```

## Common Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start full stack (Docker + apps) |
| `bun run stop` | Stop apps |
| `bun run stop -- --docker` | Stop everything |
| `bun run build` | Build all apps |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code |
| `bun run typecheck` | TypeScript check |
| `bun run db:migrate` | Run migrations |
| `bun run db:studio` | Open Drizzle Studio |

## Port Reference

| Service | Port | Description |
|---------|------|-------------|
| Website | 3000 | Marketing site |
| Dashboard | 3001 | Main application |
| API | 3003 | Backend API |
| Engine | 3010 | Content fetching |
| PostgreSQL | 5435 | Database |
| Redis | 6379 | Cache |
| MinIO API | 9000 | Object storage |
| MinIO Console | 9001 | Storage UI |

## Next Steps

- Read [Architecture](./architecture.md) for system design
- See [Development](./development.md) for workflows
- Check app-specific docs in [apps/](./apps/)
