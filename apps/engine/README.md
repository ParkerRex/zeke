## Engine Setup


> **Note:** The legacy Express worker previously stored under `apps/engine` has been deleted. Historical references in this document remain for context while we finish cutting over tooling and docs.


- Treat Midday Engine more as architectural inspiration:
  a unified ingestion pipeline with a consistent schema,
  pluggable provider modules, auth token brokering, and
  downstream delivery hooks (e.g., webhooks, SDKs).
  - For your domain you’d need to assemble or build connectors
  that speak RSS/Atom, email parsers, web scrapers, specialized
  APIs (Semantic Scholar, arXiv, patent offices), and community
  integrations (Discord, Slack, GitHub). Wrapping those behind
  a custom “engine” could make sense if you plan to serve
  multiple internal tools—or even external customers—in the
  future.
  - Letting others hit such an engine only pays off if you
  (a) standardize the heterogeneous content into a schema
  that’s valuable to third parties, (b) manage rate limits/
  terms of service for each upstream provider, and (c) have a
  monetizable or strategic reason to expose it. Without those,
  the overhead of operating an external-facing API likely
  outweighs the benefit.

  Next Steps

  1. Decide whether you just need an internal ingestion layer
  or you’re aiming for a platform that external partners would
  consume.
  2. Map the highest-value sources first, then design a
  normalized schema (e.g., content_item, source, topic,
  signal_score) analogous to Midday’s unified bank records.
  3. Evaluate existing tooling for each source type (e.g.,
  open-source RSS aggregators, email parsers like Mailgun,
  podcast APIs, specialized scrapers) before committing to
  custom integrations.

  Bottom line: Midday Engine is a solid example of a unified
  connectivity layer, but it’s focused on banking. For Zeke’s
  news-centric use case, you’d need to craft your own “engine”
  tailored to content/knowledge sources rather than reuse
  Midday’s product.

sources:
1. RSS feeds
2. Newsletters
3. Podcasts
4. YouTube
5. Twitter (X)
6. Reddit
7. Hacker News
8. Substack
9. LinkedIn posts
10. Company blogs
11. Research lab blogs
12. arXiv preprint
13. Semantic Scholar
14. News APIs
15. Mainstream news sites (CNN, NYT, BBC, etc.)
16. Specialized tech media (TechCrunch, VentureBeat, The Verge, Wired)
17. Financial/market data terminals (Bloomberg, Reuters)
18. AI community forums (LessWrong, Alignment Forum)
19. GitHub trending repos
20. Discord communities
21. Slack groups
22. Product Hunt
23. Conference proceedings (NeurIPS, ICML, ICLR, CVPR)
24. Whitepapers
25. Medium posts
26. Patreon/Ko-fi creator updates
27. YouTube Shorts/TikTok clips
28. Google Scholar alerts
29. Patent databases
30. Government/standards org reports (NIST, EU AI Act updates)
31. Company press releases
32. Investor memos
33. Private research notes


# questions
were setting up the engine, where users could connect their accounts that they get ai news, and then we can run our summarization etc on top of it.

so instead of plaid, gocardlesss, teller, it would be connecting their youtube account, so that we can see whot heyre subscribed to already. does that make sense?

# Midday Architecture

  - apps/engine/src/index.ts:1-42 wraps Hono routes behind shared middleware, exposing transactions/accounts/etc while relying
  on Cloudflare configuration in apps/engine/wrangler.toml.
  - packages/jobs/trigger.config.ts:1-23 and packages/jobs/src/init.ts:1-47 define the Trigger.dev runtime plus per-run
  database lifecycle via createJobDb from packages/db/src/job-client.ts:1-32.
  - Tasks such as packages/jobs/src/tasks/bank/setup/initial.ts:1-48 show the pattern: schemaTask + typed payloads +
  schedules.create/fan-out triggers.
  - apps/api/src/trpc/init.ts:1-80 injects Supabase + Drizzle db into the context, while routers like apps/api/src/trpc/
  routers/bank-connections.ts:1-72 and apps/api/src/trpc/routers/transactions.ts:1-117 import job payload types and call
  tasks.trigger(...), keeping async work out of request handlers.
  - Replication-aware DB access is handled by middleware in apps/api/src/trpc/middleware/primary-read-after-write.ts:1-65,
  ensuring Trigger.dev mutations and reads stay consistent.

