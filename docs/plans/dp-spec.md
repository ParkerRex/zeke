# ZEKE Data Pipeline Plan

See companion visuals in `docs/plans/dp-diagrams.md` for architecture, data flow, and operations diagrams referenced throughout this plan.

This document proposes a pragmatic, incremental pipeline to ingest stories from multiple sources, normalize content, run summarization/analysis, and serve high‑quality artifacts to the app (Why it matters, chili score, confidence, citations, etc.). It is designed to fit our current stack (Next.js + Supabase), run TypeScript‑only workloads, and keep setup simple.

## Goals

- Ingest heterogeneous sources (articles, YouTube, Reddit, HN, arXiv, podcasts).
- Normalize into a single Story model with durable content and metadata.
- Reader/Annotator: render internal reader views for text (articles, PDFs, transcripts) and support highlights across all mediums.
- Generate trustworthy overlays: why‑it‑matters summary, chili/hype score, confidence, citations.
- Deduplicate and cluster near duplicates across sources.
- Serve fast to the app with stable IDs and simple APIs.
- Keep setup simple (TypeScript only) and enable local dev.

## Decisions (v1)

- Language/runtime: TypeScript only.
- Scheduling: pg‑boss built‑in cron for scheduling inside Supabase Postgres (no Edge Function, no pg_cron).
- Worker: Cloud Run (Node/TS) processes jobs; no Airflow/Python.
- Queue: pg‑boss (Postgres‑backed).
- Embeddings: pgvector with a fixed dimension `vector(1536)`; tune later.
- Clusters: 1 cluster groups many stories; each story belongs to at most one cluster.
- Overlays: computed at story level; cluster‑level overlays deferred.
- Sharing/Digest: deferred (roadmap), not in v1 scope.

## High‑Level Architecture

Refer to:

- System Context and Deployment Topology diagrams: `docs/plans/dp-diagrams.md`
- Trust Boundaries & RLS: `docs/plans/dp-diagrams.md`

- Ingestion Worker(s): Scheduled jobs fetch new items from source feeds/APIs.
- Normalization: Convert raw items → canonical Story format; fetch article HTML/transcript/PDF; extract clean text.
- Analysis: Run LLM summarization + scoring with citations; create embeddings for retrieval.
- Storage: Postgres (Supabase) for metadata + overlays + highlights; Supabase Storage for raw HTML/transcripts/PDFs; pgvector for embeddings.
- Serving: `/api/stories` (lists + filters), `/api/stories/:id` (full), `/api/highlights` (create/list). Sharing/digest later.
- Orchestration: pg‑boss cron/enqueue in Supabase → Cloud Run Worker (Node/TS) consumes from pg‑boss.

### Storage layout (proposed)

Related diagrams:

- Data Lineage and ERD: `docs/plans/dp-diagrams.md`

- Postgres (Supabase): all relational tables (see below).
- Storage buckets:
  - `raw-html/` `{content_hash}.html` (original fetched HTML)
  - `pdfs/` `{content_hash}.pdf`
  - `audio/` `{content_hash}.m4a|mp3` (temporary; deletable after transcript)
  - `transcripts/` `{content_hash}.vtt` + `{content_hash}.txt`
  - Optional `images/` for thumbnails (YouTube, site OG)
- Naming: primary key = `content_hash` of normalized text; alternate keys by `raw_item_id` for traceability.
- Retention: keep text forever; consider lifecycle policy to evict large audio after transcription.
- PDF text: start with open‑source extractors; if structure is complex, optionally call a managed OCR/Document AI service from the worker and store extracted text.

## Data Model (proposed)

Postgres tables (Supabase):

