# Zeke API Integration Roadmap (TRPC-First)

## Goals
- Deliver the data contracts required by the dashboard wireframes and assistant flow using a TRPC-only transport surface.
- Map each endpoint directly to repository helpers in `packages/db/src/queries` so the API remains a thin orchestration layer.
- Stage the work so we can iterate feature-by-feature without blocking frontend development.

## Guiding Principles
- **TRPC-first.** REST/OpenAPI will be layered on later; focus now on typed procedures and shared Zod schemas.
- **Schema reuse.** Every procedure should import shared Zod models from `apps/api/src/schemas/**` (or shared packages) to keep dashboard hooks and AI tools in sync.
- **Repository fidelity.** Each resolver should call an existing query in `packages/db/src/queries`. If a query is missing, add it there first, then wire the router.
- **Assistant-ready.** Shape responses so the assistant tools can reuse them without additional reshaping.

## Work Breakdown

### 1. Foundation
1. ✅ Users router (`user.me`, `user.update`, `user.delete`, `user.invites`).
2. Trim `_app.ts` to expose only active routers; remove Midday leftovers as new routers come online.
3. Establish shared helper utilities (auth, db context) – already in place via `createTRPCContext`.

### 2. Stories & Clusters (Wireframe Columns 1–2)
1. **Schemas** – `apps/api/src/schemas/story.ts`
   - `storyListItemSchema`, `storyDetailSchema`, `storyClusterSchema`, `storyMetricsSchema`.
2. **Router** – `apps/api/src/trpc/routers/story.ts`
   - `list` → `listStoriesForDisplay` with filters (`type`, `search`, `after`, `limit`).
   - `get` → `getStoryForDisplay` (includes cluster + metrics).
   - `metrics` → `getStoryMetrics` (team scoped).
   - `chapters` → repo for story turns (add helper if missing).
3. Update `_app.ts` exports and add client procedure typings.

### 3. Highlights & Key Findings (Wireframe Column 3)
1. **Schemas** – `apps/api/src/schemas/highlight.ts`
   - `highlightSchema`, `highlightInsightSchema`, `highlightEngagementSchema`.
2. **Router** – `apps/api/src/trpc/routers/highlight.ts`
   - `byStory` → `getHighlightsByStory` (verify/implement in repo).
   - `engagement` → `getHighlightEngagement`.
   - `create`, `pin`, `updateState` (mutations for future editing flows, can stub if not needed yet).

### 4. Assistant & Chat Surface (Wireframe Column 4)
1. **Schemas** – `apps/api/src/schemas/assistant.ts`
   - `assistantThreadSchema`, `assistantMessageSchema`, `assistantSourceSchema`.
2. **Router** – `apps/api/src/trpc/routers/assistant.ts`
   - `threads.list` / `threads.get` → `assistant.ts` queries.
   - `messages.list` → existing helper or new repo call.
   - `messages.create` → mutation stub hooking into worker trigger (for now return placeholder until LLM pipeline connected).
   - `sources.add/remove` → `assistantThreadSources` helpers.
3. Ensure server-side tools (`apps/dashboard/src/lib/tools/*`) can call these procedures once wired.

### 5. Teams & Workspace Context
1. **Schemas** – `apps/api/src/schemas/team.ts`.
2. **Router** – `apps/api/src/trpc/routers/team.ts`
   - `list` / `get` / `switchActive` leveraging `team-access` and `teams` queries.
   - `members` & `invites` using `users-on-team` and `user-invites` repos (optional phase if UI requires).

### 6. Supporting Data (Optional for MVP)
- **Search** – expose `packages/db/src/queries/search.ts` for global search.
- **Tags & Filters** – for future filter panels; wire as needed.
- **Playbooks / Goals** – only if corresponding UI surfaces land.

## Sequencing Plan
1. ✅ Stories router + schemas.
2. ✅ Highlights router + schemas.
3. ✅ Assistant router + schemas (blocks chat tools).
4. ✅ Team router for account switching.
5. ✅ Additional supporting endpoints (search, tags) on demand.

