# API Agent Preferences

## Coding Preferences
- Build REST endpoints with `OpenAPIHono` and Zod schemas; register routes through `rest/routers/index.ts` with proper middleware stacks for authenticated traffic.
- Use Better Auth for authentication; validate session tokens in `auth` middleware and hydrate user/team context before protected routes execute.
- Add TRPC features by extending domain routers under `trpc/routers` and exposing them through `protectedProcedure`/`publicProcedure` for consistent permission checks.
- Share data contracts between REST and TRPC by reusing Zod schemas in `src/schemas`; avoid duplicating inline definitions.
- AI tools live in `src/ai/tools/` and implement the tool interface; register new tools in `src/ai/tools/index.ts`.
- AI artifacts (chat titles, follow-up questions, etc.) go in `src/ai/artifacts/` and are called during chat flows.
- Use Drizzle ORM for database operations; connect via middleware/context helpers and rely on `withPrimaryReadAfterWrite` to handle replica lag.
- Redis caching is configured for API keys, users, teams, and permissions (30 min TTL) with replication cache for read-after-write consistency (10 sec TTL).
- Create lightweight wrappers in `src/services` for external systems (Resend, Stripe) so credentials live in one place and can be mocked in tests.
- Surface actionable errors: throw `HTTPException` for REST handlers, `TRPCError` for TRPC procedures, and prefer precise messages over generic failures.
- Keep rate limiting, team permissions, and scope checks in middleware to maintain clear separation between transport and business logic.

## Naming Conventions
- Postgres tables stay snake_case, and Drizzle maps them to camelCase fields via the `casing: "snake_case"` setting ([packages/db/src/client.ts:85](packages/db/src/client.ts#L85)). Schema definitions therefore read/write camelCase properties such as `userId` and `createdAt` even though the physical columns are `user_id` and `created_at` ([packages/db/src/schema.ts:436-440](packages/db/src/schema.ts#L436-L440)).
  - All JSON that leaves the API is intentionally camelCase so that the web app and other TypeScript clients can consume it without extra transforms—see the OpenAPI schema for stories where response fields are `createdAt`, `clusterId`, `embedUrl`, etc. ([apps/api/src/schemas/stories.ts:57-86](apps/api/src/schemas/stories.ts#L57-L86)).
- When we need to pass filters down to SQL that still expects snake_case, we translate at the edge of the call—for example the LLM filter generator returns camelCase `startDate` and `endDate` ([apps/api/src/utils/search-filters.ts:7-18](apps/api/src/utils/search-filters.ts#L7-L18)) which are then passed as-is to `globalSemanticSearchQuery` that maps them to snake_case parameters like `start_date` and `end_date` for the stored procedure ([packages/db/src/queries/search.ts:58-76](packages/db/src/queries/search.ts#L58-L76)). That keeps the external contract camelCase while preserving compatibility with existing SQL helpers.

## Key Architecture Patterns

### Two API Shapes

- The `/trpc/*` surface is our first-party RPC layer, wired straight into the appRouter with shared context ([apps/api/src/index.ts:38-44](apps/api/src/index.ts#L38-L44), [apps/api/src/trpc/init.ts:1-82](apps/api/src/trpc/init.ts#L1-L82)). It gives the dashboard a fully typed client, superjson serialization, and access to session/team context via middleware like `withTeamPermission`, so we can iterate quickly without managing REST verbs or OpenAPI churn.
- The REST layer hangs off the same Hono app (`app.route("/", routers)` at [apps/api/src/index.ts:204](apps/api/src/index.ts#L204)) and is wrapped with OpenAPI tooling (OpenAPIHono, Scalar) plus auth/rate-limit middleware that speaks API keys and OAuth tokens ([apps/api/src/rest/middleware/auth.ts:1-151](apps/api/src/rest/middleware/auth.ts#L1-L151), [apps/api/src/rest/middleware/index.ts:1-34](apps/api/src/rest/middleware/index.ts#L1-L34)). This is the contract we publish to third parties—stable URLs, documented schemas, scope-based permissions.
- Both layers call into the shared query modules under `@zeke/db/queries`, so business logic and data shaping live in one place while we expose it through whichever transport best fits the consumer (see imports in [apps/api/src/rest/routers/stories.ts:17](apps/api/src/rest/routers/stories.ts#L17) and [apps/api/src/trpc/routers/search.ts:4](apps/api/src/trpc/routers/search.ts#L4)).

### AI Assistant Integration
- Chat endpoints support streaming responses via Server-Sent Events
- AI tools in `src/ai/tools/` are called during chat conversations
- AI artifacts generate metadata (titles, follow-up questions) asynchronously
- Tools: `web-search`, `get-brief`, `get-summaries`, `get-highlights`, `get-playbook`, `link-insights`
- Artifacts: `chat-title`, `followup-questions`, `burn-rate`, `get-goals`

### Authentication & Authorization
- Better Auth session tokens validated in `auth.ts` middleware
- User/team context hydrated from Redis cache (30 min TTL)
- Team permissions checked via `team-permission.ts` middleware for protected routes
- RBAC system enforces role-based access control

### Database & Caching
- Drizzle ORM for all database operations
- Primary/replica setup with `withPrimaryReadAfterWrite` for read-after-write consistency
- Redis caching for API keys, users, teams, permissions (30 min TTL)
- Replication cache tracks recent mutations (10 sec TTL) to route reads to primary
