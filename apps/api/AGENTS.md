# API Agent Preferences
<!-- TODO: Align this with the current Zeke architecture. -->
## Coding Preferences
- Build REST endpoints with `OpenAPIHono` and `createRoute`, pairing each route with Zod schemas and a call to `validateResponse` so OpenAPI docs and runtime validation stay in sync.
- Register routes through `rest/routers/index.ts` and always include the right middleware stack (`publicMiddleware` for OAuth flows, `protectedMiddleware` for authenticated traffic) rather than wiring handlers directly onto the app.
- Keep authorization explicit: require scopes with `withRequiredScope`, update `utils/scopes.ts` when introducing new capabilities, and reuse cache helpers to avoid expensive lookups.
- Use `connectDb()` via the provided middleware/context helpers and rely on `withPrimaryReadAfterWrite` to handle replica lag—never instantiate ad-hoc database clients inside handlers.
- Add TRPC features by extending the domain routers under `trpc/routers` and expose them through `protectedProcedure`/`publicProcedure` so permission checks and primary-db routing stay consistent.
- Share data contracts between REST, TRPC, and the database layer by leaning on the schemas in `src/schemas`; avoid duplicating inline Zod definitions unless they are domain-specific and reused.
- When integrating external systems (Supabase, Resend, Polar, etc.) create lightweight wrappers in `src/services` or `src/utils` so credentials live in one place and can be mocked in tests.
- Surface actionable errors: throw `HTTPException` for REST handlers, `TRPCError` for TRPC procedures, log mismatches via `validateResponse`, and prefer precise messages over generic failures.
- Keep rate limiting, caching, and scope checks in middleware to maintain a clear separation between transport-level concerns and business logic inside the router modules.