At each step:
- Create/update schemas.
- Implement TRPC router.
- Register router in `_app.ts`.
- Add todo entry for dashboard hooks to consume the new procedures.
- Backfill tests/stubs later once we introduce a testing strategy.

## Future Work (Post-TRPC MVP)
- Layer REST + OpenAPI using Hono once TRPC surface stabilizes.
- Auto-generate docs/spec from shared schemas.
- Harden auth scopes per procedure.
- Add caching (Redis) for story list endpoints if needed.

## Dashboard Hook Scaffold
Once each TRPC router is live, mirror it with typed React Query hooks under
`apps/dashboard/src/hooks/`. Name files in `kebab-case` following the
`use-*.ts` convention (e.g. `use-user.ts`) and wrap
`trpc.*.queryOptions()` / `.mutationOptions()` so cache keys stay aligned.

- **Stories** (`use-stories.ts`)
  - `useStoriesList(params)` → wraps `trpc.story.list.queryOptions(params)` with pagination helpers.
  - `useStoryDetail(storyId)` → suspense query for `trpc.story.get`.
  - `useStoryMetrics(storyId)` → selective metrics fetch, possibly merged into detail hook via `select`.
  - `useStoryChapters(storyId)` → uses `trpc.story.chapters`.

- **Highlights** (`use-highlights.ts`)
  - `useHighlightsByStory(storyId)` → `trpc.highlight.byStory`.
  - `useHighlightEngagement(storyId)` or `(highlightId)` → power engagement badges.
  - Mutation hooks (pin/update) once editing flows exist.

- **Assistant** (`use-assistant.ts`)
  - `useAssistantThreads(params)` → paginated list from `trpc.assistant.threads.list`.
  - `useAssistantThread(threadId)` → detail (messages + sources) via `trpc.assistant.threads.get`.
  - `useAssistantMessages(threadId)` if split from thread detail.
  - Mutations: `useCreateAssistantMessage`, `useAddAssistantSource`, `useRemoveAssistantSource`.

- **Teams / Auth Context** (`use-teams.ts`)
  - `useTeams()` → list current user’s teams via `trpc.team.list`.
  - `useActiveTeam()` → returns `trpc.team.getActive`; mutation to switch teams.

- **Notifications** (`use-notifications.ts`)
  - `useNotifications()` → wraps `trpc.notifications.list` queries (inbox + archived), handles optimistic updates.
  - `useRealtimeNotifications()` → leverage `useRealtime` helper for Supabase channel updates.
  - Mutations: `useNotificationsUpdateStatus`, `useNotificationsUpdateAllStatus` mirroring optimistic flow.

- **Shared Utilities**
  - Provide helper `prefetchStoryView()` for server components (uses `createTRPCClientCaller`).
  - Extend assistant tools (`apps/dashboard/src/lib/tools/*`) to call the new procedures through `getQueryClient()` + `trpc.*.queryOptions()`.

Document each hook alongside the API contracts as they are implemented so dashboard work can proceed in lockstep.

## Front-End Data Access Touchpoints
The dashboard pulls data through multiple surfaces that all ultimately rely on the API layer:

- **Client hooks** – `useTRPC()` + React Query wrappers (`use-*.ts`). These are the primary consumers of the TRPC routers.
- **Server components/layouts** – Use the server-side TRPC utilities in `apps/dashboard/src/trpc/server.tsx` to `fetchQuery`/`prefetch` during SSR.
- **Server actions** – Under `apps/dashboard/src/actions/*`; they call TRPC procedures or repository helpers directly for mutations and side effects.
- **Route handlers (`/app/api/*`)** – Custom endpoints (e.g., chat streaming) that orchestrate AI/tool flows and call TRPC/repositories internally.
- **Supabase utilities** – Auth/session helpers interact with Supabase clients; ensure TRPC context remains compatible with these flows.

When adding new API contracts, account for each of these consumer types so the data is accessible across client hooks, server rendering, and custom actions without duplicating logic.
