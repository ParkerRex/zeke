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

## Start Services

```bash
# Start PostgreSQL, Redis, and MinIO
docker compose up -d postgres redis minio

# Enable pgvector extension (first time only)
psql postgresql://zeke:zeke_dev_password@localhost:5435/zeke \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run database migrations
cd packages/db && bun run migrate:dev && cd ../..
```

## Development

```bash
# Start all apps
bun dev

# Or start individual apps
bun run dev:api       # API on port 3003
bun run dev:dashboard # Dashboard on port 3001
bun run dev:website   # Website on port 3000
```

## Verify Setup

1. **API Health**: http://localhost:3003/health
2. **Dashboard**: http://localhost:3001
3. **API Docs**: http://localhost:3003 (Scalar UI)

## Required Environment Variables

```bash
# Database
DATABASE_PRIMARY_URL=postgresql://zeke:zeke_dev_password@localhost:5435/zeke

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET=your-32-char-secret-key-here

# AI
OPENAI_API_KEY=sk-proj-...

# Redis
REDIS_URL=redis://localhost:6379

# Storage (MinIO)
MINIO_ROOT_USER=zeke_minio
MINIO_ROOT_PASSWORD=zeke_minio_password
```

## Common Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start all apps |
| `bun run build` | Build all apps |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code |
| `bun run typecheck` | TypeScript check |
| `bun run db:migrate` | Run migrations |
| `bun run db:studio` | Open Drizzle Studio |

## Port Reference

| Service | Port |
|---------|------|
| Website | 3000 |
| Dashboard | 3001 |
| API | 3003 |
| Engine | 3010 |
| PostgreSQL | 5435 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

## Next Steps

- Read [Architecture](./architecture.md) for system design
- See [Development](./development.md) for workflows
- Check app-specific docs in [apps/](./apps/)
