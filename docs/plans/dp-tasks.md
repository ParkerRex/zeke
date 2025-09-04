# Data Pipeline Tasks

This checklist captures tasks discussed in the diagram planning thread and ties them to the pipeline spec. Grouped for execution clarity.

## Suggested Next Steps (now)

Stack Bootstrap (priority)

- [x] pg-boss setup: create `pgboss` schema, grant `worker` role (CONNECT, CREATE), verify SSL.
- [x] Worker scaffold + local run: pg-boss + queues created, `/healthz`, scheduled `system:heartbeat` OK.
- [ ] Deploy worker to Cloud Run (Session Pooler URL) and verify heartbeat in logs.
- [ ] Observability baseline: structured logs, job heartbeat/latency metrics; confirm retries and DLQ work.

Database Bootstrap

- [ ] Enable pgvector in Supabase and add `ivfflat` index for `story_embeddings.embedding`.
- [ ] Phase 0 SQL migrations: `sources`, `raw_items`, `contents`, `stories`, `clusters` (1:N), `story_overlays`, `story_embeddings vector(1536)`, `highlights`; unique indexes and constraints.

Core Workflows v1

- [ ] Ingestion v1: RSS, HN, arXiv connectors with cursors; upsert `raw_items` (idempotent) and enqueue `fetch-content`.
- [ ] Extraction v1: Readability HTML → `contents.text`, canonicalize URLs, compute `content_hash`, upsert `contents`/`stories` with link-by-hash.
- [ ] APIs v1: `/api/stories` (list with representative + overlays lite placeholder) and `/api/stories/:id` (story + `contents.text`).
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

- [ ] Finalize tables: `sources`, `raw_items`, `contents`, `stories`, `clusters`, `story_overlays`, `story_embeddings`, `highlights`
- [ ] Add `content_hash`-based dedupe and indexes
- [ ] Define `cluster_key` computation and 1:N cluster→stories cardinality
- [ ] Store `citations` structure and `model_version` in overlays
- [ ] Create SQL migrations (tables, indexes, constraints, comments)
- [ ] Add unique (source_id, external_id) on `raw_items`
- [ ] Add `sources.last_cursor jsonb`, `last_checked`, `domain`, `authority_score`
- [ ] Add pgvector extension and index on `story_embeddings (vector(1536))`
- [ ] Buckets: create Storage buckets (raw-html, pdfs, audio, transcripts, images)

## Ingestion

- [ ] Implement per-source cursor strategy (RSS, YouTube, Reddit, HN, arXiv)
- [ ] Build `ingest:pull` job to upsert `raw_items`
- [ ] Enqueue `ingest:fetch-content` for new/changed items
- [ ] Implement source connectors: RSS/Atom, YouTube Data API, Reddit API, HN Algolia, arXiv
- [ ] Handle pagination, rate limiting, and errors per source
- [ ] Normalize incoming items (url, title, timestamps, kind, metadata)
- [ ] Persist `discovered_at` and compute stable external_id per source

## Content Fetch & Normalization

- [ ] Articles: fetch HTML, store raw, extract clean text (Readability)
- [ ] Video/Podcast: download audio (yt-dlp), transcribe (Whisper), store VTT + text
- [ ] Compute and persist `content_hash` on normalized text
- [ ] Upsert `contents` and `stories`; link existing by `content_hash`
- [ ] Canonicalize URLs (strip UTM, resolve redirects) before hashing
- [ ] PDF path: fetch and extract text; store pdf; fall back to managed OCR if extraction is poor
- [ ] Language detection; mark unsupported for now
- [ ] Storage naming by `content_hash`; retention policy for large audio
- [ ] Annotation-ready: define highlight span format anchored to `contents.text`

## Clustering

- [ ] Compute `cluster_key` and check near-duplicates
- [ ] SimHash/Hamming and/or cosine similarity thresholds (e.g., ≤6, ≥0.85)
- [ ] Maintain `clusters` table; persist `representative_story_id`
- [ ] Choose representative selection strategy (freshness, authority)
- [ ] Expose manual split/merge tooling (admin)
- [ ] Aggregate cluster signals (counts, recency velocity) for hype/confidence

## Analysis (LLM)

- [ ] Build context: clean text, metadata, optional retrieval from cluster
- [ ] Generate summaries (why-it-matters, optional key facts with spans)
- [ ] Score chili/hype and confidence with rationale
- [ ] Emit structured citations; store in `story_overlays`
- [ ] Generate embeddings; upsert into `story_embeddings` (pgvector)
- [ ] Track `model_version`, timestamps, and token guards
- [ ] Prompt design: extract-then-summarize pattern with spans
- [ ] Re-analyze trigger on `content_hash` change or model upgrade
- [ ] Batch embeddings generation to control cost
- [ ] Define confidence formula (source reliability, corroboration, language certainty, recency)
- [ ] Choose LLM + embedding models; set temperatures and token budgets
- [ ] Chunking/guardrails for long texts; incremental analysis
- [ ] Persist citation quote spans and link to UI highlights

## Scheduling & Orchestration

- [ ] Choose queue (pg-boss) and implement claim/retry semantics
- [ ] Configure pg-boss cron for recurring jobs (ingest pulls)
- [ ] Cloud Run worker for long tasks (transcription, PDF parsing, LLM analysis)
- [ ] Ensure idempotency via upserts and advisory locks
- [ ] Implement retries, backoff, and dead-letter handling
- [ ] Concurrency controls per job type (e.g., transcription workers)
- [ ] Backfill support with cursors and throttles

### DB setup for pg-boss

- [ ] Create `pgboss` schema and grant privileges to a dedicated `worker` DB user
- [ ] Verify SSL connection string (`?sslmode=require`) and `ssl.rejectUnauthorized=false` in Node client

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

- [ ] Phase 0: tables, RSS/HN/arXiv ingest, extraction, dedupe, reader serving
- [ ] Phase 1: overlays generation, embeddings, highlights API
- [ ] Phase 2: clustering, citations, YT/Podcast transcripts, PDF improvements
- [ ] Phase 3: queue/worker hardening, monitoring, editorial loop, domain reliability
