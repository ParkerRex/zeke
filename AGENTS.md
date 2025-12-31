# Zeke - Project Architecture & Agent Documentation

## Commands
- **Build**: `bun run build` (runs the sequential build script across packages and apps)
- **Lint**: `bun run lint` (Biome lint + manypkg check); `bun run format` (Biome formatter)
- **Typecheck**: `bun run typecheck` (runs each app typecheck sequentially)
- **Test All**: Run workspace tests individually (`cd apps/api && bun run test`, etc.)
- **Test Single File**: `cd apps/api && bun test path/to/file.test.ts` (use Bun test runner)
- **Dev All**: `bun dev` (starts Redis and all apps via the orchestration scripts)
- **Dev Single**: `bun run dev:api` / `dev:dashboard` / `dev:website` / `dev:desktop`
- **Docker Local**: `./deploy/run-local.sh` (builds and runs full stack in Docker)
- **Docker Logs**: `cd deploy && docker compose --profile staging logs -f`
- **Docker Stop**: `cd deploy && docker compose --profile staging down`
- **DB Migrate**: `cd packages/db && bun run migrate:dev` (local) / `migrate` (prod)
- **DB Studio**: `cd packages/db && bun run migrate:studio`

## Architecture
Monorepo using Bun + pnpm workspaces. Apps: **api** (TRPC+REST, port 3003), **dashboard** (Next.js), **engine** (Cloudflare Worker), **website** (marketing), **desktop** (Electron). Packages: **db** (Drizzle schema/queries), **jobs** (Trigger.dev), **ui** (React components), **supabase** (auth client), **cache** (Redis), **logger**, **encryption**, etc. Each app/package has its own `.agents.md` with detailed context—read those first.

## Database
- **Schema**: `packages/db/src/schema.ts` (Drizzle ORM, snake_case DB → camelCase app via `casing: "snake_case"`)
- **Queries**: `packages/db/src/queries/` (shared query functions)
- **Migrations**: From `packages/db`: `bun run migrate:dev` (local), `migrate` (prod). Set `DATABASE_SESSION_POOLER_URL` for prod.
- **Type Gen**: From `packages/supabase`: `bun run db:generate` (pulls types from Supabase → `src/types/db.ts`)
- **Local Setup**: `cd apps/api && supabase start` (runs Postgres on :54322); enable vector extension: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"`

## Code Style
- **Formatter**: Biome (2 spaces, auto organizeImports). Run `bun run format` before committing.
- **Linter**: Biome with `recommended: true`. Allows `noNonNullAssertion`, `noExplicitAny`, disables `useExhaustiveDependencies`.
- **TypeScript**: Strict mode, NodeNext modules, target ES2022. Base config: `@zeke/tsconfig/base.json`.
- **Naming**: camelCase for variables/functions, PascalCase for components/types. DB columns are snake_case but mapped to camelCase in app code.
- **Imports**: Workspace packages via `@zeke/*`. Prefer importing from `@zeke/db/queries`, `@zeke/auth`, `@zeke/storage`, etc.
- **Errors**: Throw `HTTPException` (REST), `TRPCError` (TRPC procedures). Use specific error messages.
- **Tailwind**: Use `size-*` (e.g., `size-4`) instead of `w-* h-*` when width/height are equal (per `.cursor/rules/tailwind.mdc`).

## Testing
Uses **Bun test runner** (`bun:test` imports). Run single test: `cd apps/api && bun test src/path/to/file.test.ts`. Tests use `describe`, `it`, `expect`, `beforeAll`, `beforeEach` from `bun:test`.

## Context Notes
Forked from Midday (finance app); still contains some legacy naming (invoices→articles, transactions→content items). Check `.agents/features/in-progress/mapping-plan.md` for migration plan. Each module has detailed `.agents.md`—e.g., `apps/api/AGENTS.md` covers REST/TRPC patterns, AI tools, auth middleware.
