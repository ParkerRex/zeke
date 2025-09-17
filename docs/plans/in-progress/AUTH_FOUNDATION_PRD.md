# Auth & Data Foundation PRD

## 1. Context & Summary
- The current dashboard auth flow is unstable: session resolution is inconsistent across server components, `authActionClient` relies on ad-hoc helpers, and several pages bypass our intended Supabase client wiring.
- We now have an updated domain ER design (`db-proposed-er.md`) and must ensure auth + data access layers align before we rebuild the Discover → Apply UI.
- Goal: deliver an incremental plan that hardens authentication/authorization and prepares the API/query layer for the new schema without breaking the existing worker ingestion.

## 2. Objectives
1. Provide a deterministic auth/session layer across the dashboard (`apps/dashboard`) using Supabase + Drizzle.
2. Bridge existing worker ingestion (`apps/worker`) with the upcoming schema changes by documenting required adjustments.
3. Define the data access contracts (queries/mutations) needed for the new UI, validating that auth context supplies the IDs those contracts expect.
4. Produce modular workstreams that can be promoted to their own PRDs: `Auth Foundations`, `Data Layer Migration`, `Discover UI Refresh`.

## 3. Non-Goals
- We will not design the full Discover UI here (separate PRD).
- We will not replace Supabase with another auth provider.
- We will not rewrite the worker task queue; only note schema-dependent changes.

## 4. Current State Audit
- **Auth**: Server actions depend on `authActionClient` but mix Supabase session lookups and manual cookies. Pages under `/apply` fetch data client-side with unchecked tokens.
- **Data**: Drizzle schema in `packages/db/src/schema` is still finance-centric; migrations live under `apps/api/supabase/migrations/`. Workers assume the same schema (e.g., `upssertStoryOverlay` etc.).
- **UI**: The existing dashboard components read from deprecated queries; highlights/playbooks rely on tables that will be replaced.

## 5. Proposed Architecture
### 5.1 Auth Flow (Supabase + Drizzle)
- Centralize server-side session resolution in `apps/dashboard/src/utils/session.ts` (or equivalent) using Supabase's `getUser` via the service role key.
- Expose typed helpers: `getCurrentUser()`, `getActiveTeam(userId)`, `assertTeamMembership(teamId, userId)` leveraging new tables.
- Update `authActionClient` to require a resolved `teamId` and to inject a pre-configured Supabase/PostgREST client referencing cached queries.
- Mirror this helper inside API routes (`apps/dashboard/src/app/api/*`) to eliminate duplicated auth logic.

### 5.2 Data Layer Alignment
- Regenerate Drizzle types for the new ER: update `packages/db/src/schema`, sync migrations in `apps/api/supabase/migrations/`, and re-export via `@db/schema`.
- Implement the query stubs defined in `db-proposed-er.md` (stories, highlights, playbooks, assistant, team goals, stats) using Drizzle with explicit column lists and `.limit()`/pagination patterns.
- Provide Supabase cached wrappers in `packages/supabase/src/queries` (`getStoryHighlights` etc.). Ensure cache tag conventions match `resource_${id}`.

### 5.3 Worker Compatibility
- Map current worker writes to new tables:
  - Replace inserts into legacy `stories`/`overlays` tables with the new schema names.
  - Add transcript slicing to populate `story_turns` and `story_chapters` while keeping media remote.
  - Introduce clustering step per `story_clusters`.
- Create a migration checklist so worker deployment happens after Supabase migrations run.

## 6. Workstreams → Future PRDs
1. **Auth Foundations PRD** (this document can seed it): Scope server session helpers, action client updates, middleware, and tests.
2. **Data Layer Migration PRD**: Cover Drizzle schema changes, migrations, worker updates, and cached query implementations.
3. **Discover UI Refresh PRD**: Define the React/Next components, hooks, and data fetching using the new helpers.

