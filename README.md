# ∆ / ZEKE

**AI-Powered News Intelligence Platform**
ZEKE ingests news from multiple sources, analyzes it with LLMs, and delivers stories and insights through modern web applications.


### For DB Changes
Drizzle Flow
  - packages/db/src/schema.ts is the canonical schema file; define new tables/columns
  there before touching anything else.
  - The Drizzle CLI reads packages/db/drizzle.config.ts:1, so export your Supabase
  session pooler URL as DATABASE_SESSION_POOLER (and, when running the API, the
  region-specific URLs such as DATABASE_PRIMARY_URL, etc.).
  - From the repo root run cd packages/db && bunx --bun drizzle-kit generate --name
  add_my_table to emit a SQL migration into the migrations/ folder that lives
  alongside the config; commit the generated SQL plus the updated schema.
  - To get the changes into a local database, point DATABASE_SESSION_POOLER (or
  DATABASE_PRIMARY_URL) at your local Postgres/Supabase instance and run bunx --bun
  drizzle-kit push:pg; the command applies whatever is new in migrations/.
  - For the hosted Supabase project, repeat the push with the production pooler
  string (you’ll find it in Supabase → Project Settings → Database); use a service-
  role key and make sure you’re targeting the right environment before running the
  command.
  - After pushing, restart whatever services depend on the schema (API, jobs, etc.)
  so they pick up the new structure.

  Supabase Types

  - The generated client types live in packages/supabase/src/types/db.ts, and the
  package exposes them via packages/supabase/src/types/index.ts.
  - Install and log in with the Supabase CLI (supabase login), set PROJECT_ID (and
  SUPABASE_ACCESS_TOKEN if you’re using service tokens), then run cd packages/
  supabase && bun run db:generate; this pipes supabase gen types --lang=typescript
  into src/types/db.ts.
  - Commit the regenerated types together with the migration so downstream apps
  (@midday/supabase) stay in sync.
  - If you need to verify everything end-to-end, rerun the relevant service (bunx
  turbo dev --filter=@midday/api, etc.) and/or whatever tests exercise the new tables
  before opening a PR.




### Trigger.dev Job Structure (Zeke)

```
packages/jobs
├── package.json
├── scripts
│   └── ensure-ingest-schedule.ts
├── src
│   ├── init.ts
│   ├── schema.ts
│   ├── lib
│   │   ├── array
│   │   │   └── chunk.ts
│   │   ├── async
│   │   │   └── withRetry.ts
│   │   ├── http
│   │   │   └── fetchWithTimeout.ts
│   │   ├── openai
│   │   │   ├── cleanJsonResponse.ts
│   │   │   ├── constants.ts
│   │   │   ├── generateAnalysis.ts
│   │   │   ├── generateEmbedding.ts
│   │   │   ├── generateStubAnalysis.ts
│   │   │   ├── generateStubEmbedding.ts
│   │   │   ├── openaiClient.ts
│   │   │   └── types.ts
│   │   ├── rss
│   │   │   ├── buildDiscoveryArticle.ts
│   │   │   ├── normalizeRssItem.ts
│   │   │   └── parseRssFeed.ts
│   │   └── url
│   │       ├── canonicalizeUrl.ts
│   │       └── hashText.ts
│   ├── tasks
│   │   ├── analyzeStory.ts
│   │   ├── fetchContent.ts
│   │   ├── ingestPull.ts
│   │   ├── ingestSource.ts
│   │   ├── oneOffIngest.ts
│   │   └── index.ts
│   └── utils
│       ├── base-currency.ts
│       ├── blob.ts
│       ├── check-team-plan.ts
│       ├── embeddings.ts
│       ├── enrichment-helpers.ts
│       ├── enrichment-schema.ts
│       ├── generate-cron-tag.ts
│       ├── inbox-matching-notifications.ts
│       ├── parse-error.ts
│       ├── process-batch.ts
│       ├── resend.ts
│       ├── smart-matching.ts
│       ├── text-preparation.ts
│       ├── transaction-notifications.tsx
│       ├── transform.test.ts
│       ├── transform.ts
│       ├── trigger-batch.ts
│       ├── trigger-sequence.ts
│       └── update-invocie.ts
└── trigger.config.ts
```
