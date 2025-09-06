# Admin Console & Source Management Spec

Status: Planning • Scope: Admin-only web UI + server guards + source CRUD + ingest controls + cost forecasts

## Goals
- Let admins add/update/pause/remove sources (web/RSS, podcasts, YouTube channels, YouTube searches; extensible to Reddit, arXiv).
- Provide one place to control and forecast ingestion: live pipeline status, job triggers, and cost estimates.
- Keep it safe: gated by admin rights, server-side checks, and clear audit logs.

## Access Control (Admin Rights)
- Flag: `users.is_admin boolean default false not null` (RLS remains “user can read/update own row”).
  - Local enable: in Supabase SQL, `update public.users set is_admin = true where id = '<your-auth-user-id>';` (one-time).
- Server guard: `requireAdmin()` check on server-only surfaces.
  - Implement `src/supabase/queries/account/get-admin-flag.ts` that returns `{ userId, isAdmin }` using `createSupabaseServerClient()`.
  - Reusable guard for server routes and pages: if not admin, return 404/redirect to `/`.
- UI gating: Admin-only navigation items render only if `isAdmin`.

## Data Model
Existing tables used (no breaking changes):
- `public.sources` (already present): `id, kind, name, url, domain, authority_score, last_cursor, last_checked, metadata jsonb`.
- `public.raw_items`, `public.contents`, `public.stories` (unchanged).

Additions (migrations later):
- `users.is_admin boolean default false not null`.
- Optional, lightweight: `public.source_events` for audits (append-only): `{ id uuid pk, source_id uuid, actor uuid, event text, data jsonb, created_at timestamptz default now() }`.

Kinds we will support initially (all lowercase):
- `rss` (websites via RSS or auto-discovered)
- `podcast` (RSS feed)
- `youtube_channel`
- `youtube_search`

`metadata` conventions per kind:
- `rss`: `{ feedUrl?: string, discovered?: boolean }`
- `podcast`: `{ feedUrl: string, itunesId?: string }`
- `youtube_channel`: `{ channelId?: string, uploadsPlaylistId?: string, handle?: string }`
- `youtube_search`: `{ query: string, filters?: { duration?: 'short'|'long', afterDays?: number }, maxResults?: number }`

## Admin Console (Web UI)
Route: `/admin` (repurpose existing testing page and cost playground into tabs)

Layout: Tabs — Overview • Sources • Forecast • Jobs
- Overview
  - Reuse `src/app/testing/page.tsx` content (rename/move) for live counts and triggers.
  - Actions: `Trigger RSS Ingest`, `Trigger YouTube Ingest` (kept as-is, via `/api/pipeline/trigger`).
- Sources
  - Add Source form:
    - Paste bar: accept any URL/text → auto-detect kind (YouTube video/channel/handle → channel; RSS → rss; podcast feed; generic site → RSS discovery attempt).
    - Advanced: provider dropdown to force kind; backfill window (7/30/90) with 30 default; schedule cadence (use defaults from worker).
  - Sources table:
    - Columns: Name, Kind, Domain, Status (OK/Syncing/Error), Last Sync, Backfill progress, Actions.
    - Row actions: Pause/Resume, Backfill N days, Retry, Edit, Remove.
- Forecast
  - Bring in `src/app/temp/page.tsx` “Worker Cost Playground”.
  - Add per-source estimate rows (editable): expected items/day per source; roll up to totals.
  - Show YouTube API quota hints using worker’s quota estimates (if available).
- Jobs
  - Reuse “Job Queue” summary from testing page.
  - Add linkouts: “View recent raw items/contents/stories” (already present lists on the testing page).

Navigation
- Admin-only left nav or header dropdown item: “Admin Console”.
- Badge indicating worker status (Connected/Offline) in the page header.

## Flows
Add Source (Admin)
1) Paste URL or select provider.
2) System parses → proposes normalized “kind + metadata”.
3) Admin confirms → `actions/sources/upsert-source.ts` writes `public.sources`.
4) Fire seed/backfill:
   - Enqueue `ingest:pull` (RSS/YouTube). For backfill, write a `last_cursor` hint (e.g., publishedAfter) and let the ingest respect window.
5) UI shows a toast “Seeding …” and progress in table row.