## 7. Implementation Steps
1. **Schema Planning**
   - Validate ER diagram against Drizzle capabilities (composite keys, enum usage).
   - Draft migration scripts in `apps/api/supabase/migrations/` using Supabase CLI.
2. **Auth Helper Refactor**
   - Create session utility module.
   - Update `authActionClient` schema definitions to include `teamId`.
   - Audit server actions and pages to use the new helpers.
3. **Data Access Layer**
   - Implement Drizzle query modules (`packages/db/src/queries/*`).
   - Build Supabase cached wrappers in `packages/supabase/src/queries` + invalidation tags.
4. **Worker Sync**
   - Update `apps/worker/src/db.ts` functions to call new tables.
   - Adjust tasks (`ingest-*`, `analyze-story.ts`) to populate `story_turns`, `story_clusters`, etc.
5. **Testing & Rollout**
   - Add integration tests for auth-protected actions and highlight queries.
   - Stage migrations in a Supabase branch; deploy worker with feature flag.

## 12. TODO Matrix (Auth Login Spec Alignment)
- [ ] Review existing Supabase auth button implementations (`apps/dashboard/src/components/*-sign-in.tsx`) and ensure new session helper exposes preferred-provider cookie logic.
- [ ] Port `/api/auth/callback` flow from `AUTH_LOGIN_SPEC.md` into a server action/middleware combo using Supabase session exchange + analytics.
- [ ] Implement redirect decision tree: handle `client=desktop`, preferred provider cookies, invite return paths, MFA handoff, and `/teams/create` fallback.
- [ ] Replace TRPC `trpc.user.me`, `trpc.team.list`, `trpc.team.invitesByEmail` with Drizzle-backed queries/actions (see Section 7.3). _(Teams page now uses Drizzle + safe actions; remaining references live in `authActionClient` and other routes.)_
- [ ] Migrate OTP flow (`verify-otp-action.ts`) to use the new session utility and analytics hooks.
- [ ] Validate middleware that guards `(app)/(sidebar)` routes uses the shared session helper and re-implements invite/team redirects per spec.
- [ ] Update subscription gating logic (trial, plan checks) to read from Drizzle queries instead of TRPC; ensure callbacks respect `return_to` when allowed.
- [ ] Audit `apps/dashboard/src/app/(app)/(sidebar)/layout.tsx` to remove TRPC hydration and plug into cached queries.
- [ ] Document required worker adjustments so login and team selection remain compatible during schema migration.
- [ ] Add regression tests for: first login (no team), returning member, pending invite, desktop client handoff, OTP verification.

## 8. Dependencies & References
- ER diagram & queries: `db-proposed-er.md`
- Existing auth spec work: `docs/plans/in progress/AUTH_LOGIN_SPEC.md`
- Supabase migrations: `apps/api/supabase/migrations/`
- Worker pipeline: `apps/worker/src/tasks` & `apps/worker/src/db.ts`

## 9. Risks & Mitigations
- **Migration mismatch**: Worker might write to old tables. Mitigation: feature flag new schema and deploy worker after migration cutover with smoke tests.
- **Auth regressions**: Refactoring session logic may log out users. Mitigation: add end-to-end tests covering login, team switch, server action call.
- **Query cache drift**: Cached queries might use stale tags. Mitigation: document cache keys in each helper and ensure mutations call `revalidateTag()`.

## 10. Open Questions
1. Do we need role-based permissions beyond team membership (e.g., viewer vs editor) in the first iteration?
2. Should we consolidate Supabase keys into env-per-environment or keep the current per-app configuration?
3. How will we backfill existing stories/highlights into the new schema (migration script vs worker replay)?

## 11. Acceptance Criteria
- A shared session helper exists and is consumed by server actions & API routes.
- Drizzle schema/migrations align with the ER diagram, and the worker code path compiles against them.
- Query modules stubs are implemented and verified via unit/integration tests.
- Follow-up PRDs for Data Migration and Discover UI are drafted using Sections 6–7.
