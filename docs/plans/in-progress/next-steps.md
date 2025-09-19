# Next Steps — Auth & Data Foundation

## Sprint 0 — Pre-flight
- [x] Confirm all Drizzle table/relations live under `packages/db/schema` and imports point there.
  - Note: Schema currently at `packages/db/src/schema.ts` - needs migration to `/schema` directory.
- [x] Ensure `packages/db/src/client.ts` only uses the single Supabase connection (`SUPABASE_DB_URL`/`DATABASE_URL`).
  - ✓ Confirmed: Uses SUPABASE_DB_URL → DATABASE_URL → DATABASE_PRIMARY_URL fallback chain.
- [x] Check environment configuration so every runtime has the database URL + optional `DB_POOL_SIZE`.
  - ✓ Confirmed: DB_POOL_SIZE defaults to 5, configurable via env var.
  - Note: Worker has separate pg Pool at `apps/worker/src/db.ts` using `DATABASE_URL`.

## Sprint 1 — Schema & Data Layer Foundations
- [x] Audit `packages/db/src/schema.ts` against `docs/plans/in-progress/db-proposed-er.md` + the updated wireframe; outline required changes and open questions before implementation.
  - ✓ Created comprehensive audit at `docs/plans/in-progress/schema-audit.md`.
  - Found 30+ missing tables needed for playbooks, assistant, and team state.
  - Identified critical field gaps in existing tables (teams.slug, highlights.chapter_id, etc.).
- [x] Draft the revised Drizzle schema (stories, highlights, playbooks, assistant, billing) and get sign-off; note any short-term gaps (e.g., `team_state` TBD) with TODO comments.
  - ✓ Created comprehensive revised schema at `packages/db/src/schema.ts`.
  - Added 30+ new tables for playbooks, assistant, team state, and story structure.
  - Included TODO comment for deferred `team_state` features.
  - Ready for review and migration planning.
- [x] Extend highlights schema for Discover → Apply flows.
  - Add `highlight_origin` enum (`user`, `assistant`, `system`) and wire it to `highlights.origin` (default `user`).
  - Add optional `assistant_thread_id` FK and `origin_metadata` JSONB for AI provenance.
  - Create `highlight_collaborators` join table (highlight/user/role + timestamps) to support targeted sharing.
  - Extend `team_highlight_states` with `shared_scope` enum (`private`, `team`, `public`) and `shared_by` FK so visibility rules stay centralized.
  - Update indexes/FKs and generate the Drizzle migration alongside the schema changes.
  - ✅ Updated `schema.ts`, applied Drizzle migration, and regenerated Supabase/Drizzle types.