# Zeke Current State

  - apps/engine/src/core/engine-service.ts:1-205 owns Express boot, pg-boss initialization, and lifecycle; job orchestration
  lives in apps/engine/src/core/job-definitions.ts:1-200 with queue creation, cron scheduling, and worker handlers.
  - Ingestion stages (apps/engine/src/tasks/ingest-rss-source.ts:1-62, apps/engine/src/tasks/extract-article.ts, etc.) push
  follow-up work back into pg-boss queues; HTTP endpoints in apps/engine/src/http/routes.ts:1-194 expose manual triggers that
  call the orchestrator (apps/engine/src/core/job-orchestrator.ts:1-200).
  - Database access already mirrors Midday’s pattern (packages/db/src/client.ts:1-37, packages/db/src/job-client.ts:1-32),
  backed by the Drizzle ORM schema defined in packages/db/src/schema.ts.
  - API context (apps/api/src/context.ts:1-35 and apps/api/src/trpc/init.ts:1-68) parallels Midday but routers currently stay
  synchronous—no tasks.trigger usage.
  - The Supabase baseline (apps/api/supabase/migrations/20250906120000_baseline_all.sql:290-360) provisions the dedicated
  worker role and full pg-boss schema, keeping the queue tightly coupled to Postgres.
  - packages/jobs already contains Midday’s Trigger.dev scaffolding (packages/jobs/trigger.config.ts:1-23, packages/jobs/
  src/init.ts:1-47), yet its tasks (e.g. packages/jobs/src/tasks/bank/setup/initial.ts:1-48) still reflect Midday’s banking
  workflows and remain unreferenced elsewhere in Zeke.

# System Roles (Target State)

  - apps/api — Edge API (Hono/TRPC) that 1) authenticates requests, 2) reads/writes via Drizzle, and 3) becomes the single place
  we trigger background work through `@zeke/jobs` once Trigger.dev jobs are live.
  - apps/engine (legacy) — Express + pg-boss bridge that still runs RSS ingestion and LLM analysis. Exists only until migration
  sprints remove pg-boss workers, queues, and schema artifacts.
  - apps/engine — Cloudflare Worker surface for provider/webhook callbacks, Trigger.dev task webhooks, and lightweight admin
  verbs that don’t belong in the public API.
  - packages/jobs — Trigger.dev runtime, task definitions, and shared helpers. All new ingestion, enrichment, and analysis
  flows move here so they can be scheduled, sequenced, and observed by Trigger.dev instead of pg-boss scripts.
  - packages/db — Shared Drizzle clients, schema, and migrations. Houses both request-path connections and job-scoped clients;
  plays the same role Midday’s DB package plays but with Zeke’s Sources/Stories/Insights data model.
  - Supporting packages (`@zeke/cache`, `@zeke/notifications`, `@zeke/openai`, etc.) — Cross-cutting utilities consumed by API,
  jobs, and workers; these keep secrets/config isolated from app code.

# Trigger.dev Job Suite (Planned Tree)

