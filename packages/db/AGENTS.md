# DB Package

## Coding Preferences

- Always obtain database handles through `connectDb()` (`client.ts`) so read queries can fall back to replicas; call `db.usePrimaryOnly()` or `transaction()` when a workflow must pin to the primary.
- Background jobs should create their own isolated pool via `createJobDb()` and call `disconnect()` once work completes to keep Supabase pool usage low.
- Keep query modules single-purpose: export functions that accept the typed `Database`, encapsulate their filters/sorting, and return predictable shapes.
- Compose SQL with Drizzle helpers (`eq`, `and`, `sql`, FTS helpers, etc.); reach for raw SQL only when there is no builder equivalent and document the rationale inline.
- Select only the columns you need and push business logic out of queries—let callers shape DTOs so query files stay focused on data access.
- Update `schema.ts` for every structural change (enums, relations, indexes) and keep column names in `snake_case` to match Postgres conventions.
- Re-export new query modules from `queries/index.ts` and keep the list alphabetized to simplify discovery.
- Define parameter/return types near their usage, prefer `type` aliases, and avoid `any`; lean on `Awaited<ReturnType<...>>` helpers for shared shapes.
- Shared logic that spans queries lives in `src/utils`; keep those helpers pure when possible and use `@midday/logger` for observability.
- Expand or adjust fixtures in `src/test` whenever query behavior changes; keep the golden dataset authoritative for transaction matching flows.
- Use the `@db/*` path alias provided in `tsconfig.json`, sort imports by external vs. internal modules, and leave TODOs with context plus owner initials.

## Layout Cheatsheet

```
packages/db/
├── drizzle.config.ts                         # Drizzle CLI configuration for migrations (reads DATABASE_SESSION_POOLER).
├── package.json                              # Package manifest and scripts for the database layer.
├── tsconfig.json                             # TypeScript configuration extending the shared base with the @db alias.
└── src/                                      # Source modules for runtime access, schema, tests, and helpers.
    ├── client.ts                             # Builds the primary+replica drizzle client used across the app tier.
    ├── job-client.ts                         # Creates a single-connection drizzle client tailored for job runners.
    ├── replicas.ts                           # Wraps a drizzle client with replica-aware read helpers and primary pinning.
    ├── schema.ts                             # Canonical Drizzle schema: enums, custom types, tables, indexes, relations.
    ├── queries/                              # Domain-specific data access modules.
    │   ├── activities.ts                     # Inserts and fetches activity feed records.
    │   ├── api-keys.ts                       # CRUD helpers for API key records and hashing.
    │   ├── apps.ts                           # Persistence helpers for third-party app connections.
    │   ├── bank-accounts.ts                  # Queries for bank account metadata and linkage.
    │   ├── bank-connections.ts               # Accessors for bank connection lifecycle/state.
    │   ├── customer-analytics.ts             # Aggregations that power customer analytics dashboards.
    │   ├── customers.ts                      # Core customer record CRUD and lookups.
    │   ├── document-tag-assignments.ts       # Maps documents to tag assignments.
    │   ├── document-tag-embedings.ts         # Manages tag embedding records (typo retained to match schema).
    │   ├── document-tags.ts                  # CRUD helpers for document tag definitions.
    │   ├── documents.ts                      # Retrieval and mutation helpers for document records.
    │   ├── exhange-rates.ts                  # Exchange rate lookups and refresh utilities.
    │   ├── inbox-accounts.ts                 # Handles inbox account connection metadata.
    │   ├── inbox-embeddings.ts               # Stores and queries inbox vector embeddings.
    │   ├── inbox-matching.ts                 # Matching logic for inbox messages to transactions.
    │   ├── inbox.ts                          # Core inbox message queries and status updates.
    │   ├── index.ts                          # Barrel file re-exporting every query module.
    │   ├── invoice-templates.ts              # Accessors for stored invoice template definitions.
    │   ├── invoices.ts                       # Invoice CRUD, status transitions, and lookup helpers.
    │   ├── notification-settings.ts          # Reads and writes per-user notification preferences.
    │   ├── oauth-applications.ts             # Data access for OAuth application registrations.
    │   ├── oauth-flow.ts                     # Persists OAuth flow state and tokens.
    │   ├── pipeline.ts                       # Pipeline job and source management queries.
    │   ├── platform.ts                       # Platform configuration and settings queries.
    │   ├── playbooks.ts                      # Playbook CRUD and execution queries.
    │   ├── raw-items.ts                      # Raw data item storage and retrieval.
    │   ├── reports.ts                        # Aggregated financial report queries.
    │   ├── search.ts                         # Full-text/semantic search helpers across entities.
    │   ├── short-links.ts                    # CRUD for short link resources.
    │   ├── stories.ts                        # Story content and metadata queries.
    │   ├── tags.ts                           # Generic tag definitions and utilities beyond documents.
    │   ├── teams.ts                          # Team membership and settings queries.
    │   ├── tracker-entries.ts                # Time/tracker entry persistence helpers.
    │   ├── tracker-projects.ts               # Project-level tracker queries.
    │   ├── transaction-attachments.ts        # Attachment metadata storage and retrieval.
    │   ├── transaction-categories.ts         # Category CRUD and helpers.
    │   ├── transaction-category-embeddings.ts # Persists category embedding vectors.
    │   ├── transaction-embeddings.ts         # Handles embeddings tied directly to transactions.
    │   ├── transaction-enrichment.ts         # Stores enrichment results (e.g., merchant data).
    │   ├── transaction-matching.ts           # Algorithms and queries for matching transactions.
    │   ├── transaction-tags.ts               # Mapping between transactions and tags.
    │   ├── transactions.ts                   # Core transaction list/detail queries and filters.
    │   ├── user-invites.ts                   # Invitation creation and lookup helpers.
    │   ├── users-on-team.ts                  # Team/user association queries.
    │   └── users.ts                          # User profile and authentication-related queries.
    ├── test/                                 # Integration and golden tests for transaction logic.
    │   ├── golden-dataset.ts                 # Shared fixture data feeding golden tests.
    │   ├── transaction-matching.golden.test.ts      # Snapshot test for matching expectations.
    │   ├── transaction-matching.integration.test.ts # End-to-end validation of matching flows.
    │   ├── transaction-matching.test.ts      # Unit-level tests around matching helpers.
    │   └── validate-golden-dataset.ts        # Ensures the golden dataset stays internally consistent.
    └── utils/                                # Shared helpers consumed by query modules.
        ├── api-keys.ts                       # Random API key generation and format validation.
        ├── embeddings.ts                     # Category embedding generation, batching, and persistence helpers.
        ├── health.ts                         # Lightweight connectivity checks against the database.
        ├── log-activity.ts                   # Convenience helpers for writing activity records.
        ├── search-query.ts                   # Builds normalized search strings for FTS queries.
        └── transaction-matching.ts           # Reusable scoring and comparison logic for transaction matching.
```