- `sources` (id, kind, name, url, domain, authority_score, last_cursor jsonb, last_checked)
- `raw_items` (id, source_id, external_id, url, kind, title, metadata jsonb, discovered_at, status, error, attempts)
- `contents` (id, raw_item_id, text, html_url (storage), transcript_url (storage), pdf_url (storage), lang, extracted_at, content_hash)
- `stories` (id, content_id, canonical_url, kind, title, primary_url, published_at, cluster_key, created_at)
- `clusters` (cluster_key primary key, representative_story_id null, created_at)
- `story_overlays` (story_id, why_it_matters, chili int, confidence float, citations jsonb, model_version, analyzed_at)
- `story_embeddings` (story_id, embedding vector(1536), model_version)
- `highlights` (id, user_id, story_id, content_id, span jsonb, created_at)

Notes:

- `cluster_key`: hash of normalized title + domain + text fingerprint to merge near‑duplicates. One cluster groups many stories (1:N).
- `citations`: array of { title, url, domain, span? } that the model referenced.
- For YouTube/podcasts, `contents.transcript_url` stores transcript file; `contents.text` stores merged transcript text.
- `highlights.span`: anchor using character offsets into `contents.text` (and optional block/timestamp for transcripts). Offsets are stable because `content_hash` is immutable per content version.

## Ingestion

Related diagrams:

- Pipeline DAG and Ingestion Sequence: `docs/plans/dp-diagrams.md`

Sources:

- Articles: RSS/Atom feeds from domains we care about; Twitter/X can come later.
- YouTube: Channel uploads and search queries via YouTube Data API; try to fetch transcript (API or `youtube-transcript` libs) else Whisper fallback.
- Reddit: Subreddit/keyword searches via Reddit API.
- HN: Algolia API for HN items.
- arXiv: Atom feeds per category.

Flow:

1. Scheduler enqueues `ingest:pull` per source (with `last_cursor`).
2. For each item, upsert into `raw_items` by (source_id, external_id); skip if known.
3. Enqueue `ingest:fetch-content` for new/changed items.

### Cursor management ("last cursor")

- Purpose: A per‑source bookmark so each run only processes items after the last successful pull.
- Storage: Keep as `jsonb` in `sources.last_cursor` alongside `last_checked` timestamp.
- Examples by source:
  - RSS/Atom: last `guid` and `pubDate`/`updated`. When feed is unordered, fetch page(s) and stop when we hit a known `guid`.
  - YouTube API: `publishedAfter` ISO string + last `pageToken` processed.
  - Reddit API: `after` token for pagination.
  - HN Algolia: last `created_at_i` and/or last `objectID`.
  - arXiv: last `updated` timestamp + `start` index.
- Behavior: Read current cursor; fetch pages until hitting a known item; update `last_cursor` and `last_checked`.

## Content Fetch & Normalization (by medium)

- Articles: fetch HTML; store raw HTML; extract clean text (Readability); compute `content_hash` on normalized text.
- PDFs: fetch and store PDF; extract text (open‑source) and compute `content_hash`; if extraction is low quality, optionally call a managed OCR/Document AI service.
- Videos/Podcasts: download audio (yt‑dlp), transcribe (Whisper/faster‑whisper), store VTT + plain text; compute `content_hash`.
- Canonicalize URLs (strip UTM, resolve redirects) before hashing.
- Language detection; mark unsupported for now.
- Storage naming by `content_hash`.

## Deduplication & Clustering

- Preserve evidence: Never drop raw items. `raw_items` and `contents` keep all sources for a story.
- On new/updated `stories`, compute `cluster_key` and lookup recent neighbors; if near match (SimHash/Hamming threshold and/or cosine similarity on embeddings), link into same cluster.
- Use conservative thresholds (e.g., Hamming ≤ 6 AND/OR cosine ≥ 0.85) to avoid over‑merging. Provide manual split/merge later.
- Maintain `clusters` table; persist `representative_story_id` to stabilize the UI and list responses.

## Analysis Pipeline (LLM)

Related diagrams:

- Analysis & Overlays, Clustering Decision Flow, ERD: `docs/plans/dp-diagrams.md`