- [ ] Move/implement domain queries in `packages/db/src/queries` (users, teams, stories, highlights, playbooks, assistant).
  - ✓ Core modules already cover most surfaces (`users`, `teams`, `stories`, `highlights`, `sources`, `story-analytics`, etc.); keep the README in sync when adding more.
  - [ ] Fill the gaps from the schema audit: add `billing.ts` (Stripe prices/subscriptions), `story-clusters.ts` (cluster + overlays + transcripts), `pipeline.ts` (queue counts + recent activity), and `assistant/playbooks` once their tables stabilize.
    - [x] Added `billing.ts`, `story-clusters.ts`, and `pipeline.ts` under `packages/db/src/queries/` (see README bump).
    - [x] Assistant/playbooks query surface implemented via `packages/db/src/queries/assistant.ts` and `packages/db/src/queries/playbooks.ts`.
    - ➡️ Next unblock: wire the new query helpers into Supabase cached fetchers + safe actions so the dashboard can consume them.
  - [x] Document return payloads with exported types + JSDoc in each module so server actions can reuse the shapes without ad-hoc `Pick<>`s.
  - [ ] Replace remaining `@zeke/supabase/queries` call sites with Drizzle-backed server actions + helpers.
    - [x] Stories (dashboard + marketing):
      - Replaced all `listStories`/`getStoryById` imports with Drizzle-backed helpers exposed via `@/lib/stories` (dashboard) and `apps/website/src/lib/stories.ts`.
      - Added view-model transformers in `packages/db/src/utils/story-view.ts` + `packages/db/src/queries/story-display.ts`, removing the dependency on `@zeke/supabase/types/Cluster` at call sites.
      - Updated server components, API routes, and client hooks to consume the new helpers (`/api/stories`, `/api/share`, dashboard feed widgets, marketing pages, tabs, etc.).
      - TODO follow-up: delete the legacy `Cluster` definition from `@zeke/supabase/types` once pricing/admin refactors are complete.
    - [x] Pipeline widgets:
      - Added `apps/dashboard/src/actions/pipeline/get-pipeline-status-action.ts` and `get-pipeline-activity-action.ts` with corresponding Zod schemas in `actions/schemas/pipeline.ts`, plus shared admin guard utilities.
      - Replaced `/api/pipeline/status` and `/api/pipeline/recent` to call Drizzle-backed helpers under `apps/dashboard/src/lib/pipeline.ts`, eliminating the `@zeke/supabase/queries` dependency for counts/activity while preserving the existing response contracts.
    - [ ] Pricing & subscriptions:
      - Introduce `apps/dashboard/src/actions/billing/get-products-action.ts` and `get-team-subscription-action.ts` (schemas in `actions/schemas/billing.ts`) which call `getActiveProductsWithPrices` and `getTeamActiveSubscription`.
      - Update `PricingSection`, checkout flow, and manage-subscription route to call those actions; remove imports from `@zeke/supabase/queries`.
      - Ensure `apps/dashboard/src/components/pricing/price-card.tsx` consumes the Drizzle-derived TypeScript types instead of `@zeke/supabase/types`.
    - [ ] Notifications / current user:
      - Add `apps/dashboard/src/actions/users/get-current-user-action.ts` (schema in `actions/schemas/users.ts`) that returns the cached `getUserById` payload.
      - Refactor `use-notifications` to invoke the action (or a new `/api/users/me` route) instead of reaching through Supabase client-side.
    - [ ] Stripe customer lookup:
      - Implement `packages/db/src/queries/billing.ts#getTeamStripeCustomerId` (or similar) and a matching safe action so `manage-subscription` can read the team’s `stripe_customer_id` without the legacy helper.
    - [ ] Sources admin (blocked):
      - Design new read/write helpers for `sources` + `source_connections` + `source_health`; once available, add `apps/dashboard/src/actions/admin/sources/*.ts` to back the admin API routes and remove `getAdminFlag` usage.
    - [ ] Cleanup:
      - Remove unused exports from `packages/supabase` (leave only `cached-queries/getSession`, storage utilities, and client factories).
      - Update the package export map + documentation to reflect the new action entry points.
