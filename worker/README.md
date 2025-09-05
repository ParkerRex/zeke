# ZEKE Worker (pg-boss + Node/TS)

TypeScript worker that processes pg-boss jobs from Supabase Postgres. Run locally with a Direct connection; deploy on Cloud Run using the Session Pooler.

## How It Works

```mermaid
sequenceDiagram
  participant Boss as pg-boss (cron)
  participant Worker as Cloud Run Worker
  participant Src as External Sources (RSS)
  participant DB as Supabase Postgres

  Boss-->>Worker: schedule ingest:pull (*/5)
  Worker->>Src: fetch RSS/Atom feeds
  Src-->>Worker: items (guid, link, title)
  Worker->>DB: upsert public.raw_items (idempotent)
  Worker-->>Boss: send ingest:fetch-content {rawItemIds}
  Boss-->>Worker: work ingest:fetch-content
  Worker->>Src: fetch article HTML (15s timeout)
  Worker->>Worker: Readability extract → text
  Worker->>Worker: hash(text) → content_hash
  Worker->>DB: insert contents; insert or link story by content_hash
  Worker-->>Boss: send analyze:llm {storyId}
  Worker->>HTTP: /healthz for Cloud Run
```

Operational notes:
- Uses Session Pooler in prod (`?sslmode=require`) and Direct in local dev.
- Node `pg` Pool has an `error` handler to survive pooler resets.
- Network calls use 15s abort guards to avoid hung jobs.
- Minimal structured logs: `boss_started`, `heartbeat`, `ingest_pull_*`, `fetch_content_*`, `analyze_llm_*`.

## Prereqs

- Supabase Postgres (Direct URL for local dev; Session Pooler URL for Cloud Run)
- Node 20+
- pg-boss schema/privileges (SQL below)

## Connection guidance

- Local (Direct, IPv6): `postgresql://worker:PASSWORD@db.<project>.supabase.co:5432/postgres?sslmode=no-verify`
- Cloud Run (Session Pooler, IPv4): `postgresql://worker.<project>:PASSWORD@<region>.pooler.supabase.com:5432/postgres?sslmode=no-verify`
  - Do not use the Transaction Pooler (breaks pg-boss LISTEN/NOTIFY).

## Local dev

1. `cp .env.example .env` and set `DATABASE_URL` (Direct) and optional `BOSS_MIGRATE=true` (default).
2. Install deps: `pnpm install`
3. Run dev: `pnpm dev`

On first start, pg-boss will create its schema/tables, create queues, schedule `system:heartbeat` every 5 minutes, and expose `/healthz`.

After first successful start, you can harden:

- Set `BOSS_MIGRATE=false` to skip future schema checks/creates.
- Optionally revoke DB-level CREATE from the worker role.

## Deploy to Cloud Run

Fill in worker/.env (see .env.example), then run:

```
pnpm run deploy
```

This script reads worker/.env and deploys with the configured env vars. For production, you can also run:

```
pnpm run deploy:prod
```

For local docker-based runs, use:

```
pnpm run deploy:local
```

Environment variables (summary):
- `DATABASE_URL_POOLER`: Session Pooler URL (prod deploy).
- `DATABASE_URL`: Direct URL (local/dev and Docker local).
- `BOSS_SCHEMA`: pg-boss schema name (default `pgboss`).
- `BOSS_MIGRATE`: `true` to allow pg-boss to create/verify its schema (local first run), `false` in prod.

## Logs CLI

Use the built-in script to stream Cloud Run logs without opening the console:

```
# Stream INFO+ level (default lookback FRESHNESS=15m). Uses streaming if available,
# otherwise polls every 5s with `gcloud logging read`.
pnpm run logs

# Only warnings and errors
pnpm run logs:errors

# Custom lookback and filter (advanced filter syntax)
FRESHNESS=30m pnpm run logs "jsonPayload.msg=fetch_content_start OR textPayload:extract_error"
```

## pg-boss DB setup (SQL)

Run in Supabase SQL Editor (adjust role/password):

```
create role worker login password 'REDACTED_STRONG_PASSWORD';
grant connect on database postgres to worker;
grant create on database postgres to worker; -- needed for first-time CREATE SCHEMA
grant usage on schema public to worker;

-- Create pgboss schema as admin; grant worker privileges to create inside it
create schema if not exists pgboss;
grant usage, create on schema pgboss to worker;

-- Allow worker to read/write app tables (adjust as needed)
grant select, insert, update, delete on all tables in schema public to worker;
grant usage on all sequences in schema public to worker;
alter default privileges in schema public grant select, insert, update, delete on tables to worker;
alter default privileges in schema public grant usage on sequences to worker;

-- Extensions used by the app (first-time setup)
create extension if not exists pgcrypto;
create extension if not exists vector;
```

After pg-boss is installed, you may set `BOSS_MIGRATE=false` and optionally:

```
revoke create on database postgres from worker;
```

## Manual test endpoints (repeatable)

The worker exposes simple debug endpoints for on-demand tests:

- `POST /debug/schedule-rss` → creates the `ingest:pull` queue and schedules it every 5 minutes (idempotent).
- `POST /debug/ingest-now` → immediately runs the RSS ingest once without waiting for cron.

Examples:

```
curl -X POST "$WORKER_URL/debug/schedule-rss"
curl -X POST "$WORKER_URL/debug/ingest-now"
```

Then verify in DB:

```
select count(*) from public.raw_items;
select id, url, title, discovered_at from public.raw_items order by discovered_at desc limit 10;
```