Triggered per new/updated `stories.content_id`:

1. Build prompt context:
   - Clean text (truncate by tokens), title, domain, published_at.
   - Retrieval: fetch similar stories within cluster for cross‑corroboration if helpful.
2. Summaries:
   - Why it matters (3–5 bullets, audience‑aware tone).
   - Key facts (optional, short list with quotes/spans for citation linking).
3. Scoring:
   - Chili/Hype score [0–5] with rationale.
   - Confidence [0–1] from source reliability + number of corroborating sources + language certainty + recency.
4. Citations:
   - Emit structured citations with URLs + optional quote spans; store in `story_overlays.citations`.
5. Embedding:
   - Generate text embedding for discovery; upsert `story_embeddings` (pgvector).
6. Store overlays with `model_version` and timestamps.

Model hygiene:

- Use “extract then summarize” pattern (toolformer style): First ask for extractive facts with spans, then generate summaries referencing those.
- Temperature low (0.2–0.3) for facts, moderate (0.5) for summaries.
- Max token guards; chunk long texts.

## Scheduling & Orchestration

- pg‑boss schedules recurring jobs (cron) and maintains the queue in a dedicated schema.
- Cloud Run Worker (Node/TS) connects to Supabase Postgres, claims jobs, executes long tasks (content fetch, extraction, transcription, PDF parsing, LLM analysis) and writes results back.
- Configure concurrency per job type; retries with backoff; dead‑letter queues.

### Database setup for pg‑boss (Supabase)

- Create a dedicated DB user for the worker with rights to create tables in a `pgboss` schema and read/write pipeline tables.
- Create the `pgboss` schema as the admin role; grant `USAGE, CREATE` on that schema to the worker (avoids ownership/set‑role errors).
- Ensure SSL is enabled in the connection string (`?sslmode=require`); in Node, set `ssl: { rejectUnauthorized: false }`.

Example SQL (run in Supabase SQL Editor):

```
create role worker login password 'REDACTED_STRONG_PASSWORD';
grant usage on schema public to worker;

-- pg-boss schema
create schema if not exists pgboss;
grant usage, create on schema pgboss to worker;

-- app tables in public (adjust as needed)
grant select, insert, update, delete on all tables in schema public to worker;
grant usage on all sequences in schema public to worker;
alter default privileges in schema public grant select, insert, update, delete on tables to worker;
alter default privileges in schema public grant usage on sequences to worker;
```

### Cloud Run Worker (Node/TS) minimal skeleton

```
// src/worker.ts
import PgBoss from 'pg-boss';
import express from 'express';

const connectionString = process.env.DATABASE_URL!; // Supabase DB URL with sslmode=require

async function main() {
  const boss = new PgBoss({ connectionString, schema: 'pgboss', ssl: { rejectUnauthorized: false } as any });
  await boss.start();

  // Schedule recurring pulls (pg-boss cron)
  await boss.schedule('ingest:pull', '*/5 * * * *', { source: 'rss' });

  // Workers
  await boss.work('ingest:pull', { teamSize: 2 }, async (job) => {
    // fetch feeds/APIs using job.data.source, upsert raw_items, enqueue fetch-content
    await boss.send('ingest:fetch-content', { rawItemIds: [] });
  });

  await boss.work('ingest:fetch-content', { teamSize: 4 }, async (job) => {
    // fetch HTML/audio/pdf, extract/transcribe, write contents/stories, enqueue analyze
    await boss.send('analyze:llm', { storyId: '...' });
  });

  // Cloud Run expects an HTTP server
  const app = express();
  app.get('/healthz', (_req, res) => res.send('ok'));
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log('worker up on', port));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Dockerfile:

```
# Dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "dist/worker.js"]
```

Deploy with one min instance to keep the queue active:

```
gcloud run deploy zeke-worker \
  --source . \
  --region us-central1 \
  --min-instances=1 \
  --cpu=1 --memory=1Gi \
  --set-env-vars DATABASE_URL=postgresql://...sslmode=require \
  --no-allow-unauthenticated