Pause/Resume Source
- Toggle `metadata.active: false|true` or add `paused_at` convention. Initial implementation: keep paused list in UI and skip in ingest queries (see Worker section).

Backfill More
- Admin picks 7/30/90 days → enqueue a one-off job or set a transient `metadata.backfillAfter` and honor in fetchers; show progress counts.

## Server & API
Pages
- `src/app/(admin)/admin/page.tsx` — tabs container.
  - Extract and reuse components from `src/app/testing/page.tsx` and `src/app/temp/page.tsx`.

APIs (admin-only; return 403 if not admin)
- `GET /api/admin/sources`: list with health summary.
- `POST /api/admin/sources`: create/update (id optional).
- `POST /api/admin/sources/:id/pause` | `resume` | `backfill` | `delete`.
- `POST /api/admin/ingest/trigger`: body `{ kind: 'rss'|'youtube' }` (thin proxy to existing pipeline trigger).

Actions/Queries (typed; no barrels)
- `src/actions/sources/upsert-source.ts` (validates input, admin-check, writes via mutation, enqueues seed/backfill)
- `src/supabase/mutations/sources/upsert-source.ts`
- `src/supabase/mutations/sources/delete-source.ts`
- `src/supabase/mutations/sources/update-source-status.ts` (pause/resume/backfill cursor)
- `src/supabase/queries/sources/list-sources.ts`
- `src/supabase/queries/sources/get-source-by-id.ts`

## Worker Integration
Current queues (pg-boss) used:
- `ingest:pull` with `{ source: 'rss'|'youtube' }` — keep using.
- `ingest:fetch-content`, `ingest:fetch-youtube-content`, `analyze:llm` — unchanged.

Respect admin controls:
- Skip paused sources: update RSS/YouTube ingest queries to filter out sources with `metadata.active = false` (or by presence of `paused_at`).
- Backfill window: read `sources.last_cursor` or a transient `metadata.backfillAfter` and honor in fetchers.
- Record `sources.last_checked` and store lightweight per-run stats for the UI (already partially in place via `/debug/status`).

## Cost Estimation
- Global playground: embed existing `temp/page.tsx` (minor copy to a client component).
- Per-source estimates (UI only at first): simple inputs per row (expected items/day, avg minutes for YouTube), roll up totals.
- YouTube API quota: use helper from `worker/src/fetch/youtube.ts` to estimate quota use (search: `estimatedCost` in codebase).

## Security & Auditing
- Server-only checks for all admin routes and actions using `get-admin-flag`.
- Never expose service role key to client; use server actions/routes only.
- Optional: append to `source_events` on create/update/pause/delete with actor id and payload.

## Implementation Plan
Phase 1 — Admin guard + page shell (0.5d)
- Add `users.is_admin` (migration).
- Add `get-admin-flag` and simple guard.
- Create `/admin` with Overview + Jobs tabs reusing `testing/page.tsx` pieces.

Phase 2 — Sources CRUD (0.5–1d)
- Build Paste/Add form and Sources table UI.
- Implement actions/mutations/queries for sources.
- Hook to worker by enqueuing `ingest:pull` on create/update.

Phase 3 — Forecast tab (0.5d)
- Embed playground and add per-source estimate rows and totals.

Phase 4 — Polish & ops (0.5d)
- Pause/Resume handling in worker ingest queries.
- Backfill window handling via `last_cursor`/metadata.
- Basic audit log (optional).

## Open Questions
- Do we want role via `auth.users.app_metadata.role = 'admin'` instead of `users.is_admin`? (Current plan favors `users.is_admin` for simplicity.)
- Should Sources have an explicit `active boolean` column vs `metadata.active`? (If we need SQL-only filters and indexes, add a column.)
- Any additional provider types we should seed now (Reddit, arXiv)?

## References (existing code to reuse)
- Testing/diagnostics: `src/app/testing/page.tsx`
- Cost playground: `src/app/temp/page.tsx`
- Pipeline APIs: `src/app/api/pipeline/*`
- Supabase admin client: `src/libs/supabase/supabase-admin.ts`
- Worker ingest + queues: `worker/src/worker.ts`, `worker/src/ingest/rss.ts`, `worker/src/ingest/youtube.ts`, `worker/src/fetch/youtube.ts`

