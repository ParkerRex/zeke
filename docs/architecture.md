# Architecture

System design and service boundaries for Zeke. This is a monorepo, not magic. Keep responsibilities clean.

## Overview

Zeke uses a service-ish architecture inside a Bun workspace monorepo. Shared packages handle cross-cutting concerns. Each app has a clear job. Do not blur them.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Dashboard│  │ Website  │  │ Desktop  │  │  Mobile  │        │
│  │ (Next.js)│  │ (Next.js)│  │ (Tauri)  │  │ (Future) │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                       API Layer                                  │
│  ┌─────────────────────────┴─────────────────────────┐          │
│  │                    API Server                      │          │
│  │              (Hono + TRPC + REST)                  │          │
│  │                   Port 3003                        │          │
│  └────────────┬───────────────┬───────────────┬──────┘          │
│               │               │               │                  │
│  ┌────────────┴──┐  ┌────────┴────────┐  ┌───┴──────────┐      │
│  │   pg-boss     │  │    Engine       │  │   Realtime   │      │
│  │ (Background)  │  │ (Content Fetch) │  │  (WebSocket) │      │
│  └───────────────┘  └─────────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │          │
│  │  (pgvector)  │  │   (Cache)    │  │  (Storage)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Boundaries (Blunt)

- **API** owns business logic and database writes. If a client needs data, it goes through the API.
- **Engine** only fetches and normalizes external content. It does not enforce business rules.
- **Jobs** run background work and orchestrate ingestion/AI pipelines. They are not HTTP services.
- **Dashboard/Website/Desktop** are clients. They do not own domain rules.

## Domain Ownership Map

| Domain Area | Source of Truth | Notes |
|-------------|------------------|-------|
| Users/Teams/Auth | API + Auth package | Session and access control live here |
| Stories/Highlights/Chats/Tags | API + Database | Core content domain |
| Playbooks/Automations | API + Jobs | Jobs execute, API owns rules |
| Content Ingestion | Engine | Normalizes external sources |
| Billing/Usage | API + Stripe | Billing UI lives in Dashboard |
| Marketing | Website | No auth or private data |
| Desktop Shell | Desktop | Wraps the Dashboard |

## Core Patterns

### 1. Workspace Pattern

All packages use `@zeke/*` namespace:
```typescript
import { db } from "@zeke/db/client";
import { auth } from "@zeke/auth/server";
import { sendJob } from "@zeke/jobs/client";
```

### 2. Database-First Design

- **Drizzle ORM** for type-safe queries
- **Snake_case** in database, **camelCase** in code
- **pgvector** for AI embeddings
- **RLS** for multi-tenancy

```typescript
// Schema uses snake_case, app uses camelCase
export const stories = pgTable("stories", {
  id: uuid().primaryKey(),
  teamId: uuid("team_id").references(() => teams.id), // snake_case in DB
  createdAt: timestamp("created_at"),
});
```

### 3. TRPC + REST Hybrid

- **TRPC**: Type-safe internal RPC
- **REST**: Public APIs, webhooks, OpenAPI docs

```typescript
// TRPC for dashboard
const story = await trpc.stories.getById.query({ id });

// REST for external
const res = await fetch("/api/stories/123");
```

### 4. Job Queue Architecture

Background jobs are PostgreSQL-backed via pg-boss:

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│  Engine  │────▶│   Jobs   │────▶│ AI/OpenAI │────▶│ Database │
│ (Fetch)  │     │(pg-boss) │     │(Transform)│     │  (Store) │
└──────────┘     └──────────┘     └───────────┘     └──────────┘
```

### 5. Multi-Tenancy

Team-based isolation with RLS:
```sql
-- All queries scoped to team
WHERE team_id = current_team_id()
```

### 6. Content Provider Pattern

Engine uses pluggable providers:
```typescript
const providers = {
  youtube: YouTubeProvider,
  rss: RSSProvider,
  arxiv: ArxivProvider,
  podcast: PodcastProvider,
  semanticScholar: SemanticScholarProvider,
};
```

## Data Flow

### Content Ingestion
```
1. Scheduled Job (pg-boss cron)
   └── ingest-pull (every 5 min)

2. Engine Fetch
   └── POST /ingest { url }
       └── Provider normalizes content

3. AI Processing
   └── analyzeStory, extractHighlights
       └── OpenAI API calls

4. Storage
   └── Database (metadata)
   └── MinIO (files)
```

### User Request
```
1. Dashboard (React)
   └── TRPC Query

2. API (Hono)
   └── Auth middleware
   └── Rate limiting
   └── TRPC router

3. Database
   └── Drizzle query
   └── Redis cache check

4. Response
   └── Type-safe response
```

## Key Tables

```
users
├── teams (owner)
│   └── users_on_team (members)
├── stories
│   ├── highlights
│   └── story_clusters
├── chats
├── api_keys
└── notification_settings

contents
├── sources
└── transcripts

playbooks
└── playbook_runs
```

## External Services

| Service | Purpose |
|---------|---------|
| OpenAI | AI features |
| Stripe | Payments |
| Resend | Email |
| Better Auth | OAuth |
| YouTube API | Video metadata |
| Semantic Scholar | Papers |

## See Also

- [Apps Documentation](./apps/)
- [Packages Documentation](./packages/)
- [Development Guide](./development.md)
