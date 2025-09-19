# Database Stack Overview

This project mixes direct Postgres access through Drizzle with Supabase's hosted services. If you're building something similar, this doc captures how the pieces fit together.

## Supabase usage at a glance

Supabase still powers auth, session handoffs, and object storage. The generated Supabase client types keep those calls safe:

- `packages/supabase/src/client/client.ts` wraps `createBrowserClient<Database>()` for browser usage.
- `packages/supabase/src/client/server.ts` does the same on the server (and exposes an `admin` option for service-key access).
- `packages/supabase/src/client/job.ts` bootstraps background workers with `createClient<Database>()`.
- React helpers like `packages/supabase/src/queries/cached-queries.ts` call `supabase.auth.getSession()` and benefit from the typed response.
- Storage utilities in `packages/supabase/src/utils/storage.ts` accept a `SupabaseClient<Database>` so uploads/downloads throw typed errors instead of `any`.

Anywhere the app imports `@zeke/supabase/*` (for example, `apps/dashboard/src/components/github-sign-in.tsx`) it receives a fully typed Supabase client.

## How Drizzle queries are organised

All schema and query logic lives in `packages/db`:

- `packages/db/src/schema.ts` declares tables, enums, custom column types, and relations using Drizzle's `pgTable`, `pgEnum`, etc.
- `packages/db/src/client.ts` builds the primary Postgres connection plus per-region replicas and exports `type Database = Awaited<ReturnType<typeof connectDb>>;`.
- Query helpers are grouped by domain under `packages/db/src/queries/*.ts` and re-exported from `packages/db/src/queries/index.ts`. Each helper accepts the typed `Database` instance, so return values and parameters stay inferred.
- Application code imports from `@zeke/db/queries` to keep SQL in one place and avoid duplicating schema knowledge.

## Type generation and CI/CD flow

- Supabase types are generated with the CLI: `pnpm --filter @zeke/supabase db:generate`. The script in `packages/supabase/package.json` runs `supabase gen types … > src/types/db.ts`. Commit the updated file whenever the hosted Supabase schema changes.
- Drizzle migrations live under `packages/db/migrations`. Use Drizzle Kit (configured via `packages/db/drizzle.config.ts`) to generate migrations against the same schema that the app code imports.
- CI pipelines run against the committed TypeScript artifacts—nothing is generated on-the-fly in deployment. As long as migrations run before new code deploys, both the Drizzle client and the Supabase client share an up-to-date view of the database.

With this setup you get the ergonomics of Drizzle for first-party SQL plus typed Supabase clients wherever you need auth, REST, or storage access.
