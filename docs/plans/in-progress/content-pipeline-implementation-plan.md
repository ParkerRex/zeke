# Content Pipeline Implementation Plan

## Goal
Realign the database schema and worker pipeline with the proposed content intelligence data flow by standardising naming (`raw_items → contents → stories`), centralising data access through Drizzle, and updating worker services to rely on the shared schema. This plan excludes OpenAPI/TRPC work.

## Phase 1 – Schema Alignment (Drizzle Source of Truth)
- Update `packages/db/src/schema.ts` to rename `discoveries` ➞ `rawItems` and `discovery_id` ➞ `raw_item_id`, introduce unique indexes enforcing the 1:1 relationships (`contents.raw_item_id`, `stories.content_id`), and reorganise sections to mirror the pipeline stages.
- Ensure column sets match worker expectations (text body, transcript URLs, content hashes, metadata). Add/rename columns directly in the Drizzle schema and clean up any lingering camelCase names.
- Run the project’s Drizzle generation workflow (e.g. `pnpm drizzle-kit generate` or equivalent) to produce SQL artefacts, review drift output, and capture the generated files in version control.
- Double-check Supabase enums/indexes for consistency with the new names (e.g. rename `discoveries_status_idx` → `raw_items_status_idx`).

## Phase 2 – Shared Data Access Layer
- Create dedicated query helpers under `packages/db/src/queries/raw-items.ts`, `.../contents.ts`, `.../stories.ts` that expose the operations used by the worker (insert raw item, fetch pending items, insert content, find by hash, etc.). Export them via `queries/index.ts`.
- Build a worker-facing Drizzle client wrapper (e.g. `apps/worker/src/data/db.ts`) that imports `createJobDb` or a singleton drizzle instance from `packages/db`. Expose helper functions that call the shared queries.
- Deprecate `apps/worker/src/db.ts`: replace its SQL implementations with calls into the shared query layer while preserving connection lifecycle + logging. Keep the file as a thin adapter until the rest of the code migrates.

## Phase 3 – Worker Orchestration & Tasks
- Update `apps/worker/src/core/job-definitions.ts` and `job-orchestrator.ts` payloads and logs to use `rawItemIds` instead of `discoveryIds`; ensure the new helper module is used for database access.
- Adjust `extract-article.ts`, `extract-youtube-content.ts`, and related storage utilities to call the shared query helpers, pass/receive `raw_item_id`, and propagate renamed fields through logging and telemetry.
- Update HTTP routes (`apps/worker/src/http/routes.ts`) to read metrics from `raw_items` and surface the new naming in JSON responses.
- Leave `worker-old.ts` untouched per requirement but confirm any shared imports still compile after the rename.

## Phase 4 – Types, Tests, and Tooling
- Regenerate Drizzle types and refresh any generated client files so TypeScript reflects the schema changes.
- Update unit/integration tests (`apps/worker/src/http/__tests__`, `.../core/__tests__`, etc.) to expect `raw_item` identifiers and to mock the new query surface.
- Run formatting, linting, and the worker test suite to validate the refactor.

## Phase 5 – Rollout & Verification
- Apply the generated migration against a staging database (or Supabase branch) to validate field renames and 1:1 constraints.
- Smoke-test ingestion + extraction flows end-to-end: insert raw items, ensure stories + overlays produce correctly, and verify HTTP status endpoints.
- Monitor logs for any residual references to `discovery_*` and clean them up.

## Notes & Risks
- Ensure no services other than the worker still rely on the legacy `discoveries` table name before applying migrations in production (check Supabase functions, dashboards, and analytics jobs).
- Coordinate deployment so schema migrations land before the worker code expecting `raw_items`. Consider feature-flagging the new worker build until the migration is confirmed applied.
- Keep manual SQL out of the repo going forward; rely on Drizzle to derive migrations from `schema.ts` to maintain the single source of truth.