## Layout Reference
```text
apps/api/
├── Dockerfile                           # Multi-stage Bun image that prunes workspaces and runs the API on Fly.
├── README.md                            # Local development instructions for the API service.
├── fly-preview.yml                      # Fly Machines preview deployment configuration.
├── fly.toml                             # Production Fly deployment manifest (port, scaling, health checks).
├── migrations/                          # Drizzle SQL migration sources and metadata.
│   ├── 0000_bumpy_chat.sql              # Initial migration snapshot for the API database.
│   └── meta/                            # Drizzle migration bookkeeping.
│       ├── 0000_snapshot.json           # Schema snapshot backing the initial migration.
│       └── _journal.json                # Journal tracking applied migrations.
├── package.json                         # Bun workspace manifest and scripts for the API package.
├── tsconfig.json                        # TypeScript compiler options for the API source.
└── src/                                 # Runtime source code.
    ├── index.ts                         # Hono entrypoint registering REST routers, TRPC, health, and OpenAPI.
    ├── rest/                            # Hono REST surface.
    │   ├── middleware/                  # Shared middleware for REST handlers.
    │   │   ├── auth.ts                  # Validates bearer tokens/API keys, hydrates session and scopes.
    │   │   ├── db.ts                    # Opens a database connection per request and stores it on context.
    │   │   ├── index.ts                 # Exposes public/protected middleware stacks and rate limiting.
    │   │   ├── primary-read-after-write.ts # Routes reads to the primary DB after mutations to avoid replica lag.
    │   │   └── scope.ts                 # Guards routes with required authorization scopes.
    │   ├── routers/                     # REST resources and OpenAPI definitions.
    │   │   ├── bank-accounts.ts         # CRUD routes for team bank accounts.
    │   │   ├── customers.ts             # Customer directory endpoints.
    │   │   ├── documents.ts             # Document management (upload/list/update) endpoints.
    │   │   ├── inbox.ts                 # Shared inbox message APIs.
    │   │   ├── index.ts                 # Aggregates and mounts all REST routers with middleware.
    │   │   ├── invoices.ts              # Invoice lifecycle endpoints.
    │   │   ├── notifications.ts         # Notification subscription APIs.
    │   │   ├── oauth.ts                 # Public OAuth authorization/token routes.
    │   │   ├── reports.ts               # Financial reporting endpoints.
    │   │   ├── search.ts                # REST search entrypoints leveraging filters.
    │   │   ├── tags.ts                  # Tag CRUD APIs.
    │   │   ├── teams.ts                 # Team membership management endpoints.
    │   │   ├── tracker-entries.ts       # Time tracker entry APIs.
    │   │   ├── tracker-projects.ts      # Time tracker project APIs.
    │   │   ├── transactions.ts          # Banking transaction endpoints.
    │   │   └── users.ts                 # User profile and preference endpoints.
    │   └── types.ts                     # Hono context typing shared across REST middleware and routers.
    ├── schemas/                         # Zod schemas shared across REST, TRPC, and OpenAPI.
    │   ├── api-keys.ts                  # Schema for provisioning and returning API keys.
    │   ├── apps.ts                      # Schema for external app records.
    │   ├── bank-accounts.ts             # Bank account query/mutation schemas.
    │   ├── bank-connections.ts          # Bank connection linking/re-auth schemas.
    │   ├── billing.ts                   # Billing plan and payment detail schemas.
    │   ├── customers.ts                 # Customer entity schemas.
    │   ├── document-tag-assignments.ts  # Schemas for tagging documents.
    │   ├── document-tags.ts             # Schemas for document tag definitions.
    │   ├── documents.ts                 # Schemas for document payloads and metadata.
    │   ├── inbox-accounts.ts            # Shared inbox account schemas.
    │   ├── inbox.ts                     # Schemas for messages and mailbox filters.
    │   ├── institutions.ts              # Financial institution reference schemas.
    │   ├── invoice.ts                   # Invoice detail and command schemas.
    │   ├── notification-settings.ts     # User notification preference schemas.
    │   ├── notifications.ts             # Notification payload schemas.
    │   ├── oauth-applications.ts        # OAuth client registration schemas.
    │   ├── oauth-flow.ts                # OAuth authorization and token exchange schemas.
    │   ├── stripe.ts                    # Stripe integration subscription and billing schemas.
    │   ├── reports.ts                   # Report filter/result schemas.
    │   ├── search.ts                    # Search request/response schemas.
    │   ├── short-links.ts               # Schemas for short link management.
    │   ├── tags.ts                      # Generic tag CRUD schemas.
    │   ├── team.ts                      # Team settings and membership schemas.
    │   ├── tracker-entries.ts           # Time entry schemas.
    │   ├── tracker-projects.ts          # Project schemas for time tracking.
    │   ├── transaction-attachments.ts   # Attachment schemas for transactions.
    │   ├── transaction-categories.ts    # Transaction category schemas.
    │   ├── transaction-tags.ts          # Transaction tag assignment schemas.
    │   ├── transactions.ts              # Transaction detail/filter schemas.
    │   └── users.ts                     # User profile and session schemas.
    ├── services/                        # Thin wrappers around external services.
    │   ├── resend.ts                    # Configured Resend email client.
    │   └── supabase.ts                  # Supabase service/admin client helpers.
    ├── trpc/                            # TRPC surface mirroring REST capabilities.
    │   ├── init.ts                      # TRPC context setup, procedures, and middleware wiring.
    │   ├── middleware/                  # TRPC-specific middleware.
    │   │   ├── primary-read-after-write.ts # Shared primary DB routing for TRPC operations.
    │   │   └── team-permission.ts       # Verifies user-team access before protected procedures run.
    │   └── routers/                     # TRPC routers grouped by domain.
    │       ├── _app.ts                  # Root router composing all domain routers.
    │       ├── api-keys.ts              # TRPC procedures for managing API keys.
    │       ├── apps.ts                  # TRPC procedures for external app integrations.
    │       ├── bank-accounts.ts         # TRPC CRUD around bank accounts.
    │       ├── bank-connections.ts      # TRPC handlers for bank connection flows.
    │       ├── billing.ts               # TRPC billing and subscription operations.
    │       ├── customers.ts             # TRPC customer directory operations.
    │       ├── document-tag-assignments.ts # TRPC helpers for linking tags to documents.
    │       ├── document-tags.ts         # TRPC operations for tag definitions.
    │       ├── documents.ts             # TRPC document CRUD/search routines.
    │       ├── inbox-accounts.ts        # TRPC inbox account management.
    │       ├── inbox.ts                 # TRPC mailbox message commands.
    │       ├── institutions.ts          # TRPC access to institution listings.
    │       ├── invoice-template.ts      # TRPC invoice template management.
    │       ├── invoice.ts               # TRPC invoice generation and updates.
    │       ├── notification-settings.ts # TRPC notification preference operations.
    │       ├── notifications.ts         # TRPC notification fetch/upsert procedures.
    │       ├── oauth-applications.ts    # TRPC OAuth client management.
    │       ├── reports.ts               # TRPC reporting queries.
    │       ├── search.ts                # TRPC search flows.
    │       ├── short-links.ts           # TRPC URL shortener operations.
    │       ├── tags.ts                  # TRPC tag CRUD.
    │       ├── team.ts                  # TRPC team configuration operations.
    │       ├── tracker-entries.ts       # TRPC time entry operations.
    │       ├── tracker-projects.ts      # TRPC project operations for tracker.
    │       ├── transaction-attachments.ts # TRPC for managing transaction attachments.
    │       ├── transaction-categories.ts # TRPC transaction category management.
    │       ├── transaction-tags.ts      # TRPC transaction tag operations.
    │       ├── transactions.ts          # TRPC transaction queries and actions.
    │       └── user.ts                  # TRPC user profile/session procedures.
    └── utils/                           # Cross-cutting helpers.
        ├── auth.ts                      # Verifies Supabase JWTs into session objects.
        ├── geo.ts                       # Extracts locale/geo headers from requests.
        ├── health.ts                    # Delegates health checks to the database layer.
        ├── oauth.ts                     # OAuth client credential helper functions.
        ├── parse.ts                     # JSON parsing helper for query/body values.
        ├── stripe.ts                    # Stripe API client instantiation.
        ├── scopes.ts                    # Scope constants and helpers for access control.
        ├── search-filters.ts            # LLM-powered natural language to search filter converter.
        ├── search.ts                    # Utility to build ts_vector search queries.
        └── validate-response.ts         # Response validation/logging helper leveraging Zod.
```
