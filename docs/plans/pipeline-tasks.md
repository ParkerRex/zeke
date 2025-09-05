# Data Pipeline Tasks

This checklist captures tasks discussed in the diagram planning thread and ties them to the pipeline spec. Grouped for execution clarity.

## Current Status (2025-09-05)

**Pipeline is working!** 47 raw items → 16 contents → 17 stories → 9 overlays → 9 embeddings processed. Worker running every 5 min.

**✅ FIXED**: LLM analysis now working with real OpenAI GPT-4o-mini and text-embedding-3-small integration!

## Suggested Next Steps (now)

Priority

- [x] Deploy worker to Cloud Run (Session Pooler URL, `BOSS_MIGRATE=false`) and verify heartbeat in logs.
- [x] Implement `ingest:pull` (RSS first) + schedule via pg-boss cron (every 5 min); upsert `raw_items` and enqueue `ingest:fetch-content`.
- [x] Implement Extraction v1 (Readability + canonicalize + `content_hash`) writing `contents`/`stories`.
- [x] **FIXED**: LLM analysis pipeline with real OpenAI GPT-4o-mini + text-embedding-3-small integration
- [x] **COMPLETE**: Add `/api/stories` and `/api/stories/:id` serving real database data with AI overlays

Stack Bootstrap (done locally)

- [x] pg-boss setup: create `pgboss` schema, grant `worker` role (CONNECT, CREATE), verify SSL.
- [x] Worker scaffold + local run: pg-boss + queues created, `/healthz`, scheduled `system:heartbeat` OK.
- [x] Observability baseline: structured logs, job heartbeat/latency metrics; confirm retries and DLQ work.

Database Bootstrap

- [x] Enable pgvector in Supabase and add `ivfflat` index for `story_embeddings.embedding`.
- [x] Phase 0 SQL migrations: `sources`, `raw_items`, `contents`, `stories`, `clusters` (1:N), `story_overlays`, `story_embeddings vector(1536)`, `highlights`; unique indexes and constraints.

Core Workflows v1

- [x] Ingestion v1: RSS connectors with cursors; upsert `raw_items` (idempotent) and enqueue `fetch-content`. **Working: 2 RSS sources, 47 items ingested**
- [x] Extraction v1: Readability HTML → `contents.text`, canonicalize URLs, compute `content_hash`, upsert `contents`/`stories` with link-by-hash. **Working: 16 contents, 17 stories created**
- [x] **FIXED**: LLM Analysis v1: Real OpenAI GPT-4o-mini analysis + text-embedding-3-small embeddings **Working: 9 overlays, 9 embeddings generated**
- [x] **COMPLETE**: APIs v1: `/api/stories` (list with real data + overlays) and `/api/stories/:id` (story + AI analysis) **SERVING REAL DATA**
- [ ] Highlights MVP: create `/api/highlights` (POST/GET) with spans anchored to `contents.text`.
- [ ] RLS policies: authenticated reads for stories/overlays; per-user RLS on highlights; service-role writes for worker.
- [ ] Local dev: seed 10–20 fixtures and enable “analysis stub” overlays for UI work.

## Documentation & Diagrams

- [x] Create `docs/plans/dp-diagrams.md` with Mermaid diagrams
- [x] Reference diagrams from `docs/plans/dp-prd.md`
- [ ] Keep diagrams small and focused; split by concern
- [ ] Use subgraphs to highlight boundaries (Edge, Worker, DB)
- [ ] Version diagrams alongside `model_version` when overlays change
- [ ] Start with System Context, ERD, and Pipeline DAG when updating
- [ ] Align references to `docs/plans/dp-diagrams.md` across docs
- [ ] Ensure Mermaid compatibility (avoid unicode arrows/comparators)

## Architecture & Boundaries

- [ ] Validate trust boundaries: authenticated reads via RLS; service role only in worker (no anon)
- [ ] Document secret handling and least-privilege keys per environment
- [ ] Confirm deployment topology (Next.js, Cloud Run Worker, Supabase)
- [ ] Define environment variables per role (edge auth keys, service role, storage)
- [ ] Write RLS policies for read paths (auth required) and per-user tables (highlights)