- [ ] Implement domain mutations (setActiveTeam, acceptInvite, createHighlight, etc.).
  - [x] Keep write helpers inside the relevant `packages/db/src/queries/*` module for now; switched dashboard safe actions to import from the query barrel instead of the deleted `mutations` path.
  - [ ] Extract mutating helpers currently co-located with queries (`stories.insertStory`, `stories.upsertStoryOverlay`, notification settings upserts`, etc.) into dedicated write-focused modules once the surface stabilizes.
    - [ ] Decision: keep story writes inside `packages/db/src/queries/stories.ts` until broader mutation surface is defined.
  - [ ] Scaffold `packages/db/src/mutations/index.ts` (or equivalent) once we unwrap more than teams/highlights so everything accepts the shared `Database` type from `connectDb()`.
  - [x] Add transactional helpers for multi-table flows: `setActiveTeam` now verifies membership, toggles `team_members.status` flags, and invite `accept/decline` paths provision memberships then clear pending invites.
- [ ] Build highlights CRUD + sharing layer.
  - [x] Implement story/highlight queries (`getStoryHighlights`, `getSharedHighlights`, `getHighlightById`) with transcript + turn joins in `packages/db/src/queries/highlights.ts`.
  - [x] Add mutation helpers (`createHighlight`, `updateHighlight`, `deleteHighlight`, `shareHighlight`, `revokeHighlightShare`) that respect origin metadata and collaborator rules.
  - [x] Introduce utility mappers for transcript snippets + citation payloads under `packages/db/src/utils/highlights.ts`.
  - Write unit tests covering CRUD + sharing permutations (user/assistant/system origins).

## Sprint 2 — Cached Access & Automated Highlight Generation
- [ ] Retain Supabase client factories (`packages/supabase/src/client/*`).
- [ ] Implement read helpers in `packages/supabase/src/queries/**` that:
  - `await connectDb()` and call the Drizzle queries.
  - Wrap results in `unstable_cache` with clear tag conventions (`user_${id}`, `resource_story_${id}`, etc.).
- [ ] Keep `getSession` so auth-aware server components/actions can reuse session info.
- [ ] For each mutation/read needed by the dashboard, add a safe action in `apps/dashboard/src/actions/**`.
  - Use `authActionClient` for context (user, Supabase, analytics).
  - Call the Drizzle helper via `connectDb()`.
  - `revalidateTag`/`revalidatePath` so cached reads stay fresh.
  - Return typed payloads for client hooks.
- [ ] Implement dedicated actions for the screenshot deliverables (executive brief, key findings, chat threads) that orchestrate the new Drizzle compositions.
- [ ] Add safe actions for highlight CRUD/sharing; ensure cache tags (`highlight_${id}`, `story_${id}`) revalidate correctly.
- [ ] Update story/cluster API routes to include highlight arrays partitioned by origin and filtered by sharing scope.
- [ ] Document new action contracts in `apps/dashboard/src/actions/README.md` (or equivalent).
- [ ] Create worker task that prompts a system LLM to generate highlights from transcripts/chapters, persisting via the shared mutation (`origin = 'system'`).
- [ ] Extend assistant thread flows to author highlights (`origin = 'assistant'`) and record `assistant_thread_id`.
- [ ] Add observability (structured logs + metrics) for highlight generation success/failure.

## Sprint 3 — Dashboard Integration (In Progress)
- [x] Implement TRPC client provider inside dashboard and route hooks through `useTRPC()`.
- [x] Replace `/api/stories` proxy with `use-stories` hooks powered by `trpc.story.list/get/metrics`.
- [ ] Migrate highlight UI to `use-highlights` + `use-highlight-engagement`.
- [ ] Wire assistant UI (panels + chat sidebar) to `use-assistant` hooks; keep message-create stubbed until worker actions are ready.
- [ ] Implement team switcher and account settings screens with `use-teams` + `use-set-active-team`.
- [ ] Revisit notifications strategy: either add a TRPC router or encapsulate the Novu integration behind `use-notifications` until API work lands.
- [ ] Introduce story chapter query/hook once the timeline component is built.
- [ ] Update assistant tools in `apps/dashboard/src/lib/tools/*` to call TRPC via `getQueryClient()` so server actions share the same contracts.

## Sprint 4 — Discover → Apply UX & Highlight Sharing
- [ ] Refactor remaining pages to consume the TRPC hooks (Apply view, Market experiments).
- [ ] Implement highlight panels per wireframes (group by origin, share badges, edit/delete controls).
- [ ] Build transcript selection UI for manual highlight creation.
- [ ] Add sharing dialog (team members list, role selection) with optimistic updates.
- [ ] Surface assistant/system attribution in highlight lists.

## Sprint 5 — Testing & Validation
- [ ] Write unit/integration tests for Drizzle queries & mutations (against Supabase dev DB).
- [ ] Add tests for key safe actions (invite acceptance, active team switch, highlight creation).
- [ ] Add E2E coverage for the login → teams → dashboard path using the new providers.
- [ ] Add safe-action integration tests (create/update/delete/share) using Supabase test DB.
- [ ] Expand E2E coverage to exercise user-created, assistant-created, and shared highlights within the Discover → Apply flow.
- [ ] Verify accessibility (ARIA roles, keyboard navigation) for highlight cards and share dialogs.

## Sprint 6 — Cleanup, Documentation, API & Pipeline
- [ ] Remove old TRPC client/server wiring once replacements are live.
- [ ] Update docs (PRDs, README snippets) to document the “Drizzle + Supabase cached queries + safe actions” workflow.
- [ ] Deep-dive `apps/worker/**` ingestion tasks to map required updates (chapters, turns, metrics, highlight references) once the schema lands; plan follow-up implementation.
- [ ] After Drizzle helpers are in place, refactor `apps/dashboard/src/app/api/pipeline/**`, `stories`, `share`, and `webhooks` routes to call the new data layer and keep business logic close to the tables.
- [ ] Annotate the deferred share work with TODOs and ensure the route still returns a safe stub until we prioritize it.
- [ ] Review pipeline status/trigger/recent endpoints once worker changes ship so metrics stay in sync with the upgraded schema.
