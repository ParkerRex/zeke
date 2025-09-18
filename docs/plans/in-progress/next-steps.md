# Next Steps — Auth & Data Foundation

## 0. Pre-flight
- [x] Confirm all Drizzle table/relations live under `packages/db/schema` and imports point there.
  - Note: Schema currently at `packages/db/src/schema.ts` - needs migration to `/schema` directory
- [x] Ensure `packages/db/src/client.ts` only uses the single Supabase connection (`SUPABASE_DB_URL`/`DATABASE_URL`).
  - ✓ Confirmed: Uses SUPABASE_DB_URL → DATABASE_URL → DATABASE_PRIMARY_URL fallback chain
- [x] Check environment configuration so every runtime has the database URL + optional `DB_POOL_SIZE`.
  - ✓ Confirmed: DB_POOL_SIZE defaults to 5, configurable via env var
  - Note: Worker has separate pg Pool at `apps/worker/src/db.ts` using DATABASE_URL

## 1. Schema Alignment & Local Supabase
- [x] Audit `packages/db/src/schema.ts` against `docs/plans/in-progress/db-proposed-er.md` + the updated wireframe; outline required changes and open questions before implementation.
  - ✓ Created comprehensive audit at `docs/plans/in-progress/schema-audit.md`
  - Found 30+ missing tables needed for playbooks, assistant, and team state
  - Identified critical field gaps in existing tables (teams.slug, highlights.chapter_id, etc.)
- [x] Draft the revised Drizzle schema (stories, highlights, playbooks, assistant, billing) and get sign-off; note any short-term gaps (e.g., `team_state` TBD) with TODO comments.
  - ✓ Created comprehensive revised schema at `packages/db/src/schema.ts`
  - Added 30+ new tables for playbooks, assistant, team state, and story structure
  - Included TODO comment for deferred team_state features
  - Ready for review and migration planning
- [ ] Once approved, run the local Supabase workflow: start the Docker instance via Supabase CLI, apply Drizzle migrations/`push`, and point `config.toml` as described in [Drizzle + Supabase docs](https://orm.drizzle.team/docs/get-started/supabase-existing) and [Supabase Drizzle guide](https://supabase.com/docs/guides/database/drizzle).
- [ ] Decide whether Supabase-generated types can be dropped after the Drizzle source of truth is live; document the outcome.
- [ ] Verify the schema/migration round-trip completes successfully before moving to query work.

## 2. Drizzle Query & Mutation Layer
- [ ] Move/implement domain queries in `packages/db/src/queries` (users, teams, stories, highlights, playbooks, assistant).
  - Each function accepts `db: Database`, selects explicit columns, and returns typed payloads.
- [ ] Implement domain mutations in `packages/db/src/mutations` (setActiveTeam, acceptInvite, createHighlight, etc.).
  - Keep business logic close to the data, no Supabase calls here.
- [ ] Build composition helpers that return the full Discover → Apply payloads (story + chapters + highlights + assistant context) so server actions can stay thin.
- [ ] After schema rollout, prioritize CRUD for stories/highlights/assistant threads; mark `team_state` wiring as a TODO for a later pass.
- [ ] Export shared Zod schemas for inputs/outputs if actions need them.

## 3. Supabase Cached Wrappers
- [ ] Retain Supabase client factories (`packages/supabase/src/client/*`).
- [ ] Implement read helpers in `packages/supabase/src/queries/**` that:
  - `await connectDb()` and call the Drizzle queries.
  - Wrap results in `unstable_cache` with clear tag conventions (`user_${id}`, `resource_story_${id}`, etc.).
- [ ] Keep `getSession` so auth-aware server components/actions can reuse session info.

## 4. Server Actions
- [ ] For each mutation/read needed by the dashboard, add a safe action in `apps/dashboard/src/actions/**`.
  - Use `authActionClient` for context (user, Supabase, analytics).
  - Call the Drizzle helper via `connectDb()`.
  - `revalidateTag`/`revalidatePath` so cached reads stay fresh.
  - Return typed payloads for client hooks.
- [ ] Implement dedicated actions for the screenshot deliverables (executive brief, key findings, chat threads) that orchestrate the new Drizzle compositions.

## 5. Session & Data Providers
- [ ] In `(app)/(sidebar)/layout.tsx`, create `UserLoader` (server) that calls `getCurrentUserCached`.
  - Redirect to `/login` when the user is missing.
  - Render a `UserProvider` (client context) with the fetched data.
- [ ] Add a similar `TeamProvider` if we need plan/limit context.
- [ ] Update page loaders (e.g., `stories/[id]`, `today`, `apply`) to fetch data server-side via cached queries and pass to client components as props.
- [ ] Enforce the subscription-driven redirect matrix described in `AUTH_LOGIN_SPEC` (trial, canceled, invite states) via the layout loaders and `apps/dashboard/src/middleware.ts`.

## 6. Client Hooks & Interactive UX
- [ ] Replace TRPC hooks with context + safe-action hooks:
  - `useUser()` reads from `UserProvider`.
  - `useUpdateUser()` wraps `useAction(updateUserAction)`; optional TanStack `useMutation` wrappers when we need retries/refetch.
- [ ] For components needing optimistic updates (pins, invites, chat), combine `useAction` with `useOptimistic` or `useActionQuery` (TanStack helper).
- [ ] Provide reusable helpers for action-based queries/mutations to keep loading states consistent.

## 7. UI Refresh (Discover → Apply)
- [ ] Refactor existing components/pages to consume the new hooks instead of TRPC.
  - Teams page already migrated; apply the same approach to Discover/Apply/Market modules.
- [ ] Ensure new providers are mounted high enough so all descendants can access `useUser`/`useTeam`.
- [ ] Implement server data façades for story details (highlights, chat threads, playbooks) following the ERD and the screenshot layout (executive brief, key insights, receipts panel).
- [ ] Defer share flow polish for now—tag the relevant route/component with a `// TODO: share flow` so we can revisit post-MVP.

## 8. Testing & Validation
- [ ] Write unit/integration tests for Drizzle queries & mutations (against Supabase dev DB).
- [ ] Add tests for key safe actions (invite acceptance, active team switch, highlight creation).
- [ ] Add E2E coverage for the login → teams → dashboard path using the new providers.

## 9. Cleanup & Documentation
- [ ] Remove old TRPC client/server wiring once replacements are live.
- [ ] Update docs (PRDs, README snippets) to document the “Drizzle + Supabase cached queries + safe actions” workflow.
- [ ] Deep-dive `apps/worker/**` ingestion tasks to map required updates (chapters, turns, metrics, highlight references) once the schema lands; plan follow-up implementation.

## 10. API Routes & Pipeline
- [ ] After Drizzle helpers are in place, refactor `apps/dashboard/src/app/api/pipeline/**`, `stories`, `share`, and `webhooks` routes to call the new data layer and keep business logic close to the tables.
- [ ] Annotate the deferred share work with TODOs and ensure the route still returns a safe stub until we prioritize it.
- [ ] Review pipeline status/trigger/recent endpoints once worker changes ship so metrics stay in sync with the upgraded schema.
