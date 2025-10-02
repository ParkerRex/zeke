# API Agent Preferences

## Coding Preferences
- Build REST endpoints with `OpenAPIHono` and Zod schemas; register routes through `rest/routers/index.ts` with proper middleware stacks for authenticated traffic.
- Use Supabase for authentication; validate bearer tokens in `auth` middleware and hydrate user/team context before protected routes execute.
- Add TRPC features by extending domain routers under `trpc/routers` and exposing them through `protectedProcedure`/`publicProcedure` for consistent permission checks.
- Share data contracts between REST and TRPC by reusing Zod schemas in `src/schemas`; avoid duplicating inline definitions.
- AI tools live in `src/ai/tools/` and implement the tool interface; register new tools in `src/ai/tools/index.ts`.
- AI artifacts (chat titles, follow-up questions, etc.) go in `src/ai/artifacts/` and are called during chat flows.
- Use Drizzle ORM for database operations; connect via middleware/context helpers and rely on `withPrimaryReadAfterWrite` to handle replica lag.
- Redis caching is configured for API keys, users, teams, and permissions (30 min TTL) with replication cache for read-after-write consistency (10 sec TTL).
- Create lightweight wrappers in `src/services` for external systems (Supabase, Resend, Stripe) so credentials live in one place and can be mocked in tests.
- Surface actionable errors: throw `HTTPException` for REST handlers, `TRPCError` for TRPC procedures, and prefer precise messages over generic failures.
- Keep rate limiting, team permissions, and scope checks in middleware to maintain clear separation between transport and business logic.

## Layout Reference
```text
apps/api/
├── Dockerfile                           # Multi-stage Bun image for Fly.io deployment
├── README.md                            # Environment setup and cache implementation docs
├── fly-preview.yml                      # Fly Machines preview deployment configuration
├── fly.toml                             # Production Fly deployment manifest
├── package.json                         # Bun workspace manifest and scripts
├── tsconfig.json                        # TypeScript compiler options
└── src/                                 # Runtime source code
    ├── index.ts                         # Hono entrypoint: REST routers, TRPC, health, CORS
    ├── context.ts                       # Shared context utilities
    ├── ai/                              # AI assistant implementation
    │   ├── artifacts/                   # AI-generated artifacts during chat flows
    │   │   ├── burn-rate.ts             # Burn rate calculation artifact
    │   │   ├── chat-title.ts            # Chat title generation artifact
    │   │   ├── followup-questions.ts    # Follow-up question generation artifact
    │   │   └── get-goals.ts             # Goal extraction artifact
    │   ├── tools/                       # AI tools for research and analysis
    │   │   ├── draft-brief.ts           # Draft brief creation tool
    │   │   ├── get-burn-rate.ts         # Burn rate analysis tool
    │   │   ├── get-story-highlights.ts  # Story highlight extraction tool
    │   │   ├── index.ts                 # Tool registry
    │   │   ├── research-registry.ts     # Research source registry tool
    │   │   ├── summarize-sources.ts     # Source summarization tool
    │   │   ├── tools.test.ts            # Tool tests
    │   │   └── web-search.ts            # Web search tool
    │   ├── utils/                       # AI utility functions
    │   │   ├── generate-followup-questions.ts # Followup question generation
    │   │   ├── get-user-context.ts      # User context extraction
    │   │   └── safe-value.ts            # Safe value extraction helper
    │   ├── context.ts                   # AI context builder
    │   ├── generate-system-prompt.ts    # System prompt generation
    │   ├── generate-title.ts            # Title generation
    │   ├── tool-types.ts                # Tool type definitions
    │   └── types.ts                     # AI types
    ├── auth/                            # Team authentication utilities
    │   └── team.ts                      # Team permission helpers
    ├── rest/                            # Hono REST surface
    │   ├── middleware/                  # REST middleware
    │   │   ├── auth.ts                  # Bearer token validation and session hydration
    │   │   ├── context.ts               # Context setup middleware
    │   │   ├── db.ts                    # Database connection middleware
    │   │   ├── index.ts                 # Middleware exports and composition
    │   │   ├── primary-read-after-write.ts # Primary DB routing after mutations
    │   │   ├── scope.ts                 # Authorization scope checks
    │   │   └── team.ts                  # Team context middleware
    │   ├── routers/                     # REST resources and OpenAPI definitions
    │   │   ├── assistant.ts             # AI assistant endpoints
    │   │   ├── chat.ts                  # Chat endpoints with streaming
    │   │   ├── chat-rate-limit.test.ts  # Chat rate limiting tests
    │   │   ├── chat.test.ts             # Chat endpoint tests
    │   │   ├── highlights.ts            # Highlight CRUD endpoints
    │   │   ├── index.ts                 # REST router aggregator
    │   │   ├── search.ts                # Search endpoints
    │   │   ├── stories.ts               # Story management endpoints
    │   │   ├── tags.ts                  # Tag CRUD endpoints
    │   │   ├── teams.ts                 # Team management endpoints
    │   │   └── users.ts                 # User profile endpoints
    │   └── types.ts                     # Hono context typing
    ├── schemas/                         # Zod schemas shared across REST and TRPC
    │   ├── assistant.ts                 # AI assistant schemas
    │   ├── billing.ts                   # Billing schemas
    │   ├── chat.ts                      # Chat message schemas
    │   ├── highlight.ts                 # Highlight schemas
    │   ├── notification-settings.ts     # Notification preference schemas
    │   ├── notifications.ts             # Notification schemas
    │   ├── search.ts                    # Search schemas
    │   ├── stories.ts                   # Story schemas
    │   ├── stripe.ts                    # Stripe integration schemas
    │   ├── tags.ts                      # Tag schemas
    │   ├── team.ts                      # Team schemas
    │   ├── transaction-attachments.ts   # Transaction attachment schemas
    │   ├── transaction-categories.ts    # Transaction category schemas
    │   ├── transaction-tags.ts          # Transaction tag schemas
    │   └── users.ts                     # User schemas
    ├── security/                        # Security utilities
    │   ├── rbac-validation.test.ts      # RBAC validation tests
    │   └── security-scan.test.ts        # Security scan tests
    ├── services/                        # External service wrappers
    │   ├── resend.ts                    # Resend email client
    │   └── supabase.ts                  # Supabase client helpers
    ├── trpc/                            # TRPC surface
    │   ├── init.ts                      # TRPC context setup and procedure definitions
    │   ├── middleware/                  # TRPC middleware
    │   │   ├── primary-read-after-write.ts # Primary DB routing for TRPC
    │   │   ├── rbac.ts                  # Role-based access control middleware
    │   │   ├── rbac.test.ts             # RBAC tests
    │   │   └── team-permission.ts       # Team access verification
    │   └── routers/                     # TRPC routers by domain
    │       ├── _app.ts                  # Root router composition
    │       ├── assistant.ts             # AI assistant procedures
    │       ├── chats.ts                 # Chat management procedures
    │       ├── highlight.ts             # Highlight procedures
    │       ├── insights.ts              # Insights procedures
    │       ├── insights.test.ts         # Insights tests
    │       ├── pipeline.ts              # Content pipeline procedures
    │       ├── pipeline.test.ts         # Pipeline tests
    │       ├── search.ts                # Search procedures
    │       ├── stories.ts               # Story procedures
    │       ├── stories.test.ts          # Story tests
    │       ├── tags.ts                  # Tag procedures
    │       ├── team.ts                  # Team procedures
    │       ├── user.ts                  # User procedures
    │       ├── workspace.ts             # Workspace procedures
    │       └── workspace.test.ts        # Workspace tests
    └── utils/                           # Cross-cutting helpers
        ├── audit-logger.ts              # Audit logging utilities
        ├── auth.ts                      # Supabase JWT verification
        ├── geo.ts                       # Locale/geo header extraction
        ├── health.ts                    # Database health checks
        ├── oauth.ts                     # OAuth helper functions
        ├── parse.ts                     # JSON parsing utilities
        ├── scopes.ts                    # Authorization scope definitions
        ├── search-filters.ts            # LLM-powered natural language search
        ├── search.ts                    # ts_vector search query builder
        ├── streaming-utils.ts           # Streaming response utilities
        ├── stripe.ts                    # Stripe API client
        └── validate-response.ts         # Zod response validation
```

