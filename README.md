# ZEKE – AI-Powered News Intelligence Platform

ZEKE ingests news from multiple sources, analyzes it with LLMs, and delivers stories and insights through a modern Next.js web app.

## Architecture

- **Next.js app** – user interface and API routes (`src/`)
- **Background worker** – pg-boss pipeline for ingestion, analysis, and scheduling (`worker/`)
- **Supabase/PostgreSQL** – database with pgvector for storage and embeddings (`supabase/`)

## Development

### Developer setup (first run)

1) Copy envs and fill secrets
   - Ensure `.env.development` (root) includes local Supabase defaults (provided).
   - Put `WORKER_DB_PASSWORD` only in `worker/.env.development` and reference it in `DATABASE_URL`.
   - For production/remote, put `WORKER_DB_PASSWORD` only in `worker/.env.production`.
2) Start local Supabase
   - `npx supabase start` spins up Postgres/Auth/Storage locally.
3) Apply migrations and generate types
   - `pnpm run db:migrate` applies SQL migrations and regenerates Supabase types.
4) Set the worker role password (local)
   - `pnpm run bootstrap` runs `scripts/fix-worker-role.sh` to set/verify the password from `worker/.env.development`. You can re-run `bash scripts/fix-worker-role.sh` anytime.
5) Start the app + worker
   - `pnpm run dev` launches Next.js on http://localhost:3000 and the worker (Docker) on port 8082.

6) Seed pricing (Stripe fixtures)
   - Install Stripe CLI: https://stripe.com/docs/stripe-cli
   - Start webhook forwarding in a separate terminal: `pnpm stripe:listen` and copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in `.env.development`.
   - Run fixtures to create Products/Prices in your Stripe account and sync them into the DB via the webhook: `stripe fixtures ./stripe-fixtures.json --api-key $STRIPE_SECRET_KEY`.
   - Verify: visit `/pricing` and check `products`/`prices` tables are populated.

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
pnpm run lint:biome   # Biome + Ultracite lint (unix reporter)
pnpm run lint:biome:json  # Same, JSON output to stdout
pnpm run lint:biome:save  # Save JSON to reports/biome-report.json
pnpm run lint:biome:save:ts  # Save JSON to docs/lints/<UTC timestamp>.json
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

**Frontend (`.env.development` at repo root):**

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
RESEND_API_KEY=...
```

**Worker (`worker/.env.development`):**

```bash
WORKER_DB_PASSWORD=...
DATABASE_URL=postgresql://worker:${WORKER_DB_PASSWORD}@127.0.0.1:54322/postgres
BOSS_SCHEMA=pgboss
BOSS_CRON_TZ=UTC
BOSS_MIGRATE=false
```

Tip: Use `env-cmd -f worker/.env.development <command>` to inject envs when running `psql` or other tools.

## Stripe fixtures

Seed Stripe with test products and prices:

```bash
stripe fixtures ./stripe-fixtures.json --api-key $STRIPE_SECRET_KEY
```

## Contributing

See `docs/plans` and `docs/prompts` for architecture notes and task lists. Please run the checks above before submitting changes.
Remote (non‑prod/production) password setup

- Put `WORKER_DB_PASSWORD` in `worker/.env.production` and run psql against your remote Postgres:
  - `psql -h <region>.pooler.supabase.com -p 5432 -U postgres -d postgres -c "\\password worker"`

Remote schema & data dump (pre‑migration verification)

- Using Supabase CLI (one-time):
  - Schema only: `supabase db dump --db-url "$DATABASE_URL" --schema public,pgboss -f supabase/dumps/remote_schema.sql`
  - Data only (excludes users): `supabase db dump --db-url "$DATABASE_URL" --schema public,pgboss --data-only --exclude public.users -f supabase/dumps/remote_data.sql`
  - Docs: https://supabase.com/docs/reference/cli/supabase-db-dump
  - Note: `$DATABASE_URL` must be percent-encoded. Alternatively, use `--password`.
  
Compare schema to baseline:
- `diff -u supabase/migrations/20250906120000_baseline_all.sql supabase/dumps/remote_schema.sql | less`

Seed data plan:
- Curate `supabase/seed.sql` with non‑sensitive sample data drawn from `remote_data.sql`:
  - Include: sources, raw_items, contents (incl. transcript_vtt/audio_url), stories, story_overlays, story_embeddings (vectors), minimal pgboss rows for local testing.
  - Exclude: `public.users` and any PII.
