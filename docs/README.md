# Zeke Documentation

This repo runs the Zeke platform. These docs are for builders. No fluff.

## Quick Start

```bash
bun install && cp .env.example .env
bun dev  # Starts Docker + all apps
```

If you use the included Docker services, set `DATABASE_PRIMARY_URL` to `postgresql://zeke:zeke_dev_password@localhost:5435/zeke`.

## Service Map (Blunt)

If you need to...
- **Ingest external content**: `apps/engine` (Engine)
- **Read/write domain data, auth, billing**: `apps/api` (API)
- **Build user workflows**: `apps/dashboard` (Dashboard)
- **Ship marketing pages**: `apps/website` (Website)
- **Ship a desktop shell**: `apps/desktop` (Desktop)

## Domain Glossary

- **Story**: User-facing content (article/video/podcast/etc.) built from ingested data.
- **Content item**: Raw extracted content stored in `contents` (text, transcript, pdf, etc.).
- **Highlight**: A user-created note on a story.
- **Source**: The origin of content (RSS feed, YouTube channel, publisher, etc.).
- **Playbook**: Automation workflow that runs against content.
- **Team**: The tenant boundary for users, data, and billing.
- **Legacy naming**: Some modules still say `invoice` or `transaction`. Read `invoice` as story/article and `transaction` as content item until the migration finishes.

## Quick Links

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Setup and first run |
| [Architecture](./architecture.md) | System overview and design |
| [Development](./development.md) | Development workflows |
| [Deployment](./deployment.md) | Docker and production |

## Applications

| App | Port | What it owns |
|-----|------|--------------|
| [API](./apps/api.md) | 3003 | Domain data, auth, billing, search |
| [Dashboard](./apps/dashboard.md) | 3001 | Product UI and user workflows |
| [Engine](./apps/engine.md) | 3010 | Content ingestion + normalization |
| [Website](./apps/website.md) | 3000 | Marketing site |
| [Desktop](./apps/desktop.md) | - | Desktop shell for the dashboard |

## Packages

| Package | Description |
|---------|-------------|
| [Database](./packages/database.md) | Drizzle ORM schema and queries |
| [Jobs](./packages/jobs.md) | pg-boss background tasks |
| [Auth](./packages/auth.md) | Better Auth configuration (with 2FA) |
| [Storage](./packages/storage.md) | MinIO S3-compatible client |
| [Cache](./packages/cache.md) | Redis caching layer |
| [UI](./packages/ui.md) | Shared React components |
| [Utilities](./packages/utilities.md) | Utils, logger, encryption |

## Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5435 | Primary database (pgvector) |
| Redis | 6379 | Cache and sessions |
| MinIO | 9000/9001 | Object storage (S3-compatible) |

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Bun |
| API | Hono + TRPC |
| Frontend | Next.js 15, React 19 |
| Database | PostgreSQL 16 + Drizzle ORM (pgvector) |
| Auth | Better Auth (with 2FA) |
| Storage | MinIO (S3-compatible) |
| Jobs | pg-boss (PostgreSQL-backed) |
| Cache | Redis |
| AI | OpenAI via Vercel AI SDK |
| Payments | Stripe |

## Project Structure

```
zeke/
├── apps/
│   ├── api/          # Domain API (port 3003)
│   ├── dashboard/    # Product UI (port 3001)
│   ├── engine/       # Content ingestion (port 3010)
│   ├── website/      # Marketing site (port 3000)
│   └── desktop/      # Desktop shell
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

## Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start full stack (Docker + apps) |
| `bun run stop` | Stop apps |
| `bun run stop -- --docker` | Stop everything |
| `bun run build` | Build all apps |
| `bun run lint` | Lint code |
| `bun run format` | Format code |
| `bun run db:migrate` | Generate + apply migrations (local) |
| `bun run db:migrate:prod` | Apply migrations (prod) |
| `bun run db:studio` | Open Drizzle Studio |
