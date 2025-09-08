# ZEKE – AI-Powered News Intelligence Platform

ZEKE ingests news from multiple sources, analyzes it with LLMs, and delivers stories and insights through a modern Next.js web app.

## Architecture

- **Next.js app** – user interface and API routes (`src/`)
- **Background worker** – pg-boss pipeline for ingestion, analysis, and scheduling (`worker/`)
- **Supabase/PostgreSQL** – database with pgvector for storage and embeddings (`supabase/`)

## Development

### Local Dev + Stripe Sync (No‑Wipe)

Reset (no wipe)

- Stop services: `pnpm run stop`
- Start Supabase: `npx supabase start`
- Apply migrations + types: `pnpm run db:migrate`

Ensure worker DB user (dev defaults)

- Set password in shell: `export WORKER_PASS=worker_password`
- Create/align role and grants:
  - `DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres WORKER_PASS=$WORKER_PASS bash scripts/fix-worker-role.sh`
- Confirm worker env file (`worker/.env.development`):
  - `WORKER_DB_PASSWORD=worker_password`
  - `DATABASE_URL=postgresql://worker:${WORKER_DB_PASSWORD}@127.0.0.1:54322/postgres`
  - `BOSS_SCHEMA=pgboss`
  - `BOSS_MIGRATE=true`
- Verify connection:
  - `cd worker && bash scripts/test-connection.sh && cd -`
  - If “PostgreSQL connection failed”, re‑run the fix script and recheck `DATABASE_URL`.

Run app + worker

- Start Next: `pnpm run dev:next` (serves http://localhost:3000)
- Start worker (new terminal): `PORT=8082 bash worker/scripts/deploy-local-worker.sh`

Stripe CLI (make it deliver)

- Start listener pinned to your API key (new terminal):
  - `stripe listen --api-key "$STRIPE_SECRET_KEY" --forward-to http://127.0.0.1:3000/api/webhooks`
- Paste the printed signing secret into the root `.env.development`:
  - `STRIPE_WEBHOOK_SECRET=whsec_…`
- Restart Next to load the new env (Ctrl+C then `pnpm run dev:next`).

Seed and verify Stripe → DB sync

- Seed products/prices: `stripe fixtures ./stripe-fixtures.json --api-key "$STRIPE_SECRET_KEY"`
- Watch the listener; you should see `product.created` and `price.created` with 2xx.
- Supabase Studio (http://127.0.0.1:54323):
  - `public.products` has “Pro”
  - `public.prices` has monthly USD `unit_amount=10000`
- UI: `/pricing` shows $100/month (no “Custom”).