```

### Transcription (YouTube + Podcasts)

- YouTube: use `yt-dlp` to fetch audio only (m4a) → transcode with ffmpeg if needed → run `faster-whisper`/`whisper.cpp` in the worker.
- Podcasts: follow RSS enclosures (mp3/aac); download audio → Whisper transcription.
- Store SRT/VTT and plain text in Storage; save transcript URL and text in `contents`.
- Show “transcribing” status in UI; replace when done.

### PDF Extraction (arXiv and others)

- Start with open‑source PDF text extraction in the worker; if the text is too malformed, optionally call a managed service (e.g., GCP Document AI/AWS Textract) to obtain better structure.
- Store the original PDF and extracted text; anchor highlights to the extracted text to enable reader annotations.

## Operational Learnings (2025‑09‑05)

- Supabase Session Pooler resets idle connections occasionally, emitting `{:shutdown, :db_termination}`. Add a Node `pg` Pool error handler to avoid unhandled `'error'` events and process crashes. Our worker now logs `pg_pool_error` and continues.
- Use Session Pooler in production (`DATABASE_URL_POOLER` with `?sslmode=no-verify`) and the Direct DB URL for local dev (`DATABASE_URL` with `?sslmode=no-verify`). The prod deploy script prefers `DATABASE_URL_POOLER`.
- Add 15s AbortController timeouts to external fetches (RSS/XML and article HTML) to prevent hung `fetch` calls from stalling jobs.
- Ensure analysis is enqueued with a concrete `storyId`: link by `content_hash` and create a new story if none exists; send `{ storyId }` to `analyze:llm`.
- Minimal structured logs make progress easy to trace: `boss_started`, `http_listen`, `heartbeat`, `ingest_pull_start/done`, `fetch_content_start/done`, `analyze_llm_start/done`.
- Cloud Run health: expose `/healthz`; also provide debug endpoints `/debug/ingest-now` and `/debug/schedule-rss` for repeatable testing.

### Queues and Scheduling (v1)

- Queues: `system:heartbeat`, `ingest:pull`, `ingest:fetch-content`, `analyze:llm`.
- Cron: `system:heartbeat` and `ingest:pull` scheduled `*/5 * * * *` in `pgboss.schedule` with `tz=UTC`.
- Boss schema: `pgboss` (created once; `BOSS_MIGRATE=false` in prod).

### Environment Variables

- `DATABASE_URL_POOLER` (prod): `postgresql://worker.<project-ref>:<PASSWORD>@<region>.pooler.supabase.com:5432/postgres?sslmode=require`
- `DATABASE_URL` (local): `postgresql://worker:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=no-verify`
- `BOSS_SCHEMA=pgboss`, `BOSS_CRON_TZ=UTC`, `BOSS_MIGRATE=false|true`
- `PORT=8080` for Cloud Run HTTP server

### DeployScripts

- `worker/scripts/deploy-prod-worker.sh`: Deploys to Cloud Run using envs from `worker/.env`; prefers `DATABASE_URL_POOLER`.
- `worker/scripts/deploy-local-worker.sh`: Builds and runs Docker locally; prefers `worker/.env.local`; sets `BOSS_MIGRATE=true` by default.

## Serving

Related diagrams:

- API Read Path and System Context: `docs/plans/dp-diagrams.md`

- `/api/stories` list: accepts `kind`, `q`, `cursor`; returns clusters with a representative + overlays light.
- `/api/stories/:id` detail: story + contents text (or transcript/PDF text), overlays, and safe embed URL.
- `/api/highlights` (POST/GET): create/list highlights anchored to `contents.text`.

Safe embed guideline: Prefer internal reader mode for articles/PDFs/transcripts (render `contents.text`) and use sanitized embeds only when needed. Always validate `https` scheme for embeds.
Serving by medium:

