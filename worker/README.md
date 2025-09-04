# ZEKE Worker (pg-boss + Node/TS)

TypeScript worker that processes pg-boss jobs from Supabase Postgres. Run locally with a Direct connection; deploy on Cloud Run using the Session Pooler.

## Prereqs

- Supabase Postgres (Direct URL for local dev; Session Pooler URL for Cloud Run)
- Node 20+
- pg-boss schema/privileges (SQL below)

## Connection guidance

- Local (Direct, IPv6): `postgresql://worker:PASSWORD@db.<project>.supabase.co:5432/postgres?sslmode=no-verify`
- Cloud Run (Session Pooler, IPv4): `postgresql://worker.<project>:PASSWORD@<region>.pooler.supabase.com:5432/postgres?sslmode=require`
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

```
gcloud run deploy zeke-worker \
  --source . \
  --region us-central1 \
  --min-instances=1 \
  --cpu=1 --memory=1Gi \
  --set-env-vars DATABASE_URL='postgresql://worker.<project>:PASSWORD@<region>.pooler.supabase.com:5432/postgres?sslmode=require',BOSS_SCHEMA=pgboss,BOSS_CRON_TZ=UTC,BOSS_MIGRATE=false \
  --no-allow-unauthenticated
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
