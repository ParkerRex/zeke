# Admin Console — Implementation Tasks

Status: In progress • Owner: Web + Engine • Est: ~2–3 days

Next Actions (high priority)

- [ ] Add health badge/tooltip in Sources table using `source_health` (OK/Warn/Error + last message).
- [ ] Add YouTube quota threshold coloring (warn when remaining < configurable %).
- [ ] Remove Overview polling once job_metrics + platform_quota prove stable; optional Realtime for recent lists later.
- [ ] Add inline “Edit Source” dialog (metadata tweaks for youtube_search.query, uploads_playlist_id, etc.).

This checklist implements the admin-only console per admin-spec.md. No code duplication; reuse existing components/APIs where possible.

## Phase 1 — DB Migrations (Supabase)

- [ ] Users: add `is_admin boolean not null default false` to `public.users`.
- [ ] Sources: add `active boolean not null default true`.
- [ ] Sources: add `created_at timestamptz default now() not null`, `updated_at timestamptz default now() not null`.
- [ ] Sources: enable RLS; do not add anon policies (service role will bypass).
- [ ] Optional: create `source_events (id uuid pk, source_id uuid, actor uuid, event text, data jsonb, created_at timestamptz)` for auditing.
- [ ] Seed local admin: `update public.users set is_admin = true where id = '<local-auth-user-id>';`

Acceptance:

- [ ] `select is_admin from public.users limit 1` returns a boolean column.
- [ ] `select active, created_at, updated_at from public.sources limit 1` works.

Progress:

- [x] Baseline migration includes all of the above (plus admin-supporting indexes; optional audit table not included).

## Phase 2 — Server Guards

- [ ] Query: `@db/queries/account/get-admin-flag.ts` returning `{ userId, isAdmin }` using `createSupabaseServerClient()`.
- [ ] Guard helper (server-only): throws or returns redirect when not admin.
- [ ] Apply guard to `/admin` page and all admin API routes.
- [ ] Auth consistency: unauthenticated → `/login`; authed non-admin → `/home`.

Acceptance:

- [ ] Visiting `/admin` as non-auth → redirected to `/login`.
- [ ] Visiting `/admin` as authed non-admin → `/home`.
- [ ] Admin sees `/admin`.

Progress:

- [x] Implemented (`/admin` page guard; pipeline APIs gated; admin APIs gated).

## Phase 3 — Admin Page Shell (/admin)

- [ ] Route: `src/app/(admin)/admin/page.tsx` with tabs: Overview • Sources • Forecast • Jobs.
- [ ] Persist active tab with `nuqs`.
- [ ] Reuse Overview + Jobs content from `src/app/testing/page.tsx` (extract into small components where needed).
- [ ] Move `src/app/temp/page.tsx` content into Forecast tab (client component).
- [ ] Add Admin entry in nav shown only when `isAdmin`.
  - Import queries via `@db/*` alias.

Acceptance:

- [ ] Overview shows counts, engine status, triggers.
- [ ] Jobs shows job summary and recent lists.
- [ ] Forecast renders playground with editable inputs.

Progress:

- [x] Route created: `src/app/(admin)/admin/page.tsx`.
- [x] Sources + Overview tabs implemented in `AdminConsole`.
- [x] Forecast tab inline.
- [x] Admin entry in nav (guarded) added.

## Phase 4 — Admin APIs

- [ ] `GET /api/admin/sources`: list sources with minimal fields and health (last_checked, active).
- [ ] `POST /api/admin/sources`: upsert (id optional). Validates kind + metadata.
- [ ] `POST /api/admin/sources/:id/pause|resume|delete`.
- [ ] `POST /api/admin/sources/:id/backfill` body `{ days: 7|30|90 }`.
- [ ] `GET /api/admin/sources/:id/preview?limit=10`: dry-run; returns items + quota estimate.
- [ ] `POST /api/admin/ingest/trigger` `{ kind: 'rss'|'youtube' }`.
- [ ] Guard or replace existing `/api/pipeline/trigger|status|recent` behind admin or mirror under `/api/admin/pipeline/*` and update UI callers.
  - Use `@db` imports for queries inside route handlers.

Acceptance:

- [ ] All admin APIs return 403 for non-admin.
- [ ] Preview returns within 3s and never writes DB.

Progress:

- [x] `GET /api/admin/sources`
- [x] `POST /api/admin/sources`
- [x] Pause/Resume/Delete/Backfill endpoints
- [ ] Preview endpoint and engine helper
- [x] `/api/pipeline/*` admin-gated

## Phase 5 — Sources UI

