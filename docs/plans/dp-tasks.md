# Data Pipeline Tasks

This checklist captures tasks discussed in the diagram planning thread and ties them to the pipeline spec. Grouped for execution clarity.

## Documentation & Diagrams

- [x] Create `docs/plans/diagrams.md` with Mermaid diagrams
- [x] Reference diagrams from `docs/plans/data-pipeline.md`
- [ ] Keep diagrams small and focused; split by concern
- [ ] Use subgraphs to highlight boundaries (Edge, Worker, DB)
- [ ] Version diagrams alongside `model_version` when overlays change
- [ ] Start with System Context, ERD, and Pipeline DAG when updating

## Architecture & Boundaries

- [ ] Validate trust boundaries: RLS in app routes, service role only in worker
- [ ] Document secret handling and least-privilege keys per environment
- [ ] Confirm deployment topology (Vercel Edge, Worker host, Supabase)

## Data Model

- [ ] Finalize tables: `sources`, `raw_items`, `contents`, `stories`, `story_overlays`, `story_embeddings`, `clusters`
- [ ] Add `content_hash`-based dedupe and indexes
- [ ] Define `cluster_key` computation and uniqueness constraints
- [ ] Store `citations` structure and `model_version` in overlays

## Ingestion

- [ ] Implement per-source cursor strategy (RSS, YouTube, Reddit, HN, arXiv)
- [ ] Build `ingest:pull` job to upsert `raw_items`
- [ ] Enqueue `ingest:fetch-content` for new/changed items

## Content Fetch & Normalization

- [ ] Articles: fetch HTML, store raw, extract clean text (Readability)
- [ ] Video/Podcast: download audio (yt-dlp), transcribe (Whisper), store VTT + text
- [ ] Compute and persist `content_hash` on normalized text
- [ ] Upsert `contents` and `stories`; link existing by `content_hash`

## Clustering

- [ ] Compute `cluster_key` and check near-duplicates
- [ ] SimHash/Hamming and/or cosine similarity thresholds (e.g., ≤6, ≥0.85)
- [ ] Maintain `clusters` membership and representatives

## Analysis (LLM)

- [ ] Build context: clean text, metadata, optional retrieval from cluster
- [ ] Generate summaries (why-it-matters, optional key facts with spans)
- [ ] Score chili/hype and confidence with rationale
- [ ] Emit structured citations; store in `story_overlays`
- [ ] Generate embeddings; upsert into `story_embeddings` (pgvector)
- [ ] Track `model_version`, timestamps, and token guards

## Scheduling & Orchestration

- [ ] Choose queue (pg-boss or jobs table) and implement claim/retry semantics
- [ ] Supabase Scheduled Functions or Vercel Cron for enqueuing
- [ ] Worker for long tasks (transcription, PDF parsing, LLM analysis)
- [ ] Ensure idempotency via upserts and advisory locks

## Serving

- [ ] `/api/stories` list with filters and clusters + overlays lite
- [ ] `/api/stories/:id` detail with overlays, citations, safe embed URL
- [ ] `/api/share` snapshot with immutable `share_id`

## Cost Controls

- [ ] Rate-limit per source; track LLM tokens and batch embeddings
- [ ] Gated transcription for long media; delete large audio post-transcript
- [ ] Re-analyze only on `content_hash` change or model upgrade

## Observability & Quality

- [ ] Log per-stage durations, errors; define SLOs (p95 ingest/analysis)
- [ ] Metrics: % items with clean text; tokens per summary; chili vs engagement
- [ ] Manual review queue: approve/flag summaries and feed corrections

## Security & Compliance

- [ ] Respect robots.txt/ToS; domain allow/block lists
- [ ] Sanitize embeds; enforce `https`, `referrerPolicy`, and `sandbox`
- [ ] Takedown process and "do not store raw HTML" per-domain flag

## Delivery Phases

- [ ] Phase 0: tables, RSS/HN/arXiv ingest, extraction, dedupe, basic serving
- [ ] Phase 1: overlays generation, embeddings, UI wiring
- [ ] Phase 2: clustering, citations, YT/Podcast transcripts
- [ ] Phase 3: queue/worker hardening, monitoring, editorial loop, domain reliability

