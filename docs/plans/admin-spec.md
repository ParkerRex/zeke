# Admin Console: Sources + Pipeline + Forecast (Admin-only)

Status: Ready for implementation

## MVP Scope
- Admins can add/update/pause/remove sources: RSS (websites), podcasts (RSS), YouTube channels, YouTube searches.
- Admins can preview “about to ingest” items and see estimated costs before kicking jobs.
- One admin page combines live pipeline status, ingest controls, jobs view, and cost forecasts.

## Access Control
- DB: add `users.is_admin boolean not null default false`.
- Server guard: use existing `getSession()` + `get-admin-flag` (built on `createSupabaseServerClient()`).
  - Not signed in: redirect to `/login` for protected routes.
  - Signed in but not admin: redirect to `/home` for `/admin` and admin APIs.
- UI: render Admin nav only when `isAdmin` (value provided by server component; no client-only checks).

### Auth Consistency (avoid new patterns)
- Route groups:
  - `(marketing)` and `(auth)`: public.
  - `(account)`: requires session → redirect(`/login`) if missing.
  - `(app)`: general app surfaces; follow existing behavior (no auth hard block).
  - `(admin)`: requires session + admin.
- Redirects policy:
  - Marketing root: if session, redirect(`/home`).
  - Checkout flows already redirect to `/signup` when unauthenticated; keep that specific behavior.
  - Admin: unauthenticated → `/login`; authenticated non-admin → `/home`.
- Clients: only use `createSupabaseServerClient()` and `supabaseAdminClient`; do not add new client types or middleware-based auth for admin.
- Pages to deprecate/move under admin: `/testing` and `/temp` (keep content but surface inside `/admin`).

## Database Changes
- Table: `public.users`
  - Add column: `is_admin boolean not null default false`.
- Table: `public.sources` (existing)
  - Add columns: `active boolean not null default true`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
  - Enable RLS (no anon policies). Admin/API use service-role; worker uses privileged DB connection.
- No other changes required.

Kinds (initial): `rss`, `podcast`, `youtube_channel`, `youtube_search`.

`metadata` per kind (minimum):
- rss: `{ feedUrl?: string }`
- podcast: `{ feedUrl: string }`
- youtube_channel: `{ channelId?: string, uploadsPlaylistId?: string, handle?: string, max_results?: number }`
- youtube_search: `{ query: string, max_results?: number, duration?: 'short'|'long', published_after?: ISO8601 }`

## Admin Page (/admin)
Tabs: Overview • Sources • Forecast • Jobs (persist active tab via `nuqs`)

- Overview
  - Live counts (raw_items, contents, stories), worker status/port, last updated.
  - Actions: Trigger RSS ingest; Trigger YouTube ingest.
  - Reuse components from `src/app/testing/page.tsx`.

- Sources
  - Add Source: paste bar (auto-detect), provider dropdown, backfill window (7/30/90; default 30).
  - List: Name, Kind, Domain, Status, Last Sync, Actions (Edit, Pause/Resume, Backfill 7/30/90, Delete).
  - Preview (dry-run): show up to N items and quota estimate, then “Seed now”.

- Forecast
  - Embed cost playground from `src/app/temp/page.tsx`.
  - Add per-source daily volume inputs; roll up estimates.
  - Costs included: YouTube API quota (search/details), LLM analysis ($/1k tokens), embeddings ($/1k tokens), optional transcription ($/min). All values editable.

- Jobs
  - Job queue summary (top name:state counts).
  - Recent Raw Items / Contents / Stories lists.

## APIs (admin-only)
- `GET /api/admin/sources` — list sources + lightweight health (last_checked, active).
- `POST /api/admin/sources` — create/update (id optional). Body includes kind, name, url, domain, metadata, active.
- `POST /api/admin/sources/:id/pause` | `resume` | `backfill` (7/30/90) | `delete`.
- `GET /api/admin/sources/:id/preview?limit=10` — dry-run next items + quota estimate (no DB writes).
- `POST /api/admin/ingest/trigger` — `{ kind: 'rss'|'youtube' }` (proxy to worker). Deprecate or guard existing `/api/pipeline/trigger` to require admin.
 - Guard or replace: `/api/pipeline/status` and `/api/pipeline/recent` should be admin-only or moved under `/api/admin/pipeline/*` and the UI updated accordingly.

## Actions/Queries
- `src/supabase/queries/account/get-admin-flag.ts` — returns `{ userId, isAdmin }`.
- `src/supabase/queries/sources/list-sources.ts`, `get-source-by-id.ts`.
- `src/supabase/mutations/sources/upsert-source.ts`, `delete-source.ts`, `update-source-status.ts` (pause/resume/backfill).
- `src/actions/sources/upsert-source.ts` — validates input, admin-check, writes via mutation, triggers seed/backfill.

## Worker Integration
- Respect pause: filter out `active = false` in `getRssSources` and `getYouTubeSources` queries.
- Backfill window: read `sources.last_cursor` or `metadata.published_after` and pass to fetchers.
- Dry-run preview: add worker helpers that call fetchers with small limits and skip `upsertRawItem`/enqueue (return items + estimated quota used).
- No change to existing queues (`ingest:pull`, `ingest:fetch-content`, `ingest:fetch-youtube-content`, `analyze:llm`).
- Respect existing YouTube fields: `metadata.published_after` for searches; prefer `last_cursor` for generic cursors to avoid duplicating fields.

## Rollout Plan
1) Migrations: `users.is_admin`, `sources.active/created_at/updated_at`, enable RLS on `sources`.
2) Guard: add `get-admin-flag`; protect `/admin` and admin APIs.
3) UI: build `/admin` tabs; reuse Testing and Cost Playground components.
4) Sources CRUD: form + table, actions, and seed/backfill hooks.
5) Preview: admin API + worker dry-run helpers.
6) Polish: per-source estimates in Forecast; ensure worker filters `active=false`; deprecate `/testing` and `/temp` public routes.

## Notes
- Deletion: default to soft-delete (`active=false`). If hard delete needed, block when dependent content/stories exist.
- Provider cadence: use existing global schedules; per-source cron can be added later if needed.

## Delivery Checklist
- See `docs/plans/admin-tasks.md` for the concrete task list and acceptance criteria.

## References (existing code to reuse)
- Testing/diagnostics: `src/app/testing/page.tsx`
- Cost playground: `src/app/temp/page.tsx`
- Pipeline APIs: `src/app/api/pipeline/*`
- Supabase admin client: `src/libs/supabase/supabase-admin.ts`
- Worker ingest + queues: `worker/src/worker.ts`, `worker/src/ingest/rss.ts`, `worker/src/ingest/youtube.ts`, `worker/src/fetch/youtube.ts`
