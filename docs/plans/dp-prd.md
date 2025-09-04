# ZEKE Data Pipeline Plan

See companion visuals in `docs/plans/diagrams.md` for architecture, data flow, and operations diagrams referenced throughout this plan.

This document proposes a pragmatic, incremental pipeline to ingest stories from multiple sources, normalize content, run summarization/analysis, and serve high‑quality artifacts to the app (Why it matters, chili score, confidence, citations, etc.). It is designed to fit our current stack (Next.js + Supabase) and keep costs predictable while remaining extensible.

## Goals

- Ingest heterogeneous sources (articles, YouTube, Reddit, HN, arXiv, podcasts).
- Normalize into a single Story model with durable content and metadata.
- Generate trustworthy overlays: why‑it‑matters summary, chili/hype score, confidence, citations.
- Deduplicate and cluster near duplicates across sources.
- Serve fast to the app with stable IDs and simple APIs.
- Keep costs and operational overhead low; enable local dev.

## High‑Level Architecture

Refer to:

- System Context and Deployment Topology diagrams: `docs/plans/diagrams.md`
- Trust Boundaries & RLS: `docs/plans/diagrams.md`

- Ingestion Worker(s): Scheduled jobs fetch new items from source feeds/APIs.
- Normalization: Convert raw items → canonical Story format; fetch article HTML/transcript; extract clean text.
- Analysis: Run LLM summarization + scoring with citations; create embeddings for retrieval.
- Storage: Postgres (Supabase) for metadata + overlays; Supabase Storage/S3 for raw HTML/transcripts; pgvector for embeddings (or external vector DB if needed).
- Serving: /api/stories (lists + filters), /api/stories/:id (full), /api/share (snapshots).
- Orchestration: Supabase cron + queue (pg-boss) or a minimal worker (Next.js Route Handlers + background task via Vercel Cron) for now; can upgrade to a dedicated worker later.

### Storage layout (proposed)

Related diagrams:

- Data Lineage and ERD: `docs/plans/diagrams.md`

- Postgres (Supabase): all relational tables (see below).
- Storage buckets:
  - `raw-html/` `{content_hash}.html` (original fetched HTML)
  - `pdfs/` `{content_hash}.pdf`
  - `audio/` `{content_hash}.m4a|mp3` (temporary; deletable after transcript)
  - `transcripts/` `{content_hash}.vtt` + `{content_hash}.txt`
  - Optional `images/` for thumbnails (YouTube, site OG)
- Naming: primary key = `content_hash` of normalized text; alternate keys by `raw_item_id` for traceability.
- Retention: keep text forever; consider lifecycle policy to evict large audio after transcription.

## Data Model (proposed)

Postgres tables (Supabase):

- `sources` (id, kind, name, url, last_cursor)
- `raw_items` (id, source_id, external_id, url, kind, title, metadata jsonb, discovered_at, content_hash, status)
- `contents` (id, raw_item_id, text, html_url (storage), transcript_url (storage), lang, extracted_at)
- `stories` (id, canonical_url, kind, title, primary_url, published_at, cluster_key, content_id, created_at)
- `story_overlays` (story_id, why_it_matters, chili int, confidence float, citations jsonb, model_version, analyzed_at)
- `story_embeddings` (story_id, embedding vector, dim int, model_version)
- `clusters` (cluster_key, representatives jsonb, created_at)

Notes:

- `cluster_key`: hash of normalized title + domain + text fingerprint to merge near-duplicates.
- `citations`: array of { title, url, domain, span? } that the model referenced.
- For YouTube/podcasts, `contents.transcript_url` stores transcript file; `contents.text` stores merged transcript text.

## Ingestion

Related diagrams:

- Pipeline DAG and Ingestion Sequence: `docs/plans/diagrams.md`

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
- Behavior: Read cursor → fetch → upsert items → compute a new cursor from newest item ingested → save.

## Content Fetch & Normalization

Related diagrams:

- Content Fetch & Normalization flow: `docs/plans/diagrams.md`

For `raw_items` needing content:

- Articles: GET HTML (follow redirects), store raw HTML to storage, use Readability (JSDOM) to extract clean text & title; record `content_hash` on normalized text to dedupe.
- YouTube/Podcasts: Prefer local transcription (see Transcription) rather than relying on third‑party transcripts.
- Reddit/HN/arXiv: Use API text directly; expand linked article if necessary (based on kind/heuristics).
- Detect language and drop non‑English (configurable).
- Create/Upsert `contents` row with clean `text` and optional storage URLs.
- Generate `cluster_key` = hash(normalized title + domain + SimHash(text)) to cluster.
- Upsert `stories` row (one per canonical URL/cluster_key).