- Article/PDF: render text from `contents.text`; show overlays panel; external link.
- YouTube/Podcast: show transcript first; load player lazily; always safe attributes (allowFullScreen, referrerPolicy, sandbox where applicable).
- Reddit/HN: show internal text; link to thread; cluster with related stories.

## Reader & Annotations

- Content representation: single canonical string `contents.text` per story content version; `content_hash` ensures stability.
- Anchors: highlight spans recorded as `{ start, end, kind, meta? }` offsets into `contents.text`. For transcripts, also store `{ t_start, t_end }` seconds.
- RLS: highlights are per‑user; reads require authenticated users. Worker uses service‑role for writes.

## Cost Controls

- Defer detailed cost controls. Keep simple guards: rerun analysis only if `content_hash` changed or model upgraded.

## Observability & Quality

- Log per‑stage durations + error counts.
- Metrics: % items with clean text; avg tokens per summary; correlation between chili and engagement.
- Manual review queue: UI to flag/approve summaries; feed back corrections.

## Local Dev

- Seed with small fixtures (10–20 items) and disable external calls.
- Toggle “analysis stub” mode that generates overlays via deterministic templates for UI work.

## Incremental Delivery Plan

Phase 0

- Tables: `sources`, `raw_items`, `contents`, `stories`, `clusters` (1:N), `story_overlays`, `story_embeddings vector(1536)`.
- Ingest RSS + HN + arXiv; fetch & extract article text; de‑dup by `content_hash`.
- Serve `/api/stories` and `/api/stories/:id` with internal reader for text.

Phase 1

- Overlays generation (why‑it‑matters, chili/confidence minimal rules + LLM prototype).
- Add highlights table + `/api/highlights`; persist spans anchored to `contents.text`.

Phase 2

- Clustering thresholds tuned; representative selection persisted.
- YouTube/Podcast transcripts; PDF extraction improvements (optional managed OCR).

Phase 3 (ongoing)

- Queue/worker hardening; monitoring; editorial feedback loop; domain reliability model.

## Open Questions

- Domain whitelist vs. open web? Start with curated feeds; expand gradually.
- Storage for raw HTML/transcripts/PDFs: Supabase Storage default; consider S3 later if needed.
- Reader fidelity for complex PDFs: when to invoke managed OCR vs. fallback text.

## Holes / Risks / Mitigations

- Legal/compliance: Respect robots.txt/ToS; allow domain allowlist and blocklist. Cache only what’s needed for analysis; render text in reader mode where permitted.
- Canonicalization: Normalize URLs (strip utm params, resolve redirects) before hashing to reduce false splits.
- Dedupe errors: Over‑merging can hide minority reports; keep conservative thresholds and enable manual split/merge tooling.
- Quality controls: Add an editorial review queue; store model_version and re‑run summaries when the model is upgraded.
- Secrets & auth: Use Supabase service role only in the worker; Edge Functions require authenticated users for reads (no anon). RLS on highlights/bookmarks.
- Observability: Add job run logs, retries, and SLOs (p95 ingest latency, analysis latency). Emit metrics per stage.
- Idempotency: Ensure all jobs are idempotent (upserts by external_id/content_hash; job claim via advisory locks).
- Backfill strategy: Support one‑time backfills per source with pagination throttles; checkpoint progress with cursors.
- Internationalization: Detect language; skip or translate (future) with a label in the UI to avoid misleading summaries.
- Security of iframes: Validate `https` scheme, set `referrerPolicy`, and limit `sandbox` permissions.
- Storage growth: PDFs/audio/transcripts can balloon; set lifecycle for `audio/`, compress transcripts, and dedupe by `content_hash`.
- Rights/compliance: Respect per‑site policies; provide takedown process; allow “do not store raw HTML” flag per domain while keeping extracted text.
