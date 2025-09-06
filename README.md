# ZEKE – AI-Powered News Intelligence Platform

ZEKE ingests news from multiple sources, analyzes it with LLMs, and delivers stories and insights through a modern Next.js web app.

## Architecture

- **Next.js app** – user interface and API routes (`src/`)
- **Background worker** – pg-boss pipeline for ingestion, analysis, and scheduling (`worker/`)
- **Supabase/PostgreSQL** – database with pgvector for storage and embeddings (`supabase/`)

## Development

### One-command setup

```bash
pnpm run dev
```

Starts local Supabase, applies migrations, launches the Next.js app on http://localhost:3000, and runs the worker.

### Individual commands

```bash
pnpm run dev:setup    # Set up database only
pnpm run dev:next     # Start Next.js only
pnpm run dev:worker   # Start worker only
pnpm run stop         # Stop all services
```

### Checks & tests

```bash
pnpm run lint         # Lint web app and worker
pnpm run typecheck    # Type safety for app and worker
pnpm run test         # Database + worker connectivity checks
pnpm run test:worker  # Worker-only tests
```

## Project structure

```text
src/          # Next.js application
worker/       # Background worker pipeline
supabase/     # Database migrations and config
docs/         # Project documentation
scripts/      # Utility scripts
```

## Environment variables

**Frontend (`.env.development`):**

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
RESEND_API_KEY=...
```

**Worker (`worker/.env.development`):**

```bash
DATABASE_URL=...
BOSS_SCHEMA=pgboss
BOSS_CRON_TZ=UTC
BOSS_MIGRATE=false
```

## Stripe fixtures

Seed Stripe with test products and prices:

```bash
stripe fixtures ./stripe-fixtures.json --api-key $STRIPE_SECRET_KEY
```

## Contributing

See `docs/plans` and `docs/prompts` for architecture notes and task lists. Please run the checks above before submitting changes.
