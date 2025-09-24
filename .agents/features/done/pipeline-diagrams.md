# ZEKE Data Pipeline Diagrams

This document contains Mermaid diagrams to visualize the data pipeline, storage, and serving architecture.

**Status (2025-09-05)**: Pipeline is working! 47 raw items → 16 contents → 15 stories processed. LLM analysis jobs complete but produce 0 overlays/embeddings - needs debug.

## Current Implementation (Working)

### System Context (Current)

Shows the main components currently deployed and working.

```mermaid
graph LR
  U[Browser App] --> R[Next.js Routes - TODO]
  R --> DB[(Supabase Postgres + pgvector)]
  R --> ST[(Supabase Storage - TODO)]
  DB -. pg-boss (cron/enqueue) .-> E[Cloud Run Engine ✅]
  E -. RSS feeds .-> RSS[RSS: HN + Ars Technica ✅]
  E --> DB
  E -.-> LLM[LLM API - BROKEN]
  E -.-> EMB[Embeddings API - BROKEN]

  style E fill:#90EE90
  style RSS fill:#90EE90
  style DB fill:#90EE90
  style LLM fill:#FFB6C1
  style EMB fill:#FFB6C1
  style R fill:#FFE4B5
  style ST fill:#FFE4B5
```

### Deployment Topology (Current)

Shows where processes currently run and their status.

```mermaid
graph TB
  subgraph Browser
    UI[User - TODO]
  end
  subgraph Vercel/Next.js
    Web[Route Handlers - TODO]
  end
  subgraph GCP Cloud Run
    Engine[Engine Service ✅]
  end
  subgraph Supabase
    PG[(Postgres + pgvector ✅)]
    STO[(Storage - TODO)]
    BOSS[(pg-boss schema ✅)]
  end
  UI-->Web
  Web-->PG
  Web-->STO
  BOSS-. schedules/enqueues .->Engine
  Engine-->PG
  Engine-->STO

  style Engine fill:#90EE90
  style PG fill:#90EE90
  style BOSS fill:#90EE90
  style Web fill:#FFE4B5
  style STO fill:#FFE4B5
  style UI fill:#FFE4B5
```

### Current Data Flow (Working)

Shows the actual data flow that's currently processing items.

```mermaid
graph LR
  RSS[RSS Feeds] --> P[ingest:pull ✅]
  P --> R[raw_items: 47 ✅]
  R --> F[ingest:fetch-content ✅]
  F --> C[contents: 16 ✅]
  C --> S[stories: 15 ✅]
  S --> A[analyze:llm ❌]
  A --> O[story_overlays: 0 ❌]
  A --> E[story_embeddings: 0 ❌]

  style P fill:#90EE90
  style R fill:#90EE90
  style F fill:#90EE90
  style C fill:#90EE90
  style S fill:#90EE90
  style A fill:#FFB6C1
  style O fill:#FFB6C1
  style E fill:#FFB6C1
```

### ERD (Current Tables)

Shows the actual database schema that's deployed and working.

```mermaid
erDiagram
  sources ||--o{ raw_items : has
  raw_items ||--|| contents : yields
  contents ||--|| stories : feeds
  clusters ||--o{ stories : groups
  stories ||--o{ story_overlays : has
  stories ||--o{ story_embeddings : has
  stories ||--o{ highlights : has

  sources {
    uuid id PK
    text name
    text kind
    text url
    jsonb last_cursor
    timestamp last_checked
  }

  raw_items {
    uuid id PK
    uuid source_id FK
    text external_id
    text url
    text title
    timestamp discovered_at
  }

  contents {
    uuid id PK
    uuid raw_item_id FK
    text text
    text content_hash
    timestamp extracted_at
  }

  stories {
    uuid id PK
    uuid content_id FK
    text title
    text canonical_url
    timestamp created_at
  }
```

### Job State Machine (Current)

