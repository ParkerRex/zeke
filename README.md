# Zeke

AI-powered research assistant that transforms content into actionable insights.

## Tech Stack

- **Runtime**: Bun
- **API**: Hono + TRPC
- **Frontend**: Next.js 15, React 19
- **Database**: PostgreSQL + Drizzle ORM (with pgvector)
- **Auth**: Better Auth
- **Storage**: MinIO (S3-compatible)
- **Background Jobs**: pg-boss (PostgreSQL-backed)
- **AI**: OpenAI via Vercel AI SDK
- **Payments**: Stripe

## Project Structure

```
apps/
  api/           Hono + TRPC API (port 3003)
  dashboard/     Next.js frontend (port 3001)
  engine/        Content fetching service
  website/       Marketing site
  desktop/       Electron app

packages/
  db/            Drizzle schema and queries
  auth/          Better Auth config
  jobs/          pg-boss background tasks
  storage/       MinIO client
  ui/            Shared React components
  cache/         Redis client
  ...
```

## Setup

### Prerequisites

- Bun
- Docker

### Install

```bash
bun install
cp .env.example .env
```

### Start Services

```bash
docker compose up -d postgres minio redis

# First time only - enable vector extension
psql postgresql://postgres:postgres@127.0.0.1:5432/postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
cd packages/db && bun run migrate:dev && cd ../..
```

### Development

```bash
bun dev              # Start all apps
bun run dev:api      # API only
bun run dev:dashboard # Dashboard only
```

## Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start all apps |
| `bun run build` | Build all apps |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code |
| `bun run typecheck` | Type check all apps |
| `bun run db:migrate` | Run local migrations |
| `bun run db:studio` | Open Drizzle Studio |

## Database

Schema is defined in `packages/db/src/schema.ts`. Run all migration commands from `packages/db`.

```bash
cd packages/db
bun run db:generate    # Generate migration from schema changes
bun run migrate:dev    # Apply to local database
bun run migrate        # Apply to production (set DATABASE_SESSION_POOLER_URL)
```

## Docker

Full stack deployment:

```bash
./deploy/run-local.sh                              # Build and run
cd deploy && docker compose --profile staging logs -f  # View logs
docker compose --profile staging down              # Stop
```
