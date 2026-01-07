- READ ~/Projects/shorts-factory/agent-scripts/AGENTS.MD BEFORE ANYTHING (skip if missing).

# Zeke - Project Architecture & Agent Documentation

## Commands
- **Dev All**: `bun dev` (starts Docker services + all apps with health checks)
- **Dev Single**: `bun run dev:api` / `dev:dashboard` / `dev:website` / `dev:desktop`
- **Stop Apps**: `bun run stop` (stops apps, Docker keeps running)
- **Stop All**: `bun run stop -- --docker` (stops everything including Docker)
- **Build**: `bun run build` (runs the sequential build script across packages and apps)
- **Lint**: `bun run lint` (Biome lint + manypkg check); `bun run format` (Biome formatter)
- **Typecheck**: `bun run typecheck` (runs each app typecheck sequentially)
- **Test All**: Run workspace tests individually (`cd apps/api && bun run test`, etc.)
- **Test Single File**: `cd apps/api && bun test path/to/file.test.ts` (use Bun test runner)
- **Docker Local**: `./deploy/run-local.sh` (builds and runs full stack in Docker)
- **Docker Logs**: `cd deploy && docker compose --profile staging logs -f`
- **Docker Stop**: `cd deploy && docker compose --profile staging down`
- **DB Migrate**: `cd packages/db && bun run migrate:dev` (local) / `migrate` (prod)
- **DB Studio**: `cd packages/db && bun run migrate:studio`

## Architecture
Monorepo using Bun + pnpm workspaces. Apps: **api** (TRPC+REST, port 3003), **dashboard** (Next.js, port 3001), **engine** (content fetching, port 3010), **website** (marketing, port 3000), **desktop** (Tauri). Packages: **db** (Drizzle schema/queries), **jobs** (pg-boss background jobs), **ui** (React components), **auth** (Better Auth with 2FA), **storage** (MinIO), **cache** (Redis), **logger**, **encryption**, etc. Each app/package has its own `AGENTS.md` with detailed context—read those first.

## Services
| Service | Port | Description |
|---------|------|-------------|
| Dashboard | 3001 | Next.js frontend |
| API | 3003 | Hono + TRPC backend |
| Engine | 3010 | Content fetching |
| PostgreSQL | 5435 | Database |
| Redis | 6379 | Cache |
| MinIO | 9000/9001 | Object storage |

## Database
- **Schema**: `packages/db/src/schema.ts` (Drizzle ORM, snake_case DB → camelCase app via `casing: "snake_case"`)
- **Queries**: `packages/db/src/queries/` (shared query functions)
- **Migrations**: From `packages/db`: `bun run migrate:dev` (local), `migrate` (prod). Set `DATABASE_SESSION_POOLER_URL` for prod.
- **Type Gen**: Schema types are generated via Drizzle ORM from `packages/db/src/schema.ts`
- **Local Setup**: `bun dev` starts Docker automatically; for manual: `docker compose up -d postgres minio redis`

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
Research content platform with legacy naming (invoices→articles, transactions→content items). Check `.agents/features/in-progress/mapping-plan.md` for migration plan. Each module has detailed `AGENTS.md`—e.g., `apps/api/AGENTS.md` covers REST/TRPC patterns, AI tools, auth middleware.