## Data Model

- [x] Finalize tables: `sources`, `raw_items`, `contents`, `stories`, `clusters`, `story_overlays`, `story_embeddings`, `highlights`
- [x] Add `content_hash`-based dedupe and indexes
- [ ] Define `cluster_key` computation and 1:N cluster→stories cardinality
- [ ] Store `citations` structure and `model_version` in overlays
- [x] Create SQL migrations (tables, indexes, constraints, comments)
- [x] Add unique (source_id, external_id) on `raw_items`
- [x] Add `sources.last_cursor jsonb`, `last_checked`, `domain`, `authority_score`
- [x] Add pgvector extension and index on `story_embeddings (vector(1536))`
- [ ] Buckets: create Storage buckets (raw-html, pdfs, audio, transcripts, images)

## Ingestion

- [x] Implement per-source cursor strategy (RSS working, others pending)
- [x] Build `ingest:pull` job to upsert `raw_items` **Working: 47 items from 2 RSS sources**
- [x] Enqueue `ingest:fetch-content` for new/changed items **Working: 42 completed, 1 active**
- [x] Implement source connectors: RSS/Atom **Working**, YouTube Data API, Reddit API, HN Algolia, arXiv **TODO**
- [x] Handle pagination, rate limiting, and errors per source
- [x] Normalize incoming items (url, title, timestamps, kind, metadata)
- [x] Persist `discovered_at` and compute stable external_id per source

## Content Fetch & Normalization

- [x] Articles: fetch HTML, store raw, extract clean text (Readability) **Working: 16 contents processed**
- [ ] Video/Podcast: download audio (yt-dlp), transcribe (Whisper), store VTT + text
- [x] Compute and persist `content_hash` on normalized text **Working: content_hash generated**
- [x] Upsert `contents` and `stories`; link existing by `content_hash` **Working: 15 stories created**
- [x] Canonicalize URLs (strip UTM, resolve redirects) before hashing
- [ ] PDF path: fetch and extract text; store pdf; fall back to managed OCR if extraction is poor
- [ ] Language detection; mark unsupported for now
- [ ] Storage naming by `content_hash`; retention policy for large audio
- [x] Annotation-ready: define highlight span format anchored to `contents.text`

## Clustering

- [ ] Compute `cluster_key` and check near-duplicates
- [ ] SimHash/Hamming and/or cosine similarity thresholds (e.g., ≤6, ≥0.85)
- [ ] Maintain `clusters` table; persist `representative_story_id`
- [ ] Choose representative selection strategy (freshness, authority)
- [ ] Expose manual split/merge tooling (admin)
- [ ] Aggregate cluster signals (counts, recency velocity) for hype/confidence

## Analysis (LLM) - **✅ WORKING WITH REAL OPENAI**

**Status**: analyze:llm jobs working with real OpenAI integration (9 overlays/embeddings generated)

- [x] **FIXED**: Real OpenAI GPT-4o-mini analysis generating story overlays and embeddings
- [x] Build context: clean text, metadata, title + content for analysis
- [x] Generate summaries (why-it-matters with bullet points explaining significance)
- [x] Score chili/hype (0-5) and confidence (0-1) with AI-powered rationale
- [x] Emit structured analysis; store in `story_overlays` with model_version tracking
- [x] Generate embeddings; upsert into `story_embeddings` (1536-dim pgvector)
- [x] Track `model_version` (gpt-4o-mini-v1, text-embedding-3-small-v1), timestamps
- [x] Prompt design: structured JSON output with content analysis and scoring
- [x] Graceful fallbacks: stub analysis if OpenAI API fails
- [x] Content truncation: handle long texts within token limits (8k chars for analysis, 6k for embeddings)
- [x] Choose LLM + embedding models: GPT-4o-mini + text-embedding-3-small with temperature 0.3
- [x] Error handling: JSON parsing fixes for markdown code blocks, proper logging
- [ ] Re-analyze trigger on `content_hash` change or model upgrade
- [ ] Batch embeddings generation to control cost
- [ ] Define confidence formula (source reliability, corroboration, language certainty, recency)
- [ ] Persist citation quote spans and link to UI highlights