### PDFs & arXiv papers

- Download PDF (arXiv or publisher) to Storage; record source, checksum, and content length.
- Extract text with `pdfminer.six`/`pdfplumber` (Python) or `pdfjs` (Node) and preserve page numbers.
- If extracted coverage is low (e.g., < 70% of pages), run OCR (Tesseract) and merge results.
- Split by section headings (Introduction/Methods/Results/Discussion) and pages for stable citations.
- Store plain text in `contents.text`, PDF URL in storage, and section spans in `metadata` for later citation linking.

### Medium‑specific handling (ingest → store → serve)

- Articles
  - Ingest: RSS/Atom → fetch HTML.
  - Store: raw HTML (storage), clean `contents.text`.
  - Serve: internal reader mode (render text) with canonical link out.
- arXiv / PDFs
  - Ingest: Atom entry → download PDF.
  - Store: PDF (storage), extracted sectioned text.
  - Serve: internal reader (text) + optional PDF viewer link; citations reference page spans.
- YouTube
  - Ingest: channel/search → audio via `yt-dlp`.
  - Store: transcript VTT + text; optional audio until done.
  - Serve: internal transcript reader + lightweight YouTube embed (with safe attributes); overlays reference timestamps.
- Podcasts
  - Ingest: RSS enclosure → audio download.
  - Store: transcript VTT + text; optional audio until done.
  - Serve: internal transcript/audio player; overlays reference timestamps.
- Reddit / HN
  - Ingest: API text (selftext/summary) and linked URL (optional expansion).
  - Store: normalized text with metadata (score, author, thread link).
  - Serve: internal text; link out to thread; cluster with linked article if expanded.

## Deduplication & Clustering

- Preserve evidence: Never drop raw items. `raw_items` and `contents` keep all sources for a story.
- On new/updated `stories`, compute `cluster_key` and lookup recent neighbors; if near match (SimHash/Hamming threshold and/or cosine similarity on embeddings), link into same cluster.
- Use conservative thresholds (e.g., Hamming ≤ 6 AND/OR cosine ≥ 0.85) to avoid over‑merging. Provide manual split/merge later.
- Maintain `clusters` table with `representatives` and member list. Overlays can aggregate counts/velocity across members to power hype/confidence.

## Analysis Pipeline (LLM)

Related diagrams:

- Analysis & Overlays, Clustering Decision Flow, ERD: `docs/plans/diagrams.md`

Triggered per new/updated `stories.content_id`:

1. Build prompt context:
   - Clean text (truncate by tokens), title, domain, published_at.
   - Retrieval: fetch similar stories within cluster for cross-corroboration if helpful.
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

- Use “extract then summarize” pattern (toolformer style): First ask for extractive facts with spans, then generate summaries referencing those. This reduces hallucination.
- Temperature low (0.2–0.3) for facts, moderate (0.5) for summaries.
- Max token guards; chunk long texts.

## Scheduling & Orchestration

Related diagrams:

- Job State Machine and Deployment Topology: `docs/plans/diagrams.md`

- Option A – Supabase Edge Functions (Deno):
  - Use Scheduled Functions (cron) to run per‑source `ingest:pull` and cursor updates.
  - Good for short, network‑bound tasks: pulling feeds/APIs, creating `raw_items` and enqueuing jobs.
  - Not ideal for long CPU work (transcription/OCR); hand off to queue.
- Option B – Background Worker (recommended for heavy jobs):
  - A small Node/Python worker (Fly/Render/EC2) that connects to Postgres and processes jobs.
  - Queue: pg‑boss (Postgres‑native) or a simple `jobs` table with advisory locks, retries, and backoff.
  - Edge Functions act as enqueuers; the worker claims rows and performs long tasks (transcription, PDF parsing, LLM analysis) and writes results back.
- Later: Temporal/Prefect if workflows require complex retries/fan‑out.

### Transcription (YouTube + Podcasts)

- YouTube: use `yt-dlp` to fetch audio only (m4a) → transcode with ffmpeg if needed → run `faster-whisper`/`whisper.cpp` (open source) in the background worker.
- Podcasts: follow RSS enclosures (mp3/aac) — Apple Podcasts Lookup API can yield show RSS; download audio → Whisper transcription.
- Store SRT/VTT and plain text in Storage; save transcript URL and text in `contents`.
- Show “transcribing” status in UI; replace when done. Optionally delete large audio after successful transcript to control storage.