```text
packages/jobs
├── scripts
│   ├── list-schedules.ts              # smoke-test Trigger.dev cron/schedules
│   ├── register-schedules.ts          # idempotently register recurring jobs
│   └── backfill-ingest.ts             # one-off helper while migrating pg-boss rows
├── src
│   ├── init.ts
│   ├── schema.ts                      # Trigger.dev schemas + payload validators
│   ├── tasks
│   │   ├── sources                    # Ingestion into sources/raw_items/source_connections
│   │   │   ├── pull
│   │   │   │   ├── rss.ts             # replaces pg-boss ingest:pull
│   │   │   │   └── manual.ts          # on-demand pulls kicked off from dashboard/API
│   │   │   ├── ingest
│   │   │   │   ├── from-feed.ts       # canonicalize feed items into raw_items
│   │   │   │   └── from-upload.ts     # modal uploads → source intake pipeline
│   │   │   ├── enrich
│   │   │   │   ├── fetch-content.ts   # replaces ingest:fetch-content
│   │   │   │   └── detect-metadata.ts # infer author/topics/authority
│   │   │   └── link
│   │   │       └── to-stories.ts      # create/update story shells per source
│   │   ├── insights                   # Highlight lifecycle + embeddings
│   │   │   ├── generate.ts            # replaces analyze:llm
│   │   │   ├── dedupe.ts              # match new highlights against existing ones
│   │   │   └── attach-to-story.ts     # wire highlight → story + citations
│   │   ├── stories                    # Narrative assembly + sequencing
│   │   │   ├── summarize.ts           # build story summaries for dashboard
│   │   │   └── update-status.ts       # publish/retire stories as insights land
│   │   ├── briefs                     # Brief generation and delivery
│   │   │   ├── schedule.ts            # create recurring Playbook runs
│   │   │   └── compile.ts             # render brief document + notify team
│   │   ├── playbooks                  # Orchestrated, multi-step automations
│   │   │   ├── run.ts                 # entry point for Trigger.dev sequence
│   │   │   └── steps
│   │   │       ├── gather-context.ts
│   │   │       ├── branch-content.ts
│   │   │       └── finalize.ts
│   │   ├── notifications              # Cross-cutting communication hooks
│   │   │   ├── digest.ts              # daily/weekly digests
│   │   │   └── realtime.ts            # websocket/email pushes for key events
│   │   └── maintenance                # system upkeep (heartbeats/backfills)
│   │       ├── heartbeat.ts           # replaces system:heartbeat
│   │       └── cleanup.ts             # prune Trigger.dev runs + stale rows
│   └── utils
│       ├── array
│       │   └── chunk.ts
│       ├── async
│       │   └── withRetry.ts
│       ├── http
│       │   └── fetchWithTimeout.ts
│       ├── openai
│       │   ├── cleanJsonResponse.ts
│       │   ├── constants.ts
│       │   ├── generateAnalysis.ts
│       │   ├── generateEmbedding.ts
│       │   ├── generateStubAnalysis.ts
│       │   ├── generateStubEmbedding.ts
│       │   ├── openaiClient.ts
│       │   └── types.ts
│       ├── rss
│       │   ├── buildDiscoveryArticle.ts
│       │   ├── normalizeRssItem.ts
│       │   └── parseRssFeed.ts
│       └── url
│           ├── canonicalizeUrl.ts
│           └── hashText.ts
└── trigger.config.ts
```

The directories mirror Midday’s organisation but map to Zeke primitives (Sources → Stories → Insights → Briefs/Playbooks). Each
job file is expected to export typed `task` definitions plus helper factories so API routes, dashboard actions, and
engine/provider webhooks can trigger them without touching pg-boss.

## Enginev2 Worker Surface & Deployment

- **Runtime routes**
  - `GET /healthz` — used by Cloudflare + CI smoke checks.
  - `POST /api/webhooks/trigger` — Trigger.dev event ingress; validates with `TRIGGER_WEBHOOK_SECRET` (or `TRIGGER_SECRET_KEY`).
  - `GET /api/providers/:provider/oauth/callback` — placeholder OAuth return handler for providers listed in `Providers`.
  - `POST /api/providers/:provider/webhooks` — provider event intake; requires `Authorization: Bearer <API_SECRET_KEY>` and logs payloads for now.
- **Secrets & bindings** (configure with `wrangler secret put` unless otherwise noted)
  - `TRIGGER_PROJECT_ID`, `TRIGGER_SECRET_KEY`, `TRIGGER_WEBHOOK_SECRET` — copied from Trigger.dev v4 dashboard.
  - `API_SECRET_KEY` — shared secret between dashboard/API and the worker for provider webhook auth.
  - `YOUTUBE_*` envs — future quota management; safe to stub in staging with defaults.
  - Storage bindings (`KV`, `STORAGE`, `AI`) must match the environment configuration in Cloudflare.
- **Deploy flow**
  1. Run `bun run --filter @zeke/engine build` to emit the worker bundle.
  2. Populate secrets: `wrangler secret put TRIGGER_PROJECT_ID`, etc.
  3. Provide KV/R2 binding IDs in `wrangler.toml` for each environment.
  4. Deploy with `wrangler deploy --env staging` (or `production`).
  5. Set the Trigger.dev endpoint to the live worker URL (`https://engine[-staging].zekehq.com/api/webhooks/trigger`).

### Frontend Gap (Dashboard)

- None of the dashboard UI is wired to the new Trigger.dev tasks yet; the current pages still assume pg-boss era endpoints and banking data.
- Action items to rework the shell around Zeke’s Sources → Stories → Insights flow:
  - `apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx`
    - Rip out the finance-first sidebar/header wiring and rebuild navigation for Source Library, Story Feed, Insights review, Briefs/Playbooks.
    - Drop the default invoice/billing/team prefetch calls; only hydrate the queries needed for ingestion + insight management.
  - `apps/dashboard/src/app/[locale]/(app)/(sidebar)/page.tsx`
    - Remove revenue, burn-rate, and invoice widgets; replace with Source health, recent stories, insight queues, and playbook launch actions that call the new jobs.
    - Ensure any new widgets trigger `@zeke/jobs` tasks (e.g. `ingestPull`, `dedupeInsights`) instead of legacy `/debug/*` routes.

