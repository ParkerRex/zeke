# Agents Guide

This document orients coding agents to the ZEKE codebase so they can work effectively and safely.

## Project Overview

ZEKE is an AI‑powered news intelligence platform that:

- Ingests items from sources (e.g., RSS) into a PostgreSQL/Supabase database
- Extracts and normalizes content, then analyzes it with LLMs
- Serves stories and insights via a Next.js app

Key components:

- Next.js app (TypeScript, React 19, Tailwind, shadcn/ui) in `src/`
- Background worker (TypeScript, pg-boss) in `worker/` for ingestion, extraction, analysis
- Supabase/PostgreSQL with pgvector for storage and embeddings (see `supabase/`)

Primary goals right now: keep the pipeline healthy, improve analysis quality, and expand sources while maintaining reliable dev/test flows.

## Build & Run Commands

Root (web + tooling):

- Dev (full stack): `pnpm run dev`
- Dev (Next only): `pnpm run dev:next`
- Dev (Worker only): `bash worker/scripts/deploy-local-worker.sh`
- Build web: `pnpm run build`
- Start web: `pnpm run start`
- Typecheck all: `pnpm run typecheck`
- Lint all: `pnpm run lint`
- CI validate: `pnpm run ci`
- Stop services: `pnpm run stop`

Worker (from `worker/`):

- Dev: `pnpm run dev`
- Build: `pnpm run build`
- Start: `pnpm run start`
- Lint (type check): `pnpm run lint`

Database & types:

- Start Supabase locally: `npx supabase start`
- Create migration: `pnpm migration:new <slug>`
- Apply migrations (local): `pnpm run db:migrate`
- Reset DB (local): `pnpm run db:reset`
- Generate types (local): `pnpm run types:generate`

Prereqs: Node 20+, pnpm, Supabase CLI (+ Docker for local DB).

## Testing Instructions

Fast checks:

- Type safety: `pnpm run typecheck` (root + worker)
- Linting: `pnpm run lint` (ESLint for web; TS no‑emit for worker)

End‑to‑end dev test:

1. One‑command setup & start: `pnpm run dev`
2. Visit web: http://localhost:3000 and Supabase Studio: http://127.0.0.1:54323

Scripted pipeline check:

- Root pipeline smoke test: `pnpm run test:pipeline` (runs `scripts/test-pipeline.sh`)

DB/Worker connectivity tests:

- Root test suite: `pnpm run test` (typecheck + DB up + worker checks)
- Worker tests: `pnpm run test:worker` (connection + transcription scripts)

Notes:

- Local tests expect Supabase to be running. Use `pnpm run dev:setup` or `npx supabase start` first if needed.
- Some tests read env from `.env.development` or `worker/.env.development`.

## Code Style Guidelines

General:

- TypeScript strict across app and worker; prefer `export type`/`import type`
- React 19 + Next.js App Router; keep server‑only logic out of client components
- Tailwind CSS with shadcn/ui; prefer utility classes and existing primitives
- Keep imports sorted and unused code removed (CI enforces lint/type checks)

Formatting & linting:

- Editor formatting: Biome (see `biome.jsonc` and `.vscode/settings.json`)
- Lint: `next lint` for the web app; worker uses TS no‑emit as lint gate
- Tailwind class sorting via Prettier plugin is present; follow existing patterns

Conventions (practical hints):

- Use `src/utils/get-env-var.ts` to access required env vars safely
- Organize by layer first, domain second (no barrels):
  - Queries: `supabase/queries/<area>/<verb-noun>.ts` (import with `@db/…`)
  - Mutations: `supabase/mutations/<area>/<verb-noun>.ts` (import with `@db/…`)
  - Actions: `src/actions/<area>/<verb-noun>.ts`
  - Components: `src/components/<area>/*` (shared primitives remain under `src/components/ui`)
- Keep API routes and server logic typed; avoid `any` and non‑null assertions

For detailed heuristics, see `.github/copilot-instructions.md` and existing code patterns.

## URL State with `nuqs`

Goal: Prefer URL as the source of truth for shareable UI state and use `nuqs` for reading/writing query params consistently.