- [ ] Add Source form: paste bar, provider select, backfill window (default 30), submit.
- [ ] Auto-detect kind from pasted URL (YouTube video/channel/handle → channel; RSS/Podcast feed URLs; generic site attempts RSS discovery later).
- [ ] Table: Name, Kind, Domain, Status, Last Sync, Actions (Edit, Pause/Resume, Backfill 7/30/90, Delete).
- [ ] Row: Preview (dry-run) with top-N items and quota estimate; “Seed now” button enqueues.
- [ ] Toasts and optimistic updates on actions.

Acceptance:

- [ ] Creating a source enqueues ingest and appears in table.
- [ ] Paused sources do not ingest on next run.
- [ ] Backfill requests adjust next run window.

## Phase 6 — Engine Hooks

- [ ] Filter inactive: update `getRssSources` and `getYouTubeSources` to add `and coalesce(active, true)`.
- [ ] Backfill window: respect `last_cursor` or `metadata.published_after` where applicable.
- [ ] Dry-run helpers: functions to fetch next items with small limits and compute quota cost; no `upsertRawItem` and no enqueues.
- [ ] HTTP debug endpoint (local only) to exercise preview if helpful (optional).

Acceptance:

- [ ] Inactive sources are skipped.
- [ ] Preview returns items without creating raw_items or jobs.

Progress:

- [x] Filter inactive sources in engine ingest queries
- [x] Backfill hint respected via `metadata.published_after` (admin writes it)
- [ ] Dry-run preview helpers (no writes; small limits)

## Phase 7 — Deprecations & Polish

- [ ] Gate or redirect `/testing` and `/temp` to `/admin` (admin only).
- [ ] Ensure `/api/pipeline/*` routes aren’t publicly exposing pipeline data (guard or move to admin namespace).
- [ ] Copy tweaks: buttons (“Follow channel”, “Subscribe to site”, etc.).
- [ ] Empty states for Sources and Jobs tabs.

Acceptance:

- [ ] `/testing` and `/temp` no longer publicly accessible.
- [ ] Admin page is the single entry for diagnostics and planning.

## Security

- [ ] All admin endpoints check admin server-side (never trust client state).
- [ ] `supabaseAdminClient` used only in server routes/actions.
- [ ] No service keys in client bundles.
- [ ] RLS enabled on `public.sources`; no anon policies.

## QA Plan

- [ ] Unauth user → `/admin` redirects to `/login`.
- [ ] Non-admin authed user → `/admin` redirects to `/home`.
- [ ] Admin can: create/pause/resume/backfill/delete a source; see effects in engine logs and counts.
- [ ] Preview for YouTube search does not create DB rows; shows quota estimate.
- [ ] Paused sources remain skipped across scheduled ingest.
- [ ] Forecast tab editable inputs update totals.

## Dev Setup Dependencies

- [ ] Baseline migrations applied locally (`pnpm run db:migrate`), worker role password set via psql, admin user flagged.
- [ ] Stripe fixtures run to populate `products`/`prices` (webhook secret set; verify `/pricing`).

## Progress Summary (TL;DR)

- [x] Baseline schema + indexes + RLS
- [x] Admin gating for `/admin` + APIs
- [x] Admin APIs for sources (preview pending)
- [x] `/admin` Sources + Overview tabs
- [x] Seeds for pg-boss version/schedules
- [ ] Preview path (engine + API + UI)
- [ ] Forecast inline + Admin nav + deprecations

## Phase 8 — Per‑Source Metrics (Function + Realtime)

Goal: Replace 2s polling with realtime updates and show per‑source counts (raw items, contents, stories, 24h deltas, last timestamps) in the Sources table.

Plan

- DB aggregation table (admin‑only): `public.source_metrics`
  - Columns: `source_id uuid pk`, `raw_total int`, `contents_total int`, `stories_total int`, `raw_24h int`, `contents_24h int`, `stories_24h int`, `last_raw_at timestamptz`, `last_content_at timestamptz`, `last_story_at timestamptz`, `updated_at timestamptz default now()`.
  - RLS: enable; policy allows only admins to select: `exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)`.
- DB function (see .cursor/rules/create-db-functions.mdc): `public.refresh_source_metrics(_source_id uuid default null)`
  - If `_source_id` is null: recompute for all sources; else recompute slice for that source.
  - Implementation uses indexed queries:
    - raw_total from `raw_items` by `source_id`; `raw_24h` with `discovered_at > now() - interval '24h'`; `last_raw_at` = max(discovered_at).
    - contents_total via join `raw_items`→`contents`; `contents_24h` on `extracted_at` window; `last_content_at` = max(extracted_at).
    - stories_total via join `contents`→`stories`; `stories_24h` on `created_at`; `last_story_at` = max(created_at).