Shows the actual job lifecycle in pg-boss that's working.

```mermaid
stateDiagram-v2
  [*] --> created: pg-boss.schedule/send
  created --> active: engine claims
  active --> completed: success ✅
  active --> failed: error (2 in DLQ)
  failed --> retry: backoff
  retry --> active: reclaim
  failed --> [*]: max attempts
  completed --> [*]: done
```

## Future Implementation (Roadmap)

### System Context (Full Vision)

Shows the complete system once all features are implemented.

```mermaid
graph LR
  U[Browser App] --> R[Next.js Routes]
  R --> DB[(Supabase Postgres + pgvector)]
  R --> ST[(Supabase Storage)]
  DB -. pg-boss (cron/enqueue) .-> E[Cloud Run Engine (Node/TS)]
  R -. source fetch .-> Ext[External Sources: RSS, HN, Reddit, YouTube, arXiv]
  U -. Reader/Annotator .- R
  E --> DB
  E --> ST
  E -.-> LLM[LLM API]
  E -.-> EMB[Embeddings API]
  E -.-> YTDLP[yt-dlp/Whisper]
  E -. pdf OCR .-> OCR[[PDF Extraction Service (optional)]]
```

### Trust Boundaries & RLS (Future)

Highlights public vs private components and where RLS/service-role apply.

```mermaid
graph LR
  subgraph Authenticated RLS (no anon)
    Web[Next.js Routes]
  end
  subgraph Private Service Role
    Engine[Cloud Run Engine]
  end
  Web-->PG[(Postgres + RLS)]
  Engine-->PG
  Engine-->STO[(Storage)]
```

### Pipeline DAG (Full End-to-End Vision)

Maps the complete pipeline from ingest pull to overlays and embeddings.

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

### Ingestion Sequence (Future)

Walks through a single ingest run from cron to queued content fetch.

```mermaid
sequenceDiagram
  participant Boss as pg-boss (cron)
  participant Engine as Engine Service
  participant API as Source API
  participant DB as Supabase
  Boss-->>Engine: enqueue ingest:pull(source,cursor)
  Engine->>API: fetch new items
  API-->>Engine: items
  Engine->>DB: upsert raw_items
  Engine-->>Boss: enqueue fetch-content
```

### Content Fetch & Normalization (Future)

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

### Analysis & Overlays (Future)

Shows context building, LLM outputs (summaries/scores/citations), and persistence.

```mermaid
graph TD
  S[Story] --> C[Build Context + Retrieval]
  C --> L[LLM: Summaries + Scores + Citations]
  S --> EM[Embedding]
  L --> O[Upsert story_overlays]
  EM --> V[Upsert story_embeddings]
```

### Clustering Decision Flow (Future)

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

### Transcription Pipeline (Future)

Steps to produce transcripts for media and store them alongside content.

```mermaid
flowchart LR
  YT[YouTube/Podcast URL] --> DL[yt-dlp audio]
  DL --> WH[Whisper/Faster-Whisper]
  WH --> TXT[VTT + Plain Text]
  TXT --> STO[(Storage transcripts)]
  STO --> DB[(contents.transcript_url, text)]
```

### Reader & Annotation Flow (Future)

End-to-end flow for reading and highlighting across mediums (articles, PDFs, transcripts).

```mermaid
sequenceDiagram
  participant UI as Reader/Annotator UI
  participant API as Next.js /api/stories
  participant DB as Supabase
  UI->>API: GET /api/stories/:id
  API->>DB: SELECT story, contents, overlays
  DB-->>API: rows (text + metadata)
  API-->>UI: story + contents.text (+ transcript/pdf text)
  UI->>API: POST /api/highlights {story_id, content_id, span}
  API->>DB: INSERT highlights (offsets anchored to content_hash)
  DB-->>API: id
  API-->>UI: {id}
```

### API Read Path (Future)

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

### Data Lineage (Future)

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