Migration Sprints

1. - [x] **Inventory & Scope**
   - [x] Queue catalog — `createJobQueues` defines five queues (`system:heartbeat`, `ingest:pull`, `ingest:source`, `ingest:fetch-content`, `analyze:llm`) with batches pulled from `JOB_CONFIG` (`HEARTBEAT_BATCH=10`, `INGEST_PULL_BATCH=5`, `CONTENT_FETCH_BATCH=5`). No retention overrides today; all live in the default pg-boss schema (`apps/engine/src/core/job-definitions.ts:19-69`).
   - [x] Schedules & boot — `scheduleRecurringJobs` runs `system:heartbeat` and `ingest:pull` every five minutes in `JOB_CONFIG.CRON_TZ` (env `BOSS_CRON_TZ`, default UTC) and `triggerStartupJobs` enqueues a single `{source: "rss"}` message on boot (`apps/engine/src/core/job-definitions.ts:71-111`).
   - [x] Worker flows —
     - `system:heartbeat` logs each payload then completes (`apps/engine/src/core/job-definitions.ts:113-136`).
     - `ingest:pull` fans into `handleRssIngest`; non-RSS payloads are skipped with warn logs (`apps/engine/src/core/job-definitions.ts:138-165`).
     - `ingest:source` loads the source row and reuses `ingestRssSource`; youtube/podcast handling is gated/disabled and unsupported kinds fail the job (`apps/engine/src/core/job-definitions.ts:167-205`).
     - `ingest:fetch-content` imports `extract-article` and fails jobs on error (`apps/engine/src/core/job-definitions.ts:207-225`).
     - `analyze:llm` runs `analyzeStory` after validating the payload, failing if the story lookup or model work bombs (`apps/engine/src/core/job-definitions.ts:227-248`).
   - [x] Helper pipelines — `handleRssIngest` batches over `getRssSources()` and re-queues `ingest:fetch-content` via `ingestRssSource`; `ingestSourceById` branches on source type and reuses DB helpers (`apps/engine/src/core/job-definitions.ts:250-303`). One-off ingestion helpers that classify/process URLs live in the orchestrator (`apps/engine/src/core/job-orchestrator.ts:45-200`).
   - [x] Manual entry points — REST debug routes `/debug/ingest-now`, `/debug/ingest-source`, `/debug/ingest-oneoff` delegate to orchestrator helpers (`apps/engine/src/http/routes.ts:63-156`) which in turn call `boss.send` for the queues noted above (`apps/engine/src/core/job-orchestrator.ts:58-141`). Preview endpoints reuse the same task modules for dry-runs (`apps/engine/src/http/routes.ts:164-226`). No CLI scripts enqueue jobs anymore.
   - [x] Task module dependencies — Active jobs touch `apps/engine/src/tasks/ingest-rss-source.ts` (fetch RSS, upsert raw_items, enqueue fetch-content), `apps/engine/src/tasks/extract-article.ts` (HTTP fetch, JSDOM, Readability, `insertContents`/`insertStory`), and `apps/engine/src/tasks/analyze-story.ts` (OpenAI client, embeddings, `upsertStoryOverlay`/`upsertStoryEmbedding`). YouTube-oriented tasks remain but are currently disabled/log-only (manual ingestion yields "youtube_ingest_disabled").
   - [x] Database touchpoints — Workers rely on the DB proxy in `apps/engine/src/db.ts`, which wraps Drizzle queries targeting `public.sources`, `raw_items`, `contents`, `stories`, `story_overlays`, `story_embeddings`, plus platform snapshots (`platform_quota`, `source_health`). The legacy `job_metrics` table has been retired with pg-boss.
   - [x] Configuration & envs — Legacy `BOSS_*` variables have been removed; keep `DATABASE_URL`, Trigger.dev secrets, `JOBS_CRON_TZ` (optional, defaults to UTC), and runtime basics (`NODE_ENV`, `PORT`, `RAILWAY_ENVIRONMENT`). YouTube quota envs remain optional stubs while we wire providers (`apps/engine/src/lib/openai/constants.ts:1-6`).
  - [x] Monitoring touchpoints — Legacy polling was removed; the stub no longer writes `job_metrics`. Trigger.dev dashboards replace `/debug/status` counts, and the old routes now respond with `410 Gone`.

