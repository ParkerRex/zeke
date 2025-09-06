# Worker Agents Guide

This guide orients coding agents working inside `worker/` so changes stay reliable, efficient, and secure.

**Scope:** Background pipeline (ingest → extract → analyze) using PostgreSQL, `pg-boss`, and external APIs. Do not use the Supabase JS SDK in the worker.

## Project Overview

- **Purpose:** Ingest sources (RSS, YouTube), fetch and extract content, generate analysis/embeddings, and manage jobs.
- **Key Modules:**
  - `src/worker.ts`: HTTP health/debug endpoints, `pg-boss` queues, schedulers, workers
  - `src/db.ts`: Postgres `pg` Pool and all DB access helpers
  - `src/ingest/*`: Source ingestion (RSS, YouTube)
  - `src/extract/*`: Content extraction and normalization
  - `src/analyze/llm.ts`: LLM analysis and embeddings
  - `src/fetch/*`, `src/utils/*`, `src/clients/*`: External API clients and helpers
- **Queues (pg-boss):** `system:heartbeat`, `ingest:pull`, `ingest:fetch-content`, `ingest:fetch-youtube-content`, `analyze:llm`.
- **HTTP Endpoints:** `/healthz`, `/debug/status`, `/debug/ingest-now`, `/debug/schedule-rss`, `/debug/ingest-youtube`, `/debug/schedule-youtube`.

## Build & Run

- **Local (Docker, full deps):** `bash scripts/deploy-local-worker.sh`
- **Build:** `pnpm run build`
- **Start (prod bundle, non-Docker):** `pnpm run start`
- From repo root, run the full stack with `pnpm run dev` and pipeline checks with `pnpm run test:pipeline`.

## Testing Instructions

- **Connectivity:** `pnpm run test:connection` (DB + pg-boss schema/permissions)
- **Queue Health:** `pnpm run test:transcription` (pg-boss tables, job counts)
- **YouTube API:** `node test-youtube-api.js`
- **Pipeline (sample):** `node test-youtube-pipeline.js`
- **Status Snapshots:** `curl http://localhost:8080/debug/status`
- Ensure Supabase (Postgres) is running locally before tests. Use root scripts to start DB/migrations if needed.

## Code Style Guidelines

- **DB access (critical):**
  - Use the shared `pg` Pool from `src/db.ts`. Do not import or use the Supabase JS SDK in the worker.
  - Always write parameterized SQL (e.g., `$1, $2`) and return typed results via helpers in `db.ts`.
  - Reuse idempotent patterns (`insert ... on conflict do update/do nothing`) to avoid duplicates.
  - Do not create new `Pool()` instances; use the exported default pool and the provided functions.
- **Job handlers:**
  - Keep handlers deterministic and resilient (validate inputs, catch errors, `complete`/`fail` jobs explicitly).
  - Prefer small `batchSize` and sequential processing unless safe to parallelize.
  - Schedule recurring work via `boss.schedule` with `CRON_TZ`.
- **Networking:**
  - Use `AbortController` timeouts (15s) for external fetches.
  - Normalize URLs with `canonicalizeUrl` and hash text with `hashText`.
- **LLM usage:**
  - `OPENAI_API_KEY` optional; code must gracefully fall back to stub analysis/embeddings.
  - Cap input sizes conservatively; sanitize/validate JSON responses.
- **Logging:**
  - Use `log(evt, extra?, lvl)` from `src/log.ts` for structured JSON logs. Avoid `console.log` directly.
- **TypeScript & modules:**
  - Strict TS, ESM modules. Keep functions small and typed; avoid `any` and non‑null assertions.
  - Follow repo formatting (Biome/Prettier via workspace settings).

## Security Considerations

- **No Supabase SDK:** Connect directly to Postgres using `pg` (see `src/db.ts`) for proper pooling and SSL control.
- **Secrets:** Read only from env (`.env.development` for dev). Never log secrets. Keep API keys server‑side.
- **Postgres SSL:** `db.ts` enables TLS for non‑local hosts and relaxes verification for managed poolers (`sslmode=no-verify`).
- **Untrusted content:** Treat all external URLs/content as untrusted. Enforce timeouts and validate inputs before DB writes.
- **Data safety:** Parameterize SQL, avoid dynamic SQL construction, and validate JSON before persisting.

## Adding a New Job

1. **Define queue:** In `src/worker.ts`, ensure `boss.createQueue('my:queue')` and schedule if recurring.
2. **Implement worker:** `await boss.work('my:queue', opts, async (jobs) => { ... })` using structured logging and try/catch per job.
3. **DB access:** Add typed helpers to `src/db.ts`. Use the shared Pool and parameterized SQL.
4. **Enqueue:** From existing handlers, call `boss.send('my:queue', data)` when appropriate.
5. **Test:** Use local `.env.development`, run `pnpm run dev`, and verify via `/debug/status` and scripts in `worker/scripts/`.

## Environment Variables

- **DATABASE_URL:** Postgres connection string (local uses 127.0.0.1; prod uses Supabase pooler with TLS)
- **BOSS_SCHEMA:** PgBoss schema (default `pgboss`)
- **BOSS_CRON_TZ:** Cron timezone (default `UTC`)
- **BOSS_MIGRATE:** Whether boss runs migrations (often `false` in prod)
- **PORT:** HTTP port (default `8080`)
- **OPENAI_API_KEY:** Optional; enables real analysis/embeddings
- **YOUTUBE_API_KEY:** Enables YouTube ingestion and tests

## DB Access Pattern (Reference)

- **Pool:** Created once in `src/db.ts` with keep‑alive, small `max`, and SSL toggled by host.
- **Helpers:** Export typed fns like `getRssSources`, `upsertRawItem`, `insertContents`, `upsertStoryOverlay`, `upsertStoryEmbedding`.
- **Embeddings:** Store as JSON (`JSON.stringify(embedding)`) matching DB vector/JSON strategy.
- **Errors:** `pool.on('error', ...)` prevents process crashes; log with `log('pg_pool_error', ...)`.

By following these conventions—especially direct `pg` usage instead of the Supabase SDK—the worker remains efficient, portable, and production‑safe.
