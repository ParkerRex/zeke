# Engine Agent Preferences

## Coding Preferences
- Treat `apps/engine` as a Cloudflare Worker first: keep handlers stateless, favor pure helpers, and rely on typed bindings instead of `process.env` inside the runtime.
- Model every route with `OpenAPIHono` plus `zod` schemas; reuse fragments from `@engine/common/schema` so OpenAPI output stays consistent.
- Go through the `Provider` facade from routes; add providers by mirroring the `*-api.ts`, `*-provider.ts`, `transform.ts`, `types.ts`, and test pattern already in the tree.
- Translate external payloads inside `transform.ts` files, keep HTTP wiring inside `*-api.ts`, and lean on shared helpers such as `paginate`, `withRetry`, and provider specific `utils.ts` modules.
- Normalize errors with `ProviderError` and `createErrorResponse`; log via `logger` and emit canonical error codes so API consumers can branch safely.
- Stick to strict TypeScript: explicit return types, narrow unions, and private fields for encapsulated state; avoid `any` and cast sparingly.
- Cover behavioral changes with `bun:test`; keep snapshots deterministic by scrubbing volatile fields before assertions and add focused unit tests for new helpers.
- Keep task scripts Bun friendly and idempotent: load secrets from `.env-example`, reuse shared logo helpers, and surface actionable logging only when work is done.
- When tweaking infrastructure, update `wrangler.toml`, `.dev.vars-example`, and relevant schemas together so staging and production remain in sync.

