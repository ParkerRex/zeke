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
  - `src/fetch/*`, `src/utils/*`, `src/lib/*`: External API wrappers and helpers
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

## Third‑Party APIs Pattern

Use a small, composable pattern for external services (e.g., YouTube) that matches our actions style and improves testability.

- Client wrapper: put per‑service clients under `src/lib/<service>/<service>-client.ts`. The client:
  - Handles auth/env once (e.g., API key), base URL, and shared config.
  - Exposes a minimal object (transport + config). Do not bake business logic in the client.
  - Example: `createYouTubeClient()` returns `{ youtube, quotaLimit, quotaBuffer, quotaResetHour }`.
- Verb‑noun functions: one function per file in `src/lib/<service>/` (no barrels):
  - Examples (YouTube): `search-videos.ts`, `search-channels.ts`, `get-video-details.ts`, `get-channel-uploads.ts`, `check-quota-status.ts`.
  - Signature: `(client, input) => Promise<Output>`; never read env inside these methods.
  - Keep side effects out; they should compose cleanly in higher‑level fetchers/ingesters.
- Shared types: colocate `types.ts` with the client. Model only fields we use; expand as needed.
- Retries: use `src/utils/retry.ts` (`withRetry`, `isRetryableDefault`).
  - Treat `quotaExceeded` as non‑retryable; allow 429/5xx and transient network errors to retry with backoff.
  - Customize `isRetryable` per method if a provider has special semantics.
- Quota/rate limits:
  - Keep provider quota awareness local (e.g., YouTube cost constants) and integrate with our `QuotaTracker` at the call site.
  - Prefer explicit `part`/fields to reduce cost; avoid over‑fetching.
- Logging: consistent structured logs via `log(evt, extra, lvl)`; include inputs (sanitized), counts, and quota usage.
- Usage example (YouTube):
  - Create client once: `const yt = createYouTubeClient()`.
  - Call methods: `await searchVideos(yt, { query, maxResults })`, `await getVideoDetails(yt, ids)`.
- Don’ts:
  - Don’t add barrels (`index.ts`) — import concrete files.
  - Don’t access env inside method files; only in the client factory.
  - Don’t leak secrets or raw tokens to logs/errors.

This structure keeps call sites explicit, isolates auth/transport, and makes unit tests trivial (inject a fake client and stub the transport).

## Actions Catalog (worker/src/actions)

- analyze-story.ts: Generate overlays + embedding for a story (OpenAI or stub), then persist.
- extract-article.ts: Fetch + parse article content, create content/story, enqueue analysis.
- extract-youtube-content.ts: Extract audio → transcribe → VTT → content/story → enqueue analysis.
- fetch-youtube-channel-videos.ts: List channel uploads (via uploads playlist) + details with quota.
- fetch-youtube-search-videos.ts: Search videos + map to domain with quota.
- resolve-youtube-uploads-id.ts: Derive and persist channel uploads playlist ID.
- ingest-rss-source.ts: Fetch → parse → normalize → upsert → enqueue (per RSS source).
- preview-rss-source.ts: Fetch → parse → normalize → preview items (no writes).
- ingest-youtube-source.ts: Orchestrate channel/search ingest, upsert raw items, enqueue extraction.
- preview-youtube-source.ts: Preview channel/search items with current quota status.

Primitives used by these actions live under `extract/*`, `storage/*`, `transcribe/*`, and are single‑purpose (one function per file) without env/DB/queue access.

## Actions vs Lib vs Primitives

Use this simple split to keep code easy to compose and test:

- Actions (`src/actions/*`): business logic that composes helpers + libs and may write to DB or enqueue jobs.
  - One function per file (verb-noun), typed inputs/outputs, explicit side effects.
  - Example: `analyze-story.ts`, `extract-article.ts`, `extract-youtube-content.ts`, `fetch-youtube-channel-videos.ts`.
- Lib (`src/lib/*`): thin third‑party clients only (auth, transport, minimal request building).
  - No domain logic, no DB, env only in client factory.
  - Example: `lib/openai/*`, `lib/youtube/*`, `utils/retry.ts`.
- Primitives (`src/extract/*`, `src/transcribe/*`, `src/storage/*`): single‑purpose local helpers.
  - One function per file (verb-noun), no env, no DB, no queues. Small, typed, focus on doing one thing well.
  - Examples: `extract-youtube-audio.ts`, `get-youtube-metadata.ts`, `generate-vtt-content.ts`, `prepare-youtube-transcript.ts`, `transcribe-audio.ts`.

Heuristic
- Calls external SDK? Put it in lib.
- Spawns a local tool or formats/derives local data? Put it in primitives.
- Combines multiple steps and performs side effects (DB/queues)? Put it in actions.
