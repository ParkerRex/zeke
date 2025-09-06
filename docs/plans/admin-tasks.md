# Admin Console — Implementation Tasks

Status: Ready • Owner: Web + Worker • Est: ~2–3 days

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

## Phase 2 — Server Guards
- [ ] Query: `src/supabase/queries/account/get-admin-flag.ts` returning `{ userId, isAdmin }` using `createSupabaseServerClient()`.
- [ ] Guard helper (server-only): throws or returns redirect when not admin.
- [ ] Apply guard to `/admin` page and all admin API routes.
- [ ] Auth consistency: unauthenticated → `/login`; authed non-admin → `/home`.

Acceptance:
- [ ] Visiting `/admin` as non-auth → redirected to `/login`.
- [ ] Visiting `/admin` as authed non-admin → `/home`.
- [ ] Admin sees `/admin`.

## Phase 3 — Admin Page Shell (/admin)
- [ ] Route: `src/app/(admin)/admin/page.tsx` with tabs: Overview • Sources • Forecast • Jobs.
- [ ] Persist active tab with `nuqs`.
- [ ] Reuse Overview + Jobs content from `src/app/testing/page.tsx` (extract into small components where needed).
- [ ] Move `src/app/temp/page.tsx` content into Forecast tab (client component).
- [ ] Add Admin entry in nav shown only when `isAdmin`.

Acceptance:
- [ ] Overview shows counts, worker status, triggers.
- [ ] Jobs shows job summary and recent lists.
- [ ] Forecast renders playground with editable inputs.

## Phase 4 — Admin APIs
- [ ] `GET /api/admin/sources`: list sources with minimal fields and health (last_checked, active).
- [ ] `POST /api/admin/sources`: upsert (id optional). Validates kind + metadata.
- [ ] `POST /api/admin/sources/:id/pause|resume|delete`.
- [ ] `POST /api/admin/sources/:id/backfill` body `{ days: 7|30|90 }`.
- [ ] `GET /api/admin/sources/:id/preview?limit=10`: dry-run; returns items + quota estimate.
- [ ] `POST /api/admin/ingest/trigger` `{ kind: 'rss'|'youtube' }`.
- [ ] Guard or replace existing `/api/pipeline/trigger|status|recent` behind admin or mirror under `/api/admin/pipeline/*` and update UI callers.

Acceptance:
- [ ] All admin APIs return 403 for non-admin.
- [ ] Preview returns within 3s and never writes DB.

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

## Phase 6 — Worker Hooks
- [ ] Filter inactive: update `getRssSources` and `getYouTubeSources` to add `and coalesce(active, true)`.
- [ ] Backfill window: respect `last_cursor` or `metadata.published_after` where applicable.
- [ ] Dry-run helpers: functions to fetch next items with small limits and compute quota cost; no `upsertRawItem` and no enqueues.
- [ ] HTTP debug endpoint (local only) to exercise preview if helpful (optional).

Acceptance:
- [ ] Inactive sources are skipped.
- [ ] Preview returns items without creating raw_items or jobs.

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
- [ ] Admin can: create/pause/resume/backfill/delete a source; see effects in worker logs and counts.
- [ ] Preview for YouTube search does not create DB rows; shows quota estimate.
- [ ] Paused sources remain skipped across scheduled ingest.
- [ ] Forecast tab editable inputs update totals.

## Post-Launch
- [ ] Update README and docs to point to `/admin` console.
- [ ] Remove or hide old testing/temp links.
- [ ] Add Sentry breadcrumbs around admin actions if Sentry is enabled (optional).

