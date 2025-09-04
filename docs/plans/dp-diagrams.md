# ZEKE Data Pipeline Diagrams

This document contains Mermaid diagrams to visualize the data pipeline, storage, and serving architecture. Keep each diagram focused and use them together for clarity.

## System Context

Shows the main components and external dependencies and how they communicate.

```mermaid
graph LR
  U[Browser App] --> R[Next.js Routes/Edge]
  R --> DB[(Supabase Postgres + pgvector)]
  R --> ST[(Supabase Storage)]
  R -. cron/enqueue .-> W[Background Worker]
  R -. source fetch .-> Ext[External Sources: RSS, HN, Reddit, YouTube, arXiv]
  W --> DB
  W --> ST
  W -.-> LLM[LLM API]
  W -.-> EMB[Embeddings API]
  W -.-> YTDLP[yt-dlp/Whisper]
```

## Deployment Topology

Shows where processes run (Edge, Worker, Supabase) and how they connect.

```mermaid
graph TB
  subgraph Browser
    UI[User]
  end
  subgraph Vercel/Next.js
    Edge[Route Handlers + Cron]
  end
  subgraph Worker Host
    Work[Queue Worker]
  end
  subgraph Supabase
    PG[(Postgres)]
    STO[(Storage)]
  end
  UI-->Edge
  Edge-->PG
  Edge-->STO
  Edge-. enqueue jobs .->Work
  Work-->PG
  Work-->STO
```

## Trust Boundaries & RLS

Highlights public vs private components and where RLS/service-role apply.

```mermaid
graph LR
  subgraph Public RLS
    Edge[Next.js Routes]
  end
  subgraph Private Service Role
    Work[Background Worker]
  end
  Edge-->PG[(Postgres + RLS)]
  Work-->PG
  Work-->STO[(Storage)]
```

## Pipeline DAG (End-to-End)

Maps the end-to-end pipeline from ingest pull to overlays and embeddings.

> What is a DAG and why it matters
>
> - DAG = Directed Acyclic Graph: nodes are tasks, edges are dependencies, and there are no cycles.
> - Importance: enforces correct ordering, enables safe parallelism, supports retries/backfills, and improves observability.
> - In this project: each stage (ingest, fetch, extract/transcribe, hash, dedupe/link, cluster, analyze) is a node; edges express dependencies so the queue can run tasks concurrently when possible, rerun failed nodes idempotently, and avoid cycles that would cause infinite loops.

```mermaid
graph LR
  P[Pull Feeds/APIs] --> U[Upsert raw_items]
  U --> F[Fetch Content]
  F --> X[Extract / Transcribe]
  X --> H[Compute content_hash]
  H -->|new| I[Insert contents/stories]
  H -->|exists| L[Link existing story]
  I --> C[Cluster]
  C --> A[LLM Analyze]
  A --> O[[story_overlays]]
  A --> E[[story_embeddings]]
```

## Ingestion Sequence

Walks through a single ingest run from cron to queued content fetch.

```mermaid
sequenceDiagram
  participant Cron
  participant Edge as Edge Function/Route
  participant API as Source API
  participant DB as Supabase
  participant Q as Queue
  Cron->>Edge: ingest:pull(source,cursor)
  Edge->>API: fetch new items
  API-->>Edge: items
  Edge->>DB: upsert raw_items
  Edge->>Q: enqueue fetch-content
```

## Content Fetch & Normalization

Branches for articles vs audio and converges on normalized text/content_hash.

```mermaid
graph TD
  A[raw_item] -->|article| B[Fetch HTML]
  A -->|video or podcast| C[Fetch Audio]
  B --> D[Extract Clean Text - Readability]
  C --> E[Transcribe - Whisper]
  D --> H[Hash text to content_hash]
  E --> H[Hash text to content_hash]
  H -->|new| S[Insert contents and story]
  H -->|exists| L[Link story]
```

## Analysis & Overlays

Shows context building, LLM outputs (summaries/scores/citations), and persistence.

```mermaid
graph TD
  S[Story] --> C[Build Context + Retrieval]
  C --> L[LLM: Summaries + Scores + Citations]
  S --> EM[Embedding]
  L --> O[Upsert story_overlays]
  EM --> V[Upsert story_embeddings]
```

## ERD (Core Tables)

Depicts the core tables and their relationships.

> What is an ERD and why it matters
>
> - ERD = Entity-Relationship Diagram: visual map of entities (tables), their attributes, and how they relate.
> - Importance: clarifies ownership and normalization, reveals join paths and constraints, and informs indexing and RLS before implementation.
> - In this project: captures how `sources`, `raw_items`, `contents`, `stories`, `story_overlays`, `story_embeddings`, and `clusters` connect; guides keys like `content_hash` and `cluster_key`, and safe query patterns for APIs.

```mermaid
erDiagram
  sources ||--o{ raw_items : has
  raw_items ||--|| contents : yields
  contents ||--|| stories : feeds
  stories ||--o{ story_overlays : has
  stories ||--o{ story_embeddings : has
  stories }o--o{ clusters : member_of
```

## Clustering Decision Flow

Decision gates to join an existing cluster or create a new one.

```mermaid
flowchart TD
  A[New/Updated Story] --> B[Compute cluster_key]
  B --> C{SimHash ≤ 6?}
  C -->|Yes| D[Join Cluster]
  C -->|No| E{Cosine ≥ 0.85?}
  E -->|Yes| D
  E -->|No| F[Create New Cluster]
```

> What is a cluster and why it matters
>
> - Cluster: a group of near-duplicate or closely related stories about the same topic or event, merged via a `cluster_key` and similarity checks (SimHash/Hamming and vector cosine).
> - For development: reduces duplication, gives stable grouping keys for caching/URLs, powers retrieval for LLM context/citations, and simplifies dedupe/debugging and backfills.
> - For users: avoids repetitive listings, shows a representative item with alternatives, aggregates corroboration to boost confidence, and enables trend/hype signals across sources.

## Transcription Pipeline

Steps to produce transcripts for media and store them alongside content.

```mermaid
flowchart LR
  YT[YouTube/Podcast URL] --> DL[yt-dlp audio]
  DL --> WH[Whisper/Faster-Whisper]
  WH --> TXT[VTT + Plain Text]
  TXT --> STO[(Storage transcripts)]
  STO --> DB[(contents.transcript_url, text)]
```

## Job State Machine

Lifecycle of a job with claim, retry, completion, and dead-letter.

```mermaid
stateDiagram-v2
  [*] --> queued
  queued --> claimed: advisory lock
  claimed --> processing
  processing --> completed
  processing --> retry: error
  retry --> claimed
  retry --> dead_letter: max attempts
```

## API Read Path

How the UI requests story lists and receives clusters with overlays.

```mermaid
sequenceDiagram
  participant UI
  participant API as Next.js /api/stories
  participant DB as Supabase
  UI->>API: GET /api/stories?q=...&cursor=...
  API->>DB: SELECT stories JOIN overlays (cluster reps)
  DB-->>API: rows
  API-->>UI: clusters + overlays lite
```

## Data Lineage

Traceability from raw items through contents to stories and derived artifacts.

```mermaid
graph LR
  Raw[raw_items] -->|raw_item_id| Cont[contents]
  Cont -->|content_id| Story[stories]
  Story --> Over[story_overlays]
  Story --> Emb[story_embeddings]
  Story --> Clus[clusters]
  Raw -. raw HTML/transcripts .-> Store[(Storage)]
```