- Parsers live in `src/libs/nuqs.ts` (create if missing). Add and reuse:
  - `qParser = parseAsString.withDefault('')`
  - `kindParser = parseAsStringEnum(['all','youtube','arxiv','podcast','reddit','hn','article']).withDefault('all')`
  - `panelParser = parseAsBoolean.withDefault(true)`
  - Optional: `tabsParser` (string array with size limit), `viewParser` for simple enums
- Usage pattern in client components:
  - `const [q, setQ] = useQueryState('q', qParser)`
  - `const [panel, setPanel] = useQueryState('panel', panelParser)`
  - For text inputs, debounce `setQ` (~250ms) to reduce history churn.
- Do:
  - Keep navigations as `router.push/replace` only for path changes (e.g., `/stories/[id]`)
  - Use `nuqs` for UI state (filters, panel toggles) instead of manual `useSearchParams` + `router.replace`
  - Validate with enum parsers and provide sensible defaults
- Don’t:
  - Write ad‑hoc effects that mirror state to the URL when `nuqs` can manage it
  - Store shareable state only in `localStorage`; use URL first (keep localStorage as a fallback)
- SSR notes: `useQueryState` is client‑side; keep `nuqs` usage in client components.

## Data Layers: Queries, Mutations, Actions

Keep data access boring and obvious. Names reflect what each file does and where it belongs.

- Queries (read-only DB):
  - Path: `supabase/queries/<area>/<verb-noun>.ts`
  - Import: `@db/queries/<area>/<verb-noun>`
  - Examples: `stories/get-story-by-id.ts`, `stories/list-stories.ts`, `pricing/get-products.ts`
  - Rules: No side effects, no 3rd‑party calls, just typed Supabase reads.
- Mutations (DB writes):
  - Path: `supabase/mutations/<area>/<verb-noun>.ts`
  - Import: `@db/mutations/<area>/<verb-noun>`
  - Examples: `pricing/upsert-product.ts`, `pricing/soft-delete-product.ts`
  - Rules: No 3rd‑party calls; return typed results/IDs; parameterized inputs.
- Actions (business logic):
  - Path: `src/actions/<area>/<verb-noun>.ts`
  - Examples: `pricing/create-checkout-session.ts`, `account/upsert-user-subscription.ts`
  - Rules: May call queries/mutations and 3rd‑party APIs; enforce domain rules; side effects allowed.

Conventions

- One exported function per file; filename matches the function name (kebab-case for file, camelCase for function).
- Strongly type inputs/outputs; return domain types; throw only on unexpected conditions.
- No barrel files (no `index.ts` re-exports). Import from concrete module paths, e.g. `@db/queries/stories/list-stories`.

Vanilla DB access patterns

- Use `createSupabaseServerClient()` when you need user-scoped reads/writes in server components or route handlers (respects RLS and session cookies).
- Use `supabaseAdminClient` only in server actions/route handlers where service-role privileges are required (never import into client components).
- Worker processes (Node/pg) should use direct PG queries or the admin client equivalents; they do not rely on `@db` queries.

## Project Organization (Layer‑First)

We use a layer‑first (aka by‑type) structure, with domain (area) subfolders for clarity. This keeps “all X in one place” easy to find and grep.

- Queries (read‑only DB): `supabase/queries/<area>/<verb-noun>.ts`
- Mutations (DB writes): `supabase/mutations/<area>/<verb-noun>.ts`
- Actions (business logic): `src/actions/<area>/<verb-noun>.ts`
- Components:
  - Shared primitives: `src/components/ui/*`
  - Domain components: `src/components/<area>/*` (names align with `<area>` used in queries/mutations/actions)

Example

```
src/
  actions/
    pricing/create-checkout-session.ts
    account/get-or-create-customer.ts
  components/
    pricing/price-card.tsx
    pricing/pricing-section.tsx
    account/account-menu.tsx
    stories/...
    ui/*
supabase/
  queries/
    stories/list-stories.ts
    stories/get-story-by-id.ts
    stories/get-share-snapshot.ts
    account/get-session.ts
    pricing/get-products.ts
  mutations/
    pricing/upsert-product.ts
    pricing/upsert-price.ts
    pricing/soft-delete-product.ts
```