2. - [x] **Trigger.dev Foundations**
   - [x] Refresh `packages/jobs/trigger.config.ts` with Zeke task paths, add `TRIGGER_ENDPOINT`/`TRIGGER_API_KEY` env references, and ensure `packages/jobs/src/init.ts` spins up `createJobDb` from `packages/db/src/job-client.ts` for every run.
   - [x] Scaffold the planned directories under `packages/jobs/src/tasks/**` with typed `task` exports and remove Midday banking artifacts so imports from `@zeke/jobs` are Zeke-specific.
  - [x] Build the worker surface in `apps/engine/src/index.ts`: add Hono routes for Trigger.dev webhooks (`/api/webhooks/trigger`), provider callbacks, and a simple `/healthz`; wire bindings and secrets in `apps/engine/wrangler.toml`.
  - [x] Document deployment + environment steps (`apps/engine/README.md`, `wrangler.toml` comments) so Cloudflare + Trigger.dev can be provisioned before we flip any ingestion.

3. - [x] **Source Ingestion Migration**
   - [x] Port the scheduled RSS puller from `apps/engine/src/core/job-definitions.ts` into `packages/jobs/src/tasks/sources/pull/rss.ts` using Trigger.dev schedules (no pg-boss cron).
   - [x] Move `handleRssIngest`, `ingestRssSource`, and helpers from `apps/engine/src/core/job-definitions.ts` + `apps/engine/src/tasks/ingest-rss-source.ts` into `packages/jobs/src/tasks/sources/ingest/from-feed.ts`, swapping `boss.send` for `triggerBatch` or `task.trigger`.
   - [x] Create upload/intake jobs (`sources/ingest/from-upload.ts`, `sources/link/to-stories.ts`) that map to the Source Intake flow described in `docs/plans/in-progress/mapping-plan.md`; add any new Drizzle helpers we need under `packages/db/src/queries/sources.ts`.
  - [x] Update manual entry points (dashboard safe actions, API endpoints in `apps/api/src/trpc/routers/pipeline.ts`, legacy HTTP routes) to call the Trigger.dev tasks through `@zeke/jobs`.

4. - [x] **Content & Insight Processing**
   - [x] Translate `apps/engine/src/tasks/extract-article.ts` into `packages/jobs/src/tasks/sources/enrich/fetch-content.ts`, making sure Supabase storage + metadata writes now live in Trigger.dev tasks.
   - [x] Port `apps/engine/src/tasks/analyze-story.ts` into `packages/jobs/src/tasks/insights/generate.ts`, referencing `@zeke/openai` utilities and persisting highlights/stories via Drizzle models.
   - [x] Add dedupe + linking tasks (`insights/dedupe.ts`, `insights/attach-to-story.ts`) that replace transaction matching with highlight/story relationships per the mapping plan.
   - [x] Implement story maintenance tasks (`stories/summarize.ts`, `stories/update-status.ts`) to regenerate summaries when highlights change, replacing any Express/pg-boss fan-out.

5. - [x] **API & Experience Integration**
   - [x] Refactor TRPC routers and safe actions to call Trigger.dev tasks (e.g. `apps/api/src/trpc/routers/pipeline.ts`, `apps/dashboard/src/app/api/pipeline/trigger/route.ts`), removing pg-boss client imports.
   - [x] Confirm dashboard/desktop no longer poll pg-boss; rely on Trigger.dev’s built-in dashboard for run visibility and ensure monitoring UI references are removed.
   - [x] Wire product playbooks so launching automation invokes `packages/jobs/src/tasks/playbooks/run.ts` and records runs/events via new Drizzle tables (`packages/db/src/schema.ts`, `packages/db/src/queries/playbooks.ts`).
   - [x] Create migration scripts (`packages/jobs/scripts/backfill-ingest.ts`) to replay any outstanding pg-boss jobs into Trigger.dev before decommissioning the old queues.

