# ∆ / ZEKE

**AI-Powered News Intelligence Platform**

ZEKE ingests news from multiple sources, analyzes it with LLMs, and delivers stories and insights through modern web applications.

### Hook Ideas
- check for updates in the codebase and re-write the `agents.md` and `readme.md`
-

### For DB Changes
- update the `schema.ts` in `packages/db/src`
- run `



### System Components
- `apps/api` — Hono/TRPC edge API that fronts Supabase access, enforces auth and permissions, and now delegates async work to Trigger.dev tasks in `@zeke/jobs`.
- `apps/dashboard`, `apps/desktop`, `apps/website` — user interfaces (Next.js dashboard, Electron app, marketing site) that consume the API to deliver analyzed stories and notifications.
- `apps/engine` — Cloudflare Worker surface for provider/webhook endpoints and Trigger.dev webhooks, replacing the retired Express/pg-boss worker.
- `packages/jobs` — Trigger.dev task suite handling ingestion (RSS pull, source fetch, article extraction, analysis, one-off jobs) with shared helpers under `src/lib` and DB access via `getDb()`.
- `packages/db` — Drizzle schema, query helpers, and replica-aware clients reused by both API and jobs; Supabase migrations live under `apps/api/supabase`.
- Supporting packages (`packages/cache`, `notifications`, `supabase`, etc.) — shared utilities for caching, email, storage, and third-party integrations.

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