Notes

- Names say exactly what they do (verbs): `get-story-by-id`, `list-stories`, `upsert-product`.
- Actions may compose queries, mutations, and 3rd‑party SDKs; queries/mutations must not.
- Avoid barrels; import from concrete files to keep intent explicit and navigation simple.

## Security Considerations

- Secrets: never commit `.env*` files. Use `.env.development` (root) and `worker/.env.development` locally
- Supabase keys: `NEXT_PUBLIC_*` are public; keep `SUPABASE_SERVICE_ROLE_KEY` server‑only
- OpenAI/third‑party keys: server‑only, do not expose in client bundles
- Validation: treat source URLs and external content as untrusted; validate and time out fetches
- Data access: guard server routes and worker tasks with explicit checks; avoid leaking PII in logs
- Env access: use `getEnvVar(...)` so missing critical config fails fast

If in doubt, prefer server‑side execution for anything that touches secrets or the database, and avoid logging credentials or raw tokens.

## Supabase Best Practices

- Realtime: prefer `broadcast` with private channels, granular topics, and DB triggers over `postgres_changes`. Follow naming, cleanup, and auth patterns outlined in docs. See `docs/rules/use-realtime.md`.
- Postgres style: use snake_case, explicit schemas, clear naming, consistent formatting, and comments. See `docs/rules/postgres-style-guide.md`.
- DB functions: default to `SECURITY INVOKER`, set `search_path = ''`, fully qualify object names, and favor `IMMUTABLE`/`STABLE` where possible; use triggers when appropriate. See `docs/rules/create-db-functions.md`.

## Migrations & Ordering

- **Naming**: Files are timestamp-prefixed `YYYYMMDDHHMMSS_description.sql` so lexical order = apply order.
- **Create**: Use `pnpm migration:new <slug>` (e.g., `pnpm migration:new add_admin_flag`). Do not create files manually.
- **Apply Locally**: `pnpm run db:migrate` (runs up against local DB) and then `pnpm run types:generate`.
- **Out-of-Order Avoidance**: Never backdate a migration. If you created one with an old timestamp, delete and recreate it with a new timestamp before it’s merged/applied.
- **If Already Committed/Applied**:
  - Local only: remove the bad file and re-create with `migration:new`, or run `pnpm run db:reset` to rebuild from a clean slate.
  - Shared envs: do not rename existing migrations. Add a forward “fix” migration instead to correct state.
- **Remote/Linked**: Use `pnpm migration:up` for linked projects when applying remotely; avoid editing past migrations.
- **Squashing (pre‑launch only)**: You can squash all migrations into one baseline when there’s no prod data:
  1. Make sure all migrations are applied locally and remotely (if any).
  2. Create a new baseline: `pnpm migration:new baseline_all`
  3. Copy the full, current schema into this new file: include DDL from all prior migrations and relevant `supabase/sql/*.sql` (e.g., seeds optional; avoid hardcoded passwords).
  4. Remove older migration files (git delete), keep only the baseline.
  5. Reset local DB: `pnpm run db:reset` to validate the baseline builds cleanly.
  6. Remote/linked: prefer creating a fresh remote database (or resetting a non‑prod project), then run `pnpm migration:up` so only the baseline exists remotely.
  7. Replace hardcoded credentials (e.g., worker role password) with env‑driven steps — see below.

### Worker Role Credential Hygiene

- Avoid hardcoding DB user passwords in migrations. For local dev, you can:
  - Create the role without password in SQL, then set the password via `psql` using env vars, or
  - Use a placeholder and run `ALTER ROLE worker PASSWORD '<from env>'` as a separate step.
- Worker connects via `DATABASE_URL` using `WORKER_DB_PASSWORD` from `worker/.env.development` or `.env.production`.
- Document the variable in `.env.example` and ensure no secrets are committed.

Example (local):

- Set `WORKER_DB_PASSWORD` in `worker/.env.development`.
- After `npx supabase start`, run:
  - `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "ALTER ROLE worker WITH PASSWORD '$(printf %s "$WORKER_DB_PASSWORD")';"`
- Verify: `psql ... -c "\du"` shows `worker` with login.