## Scheduling & Orchestration

- [x] Choose queue (pg-boss) and implement claim/retry semantics **Working: jobs processing**
- [x] Configure pg-boss cron for recurring jobs (ingest pulls) **Working: every 5 min**
- [x] Cloud Run worker for long tasks (transcription, PDF parsing, LLM analysis) **Working: deployed**
- [x] Ensure idempotency via upserts and advisory locks
- [x] Implement retries, backoff, and dead-letter handling **Working: 2 failed jobs in DLQ**
- [x] Concurrency controls per job type (e.g., transcription workers)
- [ ] Backfill support with cursors and throttles

### DB setup for pg-boss

- [x] Create `pgboss` schema and grant privileges to a dedicated `worker` DB user **Working: schema exists**
- [x] Verify SSL connection string (`?sslmode=require`) and `ssl.rejectUnauthorized=false` in Node client

## Serving

- [ ] `/api/stories` list with filters and clusters + overlays lite
- [ ] `/api/stories/:id` detail with overlays, citations, safe embed URL
- [ ] Cursor-based pagination and stable ordering
- [ ] Safe embed enforcement (https, referrerPolicy, sandbox)
- [ ] Internal reader for articles/transcripts; sanitize HTML rendering
- [ ] Clustered listing UX (representative + alternates)
- [ ] Per-medium rendering: article/pdf (reader + link), youtube/podcast (transcript-first + player), reddit/HN (internal text + thread link)
- [ ] `/api/highlights` create/list for annotations

## Cost Controls

- [ ] Defer detailed cost controls; basic guardrails only (re-analyze on content change)

## Observability & Quality

- [ ] Log per-stage durations, errors; define SLOs (p95 ingest/analysis)
- [ ] Metrics: % items with clean text; tokens per summary; chili vs engagement
- [ ] Manual review queue: approve/flag summaries and feed corrections
- [ ] Structured logs and job audit trail
- [ ] Dashboards for throughput, latency, failure rates
- [ ] Alerts on SLO breaches and DLQ growth

## Security & Compliance

- [ ] Respect robots.txt/ToS; domain allow/block lists
- [ ] Sanitize embeds; enforce `https`, `referrerPolicy`, and `sandbox`
- [ ] Takedown process and "do not store raw HTML" per-domain flag
- [ ] Secrets management; avoid service role in Edge; scope keys
- [ ] Data retention policies (audio deletion; transcript compression)
- [ ] Internationalization handling to avoid misleading summaries

## Local Dev

- [ ] Seed with small fixtures (10–20 items) and disable external calls
- [ ] Toggle "analysis stub" mode for overlays
- [ ] Local dev config to point to stubbed sources and Storage
- [ ] Deterministic test fixtures for parsing, clustering, and overlays

## Decisions / Open Questions

- [ ] Domain whitelist vs. open web startup strategy; define initial allowlist
- [ ] Storage choice for raw artifacts: Supabase Storage vs S3 (encryption, lifecycle)
- [ ] Inline reader vs. iframe embed defaults per media type
- [ ] Queue selection (pg-boss vs custom jobs table) and Cloud Run config
- [ ] Cluster thresholds and similarity methods; revisit after initial data
- [ ] Domain reliability model approach and data sources
- [ ] Language policy: skip, label, or translate non-English content
- [ ] Migration plan if external vector DB becomes necessary

## Delivery Phases

- [x] Phase 0: tables, RSS ingest, extraction, dedupe, LLM analysis **COMPLETE ✅** - need to add reader serving APIs
- [x] Phase 1: overlays generation **WORKING ✅**, embeddings **WORKING ✅** - need highlights API
- [ ] Phase 2: clustering, citations, YT/Podcast transcripts, PDF improvements
- [ ] Phase 3: queue/worker hardening, monitoring, editorial loop, domain reliability