## Layout Guide
```
apps/engine/                              # Cloudflare Worker that brokers data providers for Midday
├── .dev.vars-example                    # Sample wrangler dev vars for local worker runs
├── .gitignore                           # Ignore rules for the engine workspace
├── README.md                            # Quick CLI notes for logo sync and institution import tasks
├── AGENTS.md                            # Preferred practices and layout guide for agents
├── package.json                         # Bun/Hono package config, scripts, and dependency manifest
├── tasks/                               # Bun task scripts for offline ingestion and asset syncs
│   ├── .env-example                     # Example env vars required by task scripts
│   ├── download-gocardless.ts           # Fetches and stores GoCardLess institution logos to disk
│   ├── download-teller.ts               # Downloads Teller institution logos via CDN helper
│   ├── get-institutions.ts              # Aggregates institutions from providers for Typesense loading
│   ├── import.ts                        # Pushes institution documents into Typesense for search
│   └── utils.ts                         # Shared helpers for tasks (popularity, logo saves, batching)
├── tsconfig.build.json                  # Build-only TS config emitting declarations into dist/
├── tsconfig.json                        # Base TS config with path aliases and Cloudflare/Bun types
├── wrangler.toml                        # Cloudflare Worker deployment config (routes, KV, R2, AI)
└── src/                                 # Engine runtime source: Hono app, routes, providers, utils
    ├── index.ts                         # Bootstraps OpenAPIHono app, wires middleware, mounts routes
    ├── middleware.ts                    # Auth, security headers, and logging middlewares for the app
    ├── common/                          # Shared types and schemas reused across routes/providers
    │   ├── bindings.ts                  # Typed Cloudflare bindings available to the worker runtime
    │   └── schema.ts                    # Reusable zod schemas (errors, headers, provider enum)
    ├── providers/                       # Provider facade plus per-provider implementations
    │   ├── index.ts                     # Provider aggregator that routes calls to concrete providers
    │   ├── interface.ts                 # Contract that all provider classes must satisfy
    │   ├── types.ts                     # Cross-provider request/response shapes and provider enums
    │   ├── enablebanking/               # EnableBanking specific API client, transforms, and tests
    │   │   ├── __snapshots__/           # Bun snapshot fixtures for EnableBanking transforms
    │   │   │   └── transform.test.ts.snap  # Snapshot output validating EnableBanking transform shapes
    │   │   ├── enablebanking-api.ts     # HTTP client for EnableBanking endpoints and sessions
    │   │   ├── enablebanking-provider.ts # EnableBanking implementation of the Provider interface
    │   │   ├── transform.test.ts        # Tests covering EnableBanking data transformation logic
    │   │   ├── transform.ts             # Maps EnableBanking payloads into engine domain models
    │   │   └── types.ts                 # EnableBanking specific request and response types
    │   ├── gocardless/                  # GoCardLess provider wrapper with helpers and transforms
    │   │   ├── __snapshots__/           # Bun snapshot fixtures for GoCardLess transforms
    │   │   │   └── transform.test.ts.snap  # Snapshot data for GoCardLess transform expectations
    │   │   ├── gocardless-api.ts        # HTTP client for GoCardLess API operations
    │   │   ├── gocardless-provider.ts   # GoCardLess backed implementation of the Provider contract
    │   │   ├── transform.test.ts        # Tests asserting GoCardLess to domain transformations
    │   │   ├── transform.ts             # Converts GoCardLess payloads into engine friendly shapes
    │   │   ├── types.ts                 # GoCardLess specific type definitions
    │   │   ├── utils.test.ts            # Unit tests for GoCardLess helper functions
    │   │   └── utils.ts                 # Helper logic (error parsing, consent windows, history caps)
    │   ├── plaid/                       # Plaid provider implementation and support utilities
    │   │   ├── __snapshots__/           # Bun snapshot fixtures for Plaid transforms
    │   │   │   └── transform.test.ts.snap  # Snapshot data verifying Plaid transformation output
    │   │   ├── plaid-api.ts             # HTTP client wrapping Plaid SDK calls and token exchange
    │   │   ├── plaid-provider.ts        # Plaid backed Provider implementation
    │   │   ├── transform.test.ts        # Tests ensuring Plaid payload normalization
    │   │   ├── transform.ts             # Maps Plaid payloads into internal account and txn shapes
    │   │   ├── types.ts                 # Plaid specific type helpers and request definitions
    │   │   └── utils.ts                 # Plaid error inspection helper around Axios responses
    │   └── teller/                      # Teller provider wrapper handling MTLS and transforms
    │       ├── __snapshots__/           # Bun snapshot fixtures for Teller transforms
    │       │   └── transform.test.ts.snap  # Snapshot output validating Teller transformations
    │       ├── teller-api.ts            # HTTP client that calls Teller endpoints using MTLS fetcher
    │       ├── teller-provider.ts       # Teller specific Provider implementation
    │       ├── transform.test.ts        # Tests covering Teller transformation behaviour
    │       ├── transform.ts             # Normalizes Teller payloads into engine friendly shapes
    │       ├── types.ts                 # Teller type definitions for API responses and transforms
    │       └── utils.ts                 # Teller error helper detecting provider error payloads
    ├── routes/                          # Hono route modules grouped by domain resource
    │   ├── accounts/                    # Account retrieval and deletion endpoints
    │   │   ├── index.ts                 # Account handlers wired through the Provider facade
    │   │   └── schema.ts                # Zod schemas for account queries and responses
    │   ├── auth/                        # OAuth and link flows for third party providers
    │   │   ├── index.ts                 # Auth endpoints orchestrating Plaid, GoCardLess, EnableBanking
    │   │   └── schema.ts                # Zod schemas for auth route bodies, params, and responses
    │   ├── connections/                 # Connection status and deletion endpoints
    │   │   ├── index.ts                 # Connection handlers that fan out to the Provider facade
    │   │   └── schema.ts                # Zod schemas describing connection params and payloads
    │   ├── health/                      # Health checks for providers and search infrastructure
    │   │   ├── index.ts                 # Aggregates provider and Typesense health status
    │   │   └── schema.ts                # Zod schema for health response payload
    │   ├── institutions/                # Institution discovery and usage tracking routes
    │   │   ├── index.ts                 # Institution search and popularity update handlers
    │   │   ├── schema.ts                # Zod schemas for institution query params and responses
    │   │   └── utils.ts                 # Helpers for aggregating institutions across providers
    │   ├── rates/                       # Currency rate retrieval endpoint
    │   │   ├── index.ts                 # Returns cached remote FX rates with error handling
    │   │   └── schema.ts                # Zod schema for rates endpoint response format
    │   └── transactions/                # Transaction retrieval endpoints
    │       ├── index.ts                 # Transaction handlers routed through the Provider facade
    │       └── schema.ts                # Zod schemas for transaction queries and payloads
    └── utils/                           # Cross cutting helpers for providers and routes
        ├── account.test.ts              # Tests for account type inference helper
        ├── account.ts                   # Maps provider account types to internal enum values
        ├── countries.ts                 # Country constants grouped by provider and merged lists
        ├── error.ts                     # ProviderError class and shared error response builder
        ├── logo.ts                      # Logo URL builder and file extension helper
        ├── logger.ts                    # Thin wrapper around console logging for injection
        ├── paginate.ts                  # Generic pagination helper for batched provider fetches
        ├── rates.ts                     # Fetches and normalizes FX rates from CDN API
        ├── retry.ts                     # Configurable retry helper with delay and abort hooks
        └── search.ts                    # Typesense client builder and health check helper
```
