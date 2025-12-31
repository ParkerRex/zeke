# Zeke Documentation

AI-powered research intelligence platform that transforms content into actionable insights.

## Quick Links

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Setup and first run |
| [Architecture](./architecture.md) | System overview and design |
| [Development](./development.md) | Development workflows |
| [Deployment](./deployment.md) | Docker and production |

## Applications

| App | Port | Description |
|-----|------|-------------|
| [API](./apps/api.md) | 3003 | Hono + TRPC backend |
| [Dashboard](./apps/dashboard.md) | 3001 | Next.js 15 frontend |
| [Engine](./apps/engine.md) | 3010 | Content ingestion service |
| [Website](./apps/website.md) | 3000 | Marketing site |
| [Desktop](./apps/desktop.md) | - | Tauri native app |

## Packages

| Package | Description |
|---------|-------------|
| [Database](./packages/database.md) | Drizzle ORM schema and queries |
| [Jobs](./packages/jobs.md) | pg-boss background tasks |
| [Auth](./packages/auth.md) | Better Auth configuration |
| [Storage](./packages/storage.md) | MinIO S3-compatible client |
| [Cache](./packages/cache.md) | Redis caching layer |
| [UI](./packages/ui.md) | Shared React components |
| [Utilities](./packages/utilities.md) | Utils, logger, encryption |

## Tech Stack

- **Runtime**: Bun
- **API**: Hono + TRPC
- **Frontend**: Next.js 15, React 19
- **Database**: PostgreSQL 16 + Drizzle ORM (with pgvector)
- **Auth**: Better Auth
- **Storage**: MinIO (S3-compatible)
- **Background Jobs**: pg-boss (PostgreSQL-backed)
- **Cache**: Redis
- **AI**: OpenAI via Vercel AI SDK
- **Payments**: Stripe

## Project Structure

```
zeke/
├── apps/
│   ├── api/          # Hono + TRPC API (port 3003)
│   ├── dashboard/    # Next.js frontend (port 3001)
│   ├── engine/       # Content ingestion (port 3010)
│   ├── website/      # Marketing site (port 3000)
│   └── desktop/      # Tauri native app
├── packages/
│   ├── db/           # Drizzle schema and queries
│   ├── jobs/         # pg-boss background tasks
│   ├── auth/         # Better Auth config
│   ├── storage/      # MinIO client
│   ├── cache/        # Redis client
│   ├── ui/           # Shared React components
│   └── ...           # Other utilities
├── docs/             # This documentation
└── deploy/           # Docker configs
```