## Serving

Related diagrams:

- API Read Path and System Context: `docs/plans/diagrams.md`

- `/api/stories` list: accepts `kind`, `q`, `saved`, `cursor`; returns clusters with representative + overlays light.
- `/api/stories/:id` detail: full overlays, citations, and safe embed URL.
- `/api/share`: snapshot a story with overlays for immutable sharing; persist a `share_id` with denormalized payload.

Safe embed guideline: Prefer internal reader mode for articles (render `contents.text`) and use sanitized embeds only when needed. Always validate `https` scheme for embeds.
Serving by medium:

- Article/PDF: render text from `contents.text`; show overlays panel; external link.
- YouTube/Podcast: show transcript first; load player lazily; always safe attributes (allowFullScreen, referrerPolicy, sandbox where applicable).
- Reddit/HN: show internal text; link to thread; cluster with related stories.

## Cost Controls

- Rate‑limit per source; track tokens per analysis; batch embeddings.
- Only transcribe long videos on demand; otherwise rely on available transcripts.
- Rerun analysis only if `content_hash` changed or model upgraded.

## Observability & Quality

- Log per‑stage durations + error counts.
- Metrics: % items with clean text; avg tokens per summary; correlation between chili and engagement.
- Manual review queue: UI to flag/approve summaries; feed back corrections.

## Local Dev

- Seed with small fixtures (10–20 items) and disable external calls.
- Toggle “analysis stub” mode that generates overlays via deterministic templates for UI work.

## Incremental Delivery Plan

Phase 0 (1–2 days)

- Tables: `raw_items`, `contents`, `stories`.
- Ingest RSS + HN + arXiv; fetch & extract article text; de‑dup by content hash.
- Serve `/api/stories` from DB; wire viewer to safe embed or internal render of extracted text.

Phase 1 (2–4 days)

- Add overlays generation (why‑it‑matters, chili/confidence minimal rules + LLM prototype).
- Add `story_overlays` + embeddings; wire to UI overlays.

Phase 2 (3–5 days)

- Clustering + citations; multi‑source corroboration; refine confidence formula.
- Add YouTube/POD transcripts, with cost‑gated Whisper fallback.

Phase 3 (ongoing)

- Queue/worker hardening; monitoring; editorial feedback loop; domain reliability model.

## Open Questions

- Domain whitelist vs. open web? Start with curated feeds; expand gradually.
- Storage for raw HTML/transcripts: Supabase Storage vs. S3 (encryption, lifecycle).
- How much of the article do we render inline vs. iframe? Recommendation: prefer internal reader mode for speed/control; link out as needed.

## Holes / Risks / Mitigations

- Legal/compliance: Respect robots.txt/ToS; allow domain allowlist and blocklist. Cache only what’s needed for analysis; render text in reader mode where permitted.
- Canonicalization: Normalize URLs (strip utm params, resolve redirects) before hashing to reduce false splits.
- Dedupe errors: Over‑merging can hide minority reports; keep conservative thresholds and enable manual split/merge tooling.
- Quality controls: Add an editorial review queue; store model_version and re‑run summaries when the model is upgraded.
- Cost controls: Whisper and OCR are expensive — queue with backpressure, prioritize by predicted impact, and delete large audio after transcription.
- Secrets & auth: Use Supabase service role only in the worker; Edge Functions use scoped anon keys + RLS.
- Observability: Add job run logs, retries, and SLOs (p95 ingest latency, analysis latency). Emit metrics per stage.
- Idempotency: Ensure all jobs are idempotent (upserts by external_id/content_hash; job claim via advisory locks).
- Backfill strategy: Support one‑time backfills per source with pagination throttles; checkpoint progress with cursors.
- Internationalization: Detect language; skip or translate (future) with a label in the UI to avoid misleading summaries.
- Security of iframes: Validate `https` scheme, set `referrerPolicy`, and limit `sandbox` permissions.
- Storage growth: PDFs/audio/transcripts can balloon; set lifecycle for `audio/`, compress transcripts, and dedupe by `content_hash`.
- Rights/compliance: Respect per‑site policies; provide takedown process; allow “do not store raw HTML” flag per domain while keeping extracted text.