6. - [ ] **Database & Queue Cleanup**
   - [x] Author Supabase migrations to drop the `pgboss` schema, cron tables, and worker role (see `apps/api/supabase/migrations/20241024120000_drop_pgboss_schema.sql`) now that Trigger.dev is handling load.
   - [x] Rip the remaining pg-boss bootstrapping out of `apps/engine`: delete `src/core/job-definitions.ts`, `src/core/job-orchestrator.ts`, and the `src/tasks/**` tree, and strip the PgBoss init from `src/core/engine-service.ts` so the Express app becomes a thin stub pending removal. (Local sandbox blocks named pipe creation, but the stub no longer reads `BOSS_*` env vars.)
   - [x] Strip `BOSS_*` env vars and docs: purged from `.env.example`, `apps/engine/README.md`, `apps/engine/railway.toml`, and the legacy shell helpers now emit Trigger.dev guidance. `rg "BOSS_"` only surfaces historical notes in documentation.
   - [x] Excise pg-boss support code: removed the `job_metrics` stubs from `packages/db/src/queries/{platform.ts,pipeline.ts}` and verified no legacy helpers remain in `packages/jobs/src/utils/**`; Trigger.dev retains sole responsibility for run history.
   - [x] Refresh ops docs/runbooks so they reference Trigger.dev dashboards + Cloudflare Worker logs instead of pg-boss: updated `docs/plans/done/{admin-spec.md,admin-tasks.md,db-schema-updates.md}` and `docs/plans/in-progress/mapping-plan.md` to note that run state lives entirely in Trigger.dev.

7. - [ ] **Cutover & cleanup**
   - [x] Delete the legacy Express worker (`apps/engine`): remove the workspace package (directory + `package.json`), drop the `dev:engine` script from the root `package.json`, clear the `@zeke/engine` dependency from `apps/api/package.json`, `apps/dashboard/package.json`, and `packages/engine-client`, then regenerate `bun.lock` / path aliases so nothing points at the deleted package.
   - [x] Purge supporting scripts and infra hooks: legacy scripts/railway manifest were removed alongside the package; remaining doc references are historical until runbooks are rewritten.
   - [ ] Archive or delete cron monitors, Grafana dashboards, and alerts that queried `pgboss.*`/`job_metrics`; document the replacement Trigger.dev alert webhooks in a new `docs/plans/in-progress/triggerdev-ops.md`.

8. - [ ] **Post-migration hardening**
      - [x] Ensure Trigger.dev observability covers ingest → insight → playbook flows: configure alerts in the Trigger.dev UI, capture thresholds in `docs/plans/in-progress/triggerdev-ops.md`, and emit status events from `packages/jobs/trigger.config.ts` where needed.
   - [x] Publish runbooks for ingestion replay, failed-run triage, and secret rotation under `docs/rules/triggerdev-runbooks.md`, referencing `packages/jobs/scripts/backfill-ingest.ts` and Worker secret management steps.
   - [ ] Update deployment workflows so staging/production ship the Worker + jobs bundle together: add CI steps (GitHub Actions/Railway) that run `bun run --filter @zeke/engine build` + `bun run --filter @zeke/jobs deploy`, document the process in `apps/engine/README.md`, and align `wrangler secret` syncs.
   - [ ] Sweep for lingering pg-boss artifacts after QA (env templates, Notion runbooks); ensure `rg "pgboss"` only matches historical docs.

9. - [ ] **Frontend Experience Refresh**
   - [ ] Rebuild `apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx` with the Midday prefetch plumbing (`HydrateClient` + TRPC batch) but Zeke navigation: Sources → Stories → Insights → Briefs, and mount new `StorySheet` / `AssistantSheet` components under `apps/dashboard/src/components/sheets`.
   - [ ] Replace `page.tsx` with the three-column workspace from `docs/plans/in-progress/mapping-plan.md`: left Source list, middle Story workspace, right Insights/Assistant panel wired to Trigger.dev mutations via `@zeke/jobs`.
   - [ ] Implement TRPC endpoints to back the UI: extend `apps/api/src/trpc/routers/{pipeline.ts,story.ts,highlight.ts,assistant.ts}` with list/detail mutations for sources, stories, insights, and assistant threads, each invoking the new Trigger.dev tasks.
   - [ ] Update Source Library, Story detail, and desktop surfaces to reuse the shared hooks (`apps/dashboard/src/features/{sources,stories,insights}`) and remove finance / pg-boss era vocabulary and calls.
   - [ ] Layer on UX polish: optimistic updates around `task.trigger` calls, Trigger.dev run toasts via a new `apps/dashboard/src/hooks/useTriggerRunToast.ts`, plus keyboard shortcuts and accessibility parity checks.