- Triggers (after insert) to keep metrics fresh (avoid heavy recompute):
  - On `raw_items`: `perform public.refresh_source_metrics(NEW.source_id)`.
  - On `contents`: `perform public.refresh_source_metrics((select source_id from raw_items where id = NEW.raw_item_id))`.
  - On `stories`: `perform public.refresh_source_metrics((select source_id from raw_items r join contents c on c.id = NEW.content_id and c.raw_item_id = r.id))`.
  - Follow the patterns in .cursor/rules/create-db-functions.mdc for safe, idempotent upserts.
- Realtime (see .cursor/rules/use-realtime.mdc):
  - Enable Realtime for `public.source_metrics` and subscribe in Admin client.
  - Broadcast changes on insert/update; optimistic UI can update a row when the corresponding `source_id` payload arrives.
  - For job queue counts, also subscribe to `pgboss.job` (or a light `job_metrics` table if needed) and aggregate client‑side by `name:state` (or mirror the computed map into a table with a trigger if preferred).
- UI wiring:
  - Sources table: add columns “Raw”, “Contents”, “Stories”, “24h”, and badge “Last seen” from metrics; hydrate initially from API list; live‑update via Realtime subscription.
  - Remove 2s interval polling for Overview once Realtime is verified (keep as fallback when Realtime is offline).

Acceptance

- [ ] `source_metrics` exists and is updated in near‑real‑time when new raw_items/contents/stories appear.
- [ ] Admin can see counts update live without refreshing or polling.
- [ ] RLS prevents non‑admins from selecting `source_metrics` rows; Admin page subscriptions succeed for admin users.

Notes

- Backfill: call `refresh_source_metrics(_source_id)` at the end of each backfill run for accurate 24h/last timestamps when bulk inserts occur.
- Performance: queries use existing indexes (`raw_items_source_discovered_idx`, `contents_extracted_idx`, `stories_created_idx`); aggregation slice per source keeps trigger work light.

## Phase 9 — Quota Snapshot (YouTube) + Realtime

Goal: Show platform quota status (starting with YouTube) in Overview.

Plan

- Table: `public.platform_quota` (`provider text primary key`, `quota_limit int`, `used int`, `remaining int`, `reset_at timestamptz`, `updated_at timestamptz default now()`).
- Engine: write snapshot every 5–10 minutes and after ingest bursts (use existing YouTubeFetcher quota tracker).
- Realtime: add table to publication; Admin subscribes for live updates.
- UI: “Quota” card in Overview: current used/remaining and reset time; warning color when remaining < threshold.

Acceptance

- [x] Quota card shows live values without reloads.
- [x] Writes are throttled (no more than ~1/minute) to avoid noisy updates.

## Phase 10 — Per‑Source Health (Debug Light) + Realtime

Goal: Badge and details to highlight sources with recent errors.

Plan

- Table: `public.source_health` (`source_id pk`, `status enum('ok','warn','error')`, `last_success_at`, `last_error_at`, `error_24h int`, `message text`, `updated_at`).
- Engine updates on ingest catch blocks and on success; keep payload small (last error string, timestamps). Consider rolling window counters.
- Realtime: subscribe to table; Sources row shows status badge + hover tooltip with `message`.

Acceptance

- [ ] Sources with errors show “Error” or “Warn” badge quickly after a failed run.
- [ ] Last success/error timestamps update appropriately.

## Phase 11 — Job Metrics Mirror + Realtime

Goal: Replace job queue polling with realtime summaries.

Plan

- Table: `public.job_metrics` (`name text`, `state text`, `count int`, `updated_at timestamptz`, primary key (`name`,`state`)).
- Engine: every 2–5 seconds (or after a work batch), aggregate from `pgboss.job` and upsert counts. Keep cadence light to reduce DB writes.
- Realtime: add to publication; Admin subscribes and recomputes the map in the Overview “Job Queue” card.

Acceptance

- [x] Job counts update within a few seconds of queue changes without polling.
- [x] Write cadence is low and does not regress performance.

## Phase 12 — Bootstrap robustness (Types sync)

Goal: Ensure engine sees up-to-date DB types without manual steps.

Plan

- Script enhancement: after `supabase gen types ... > src/lib/supabase/types.ts`, copy/sync the file to `engine/src/lib/supabase/types.ts` (or establish a shared import path if desired).
- Optionally add a prebuild hook in engine service to validate types are present.

Acceptance

- [x] `pnpm run bootstrap` regenerates types for app and engine so both compile against current schema.

## Post-Launch

- [ ] Update README and docs to point to `/admin` console.
- [ ] Remove or hide old testing/temp links.
- [ ] Add Sentry breadcrumbs around admin actions if Sentry is enabled (optional).