## Key Architecture Patterns

### REST + TRPC Dual Surface
- REST endpoints expose OpenAPI-documented routes for external integrations
- TRPC provides type-safe procedures for internal Next.js app consumption
- Both share Zod schemas from `src/schemas/` for consistency

### AI Assistant Integration
- Chat endpoints support streaming responses via Server-Sent Events
- AI tools in `src/ai/tools/` are called during chat conversations
- AI artifacts generate metadata (titles, follow-up questions) asynchronously
- Tools: `web-search`, `draft-brief`, `summarize-sources`, `get-story-highlights`, `research-registry`
- Artifacts: `chat-title`, `followup-questions`, `burn-rate`, `get-goals`

### Authentication & Authorization
- Supabase JWT bearer tokens validated in `auth.ts` middleware
- User/team context hydrated from Redis cache (30 min TTL)
- Team permissions checked via `team-permission.ts` middleware for protected routes
- RBAC system enforces role-based access control

### Database & Caching
- Drizzle ORM for all database operations
- Primary/replica setup with `withPrimaryReadAfterWrite` for read-after-write consistency
- Redis caching for API keys, users, teams, permissions (30 min TTL)
- Replication cache tracks recent mutations (10 sec TTL) to route reads to primary

### Core Domains
- **Stories**: Research projects with sources and insights
- **Chat**: AI assistant conversations with streaming
- **Search**: Natural language search with LLM-powered filters
- **Highlights**: Story highlights and annotations
- **Tags**: Tagging system for stories and content
- **Workspace**: Workspace management and settings
- **Pipeline**: Content ingestion pipeline from engine
- **Insights**: Analytics and insights generation
