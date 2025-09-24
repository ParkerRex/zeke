# Engine Rename Plan (worker → engine)

## Objective
Rename the "worker" app and package to "engine" across the codebase, runtime assets, and documentation without breaking builds or operational flows.

## Scope
- Rename the workspace folder (`apps/engine` → `apps/engine`).
- Switch the package name (`@zeke/worker` → `@zeke/engine`) and align scripts, entrypoints, and exports.
- Update infrastructure assets (Docker images, Railway, Cloud Run, shell scripts) and telemetry strings.
- Refresh documentation, runbooks, and references across apps and packages.
- Validate builds, tests, deployments, and smoke checks post-rename.

## Non-Goals (tracked separately)
- Renaming database roles or environment variables such as `WORKER_DB_PASSWORD` or the `worker` DB role.

## Guardrails & Dependencies
- Keep the change mechanical—no behavioral alterations beyond renaming identifiers.
- Ensure existing ingestion jobs remain running until the `engine` service is fully verified.
- Coordinate with Ops/LLM teams so queued jobs and monitoring rules are updated in step with the rename.
- Preserve backwards compatibility where downstream repos still look for `@zeke/worker` (consider temporary aliasing if required).

## Workstreams

### Workstream 0 — Pre-flight & sequencing
- [ ] Capture a baseline (`bun run build`, `bun run typecheck`, worker smoke tests) before touching files.
- [ ] Inventory active deployments (Railway, Cloud Run, local docker) and schedule a rename window.
- [ ] Confirm owners for dashboard, API, infra, and docs sign off on the timeline.
- [ ] Draft comms for engineers/operators describing the rename and any temporary dual-service period.

### Workstream 1 — Repository & workspace rename
- [ ] `git mv apps/engine apps/engine`.
- [ ] Update `apps/engine/package.json` (`name`, scripts, bin targets).
- [ ] Root scripts: ensure `package.json` and `turbo` filters reference `@zeke/engine`; remove or alias any `@zeke/worker` filters.
- [ ] Update workspace dependencies referencing `@zeke/worker` (e.g., `apps/dashboard/package.json`, other apps/packages).
- [ ] Refresh lockfiles (`bun install`) so `bun.lockb` points at `@zeke/engine`.
- [ ] Check any tsconfig/project references or module path aliases for the old folder/package name.

### Workstream 2 — Runtime entrypoints & symbols
- [ ] Rename `src/worker.ts` → `src/engine.ts`, `src/core/worker-service.ts` → `src/core/engine-service.ts`, and any `*-old` variants.
- [ ] Update class/function names (`WorkerService` → `EngineService`, `startWorkerService` → `startEngineService`) and adjust imports throughout.
- [ ] Switch build outputs (`dist/worker.js` → `dist/engine.js`) and ensure TypeScript config/emission paths still work.
- [ ] Update log + telemetry keys (`worker_service_*` events, "Worker service" strings, `application_name: 'zeke-worker'`).
- [ ] Audit runtime constants/env lookups for `worker` casing to avoid missing metrics labels.
- [ ] Verify queue identifiers or other shared enums do not require a rename (only update if externally visible).

### Workstream 3 — Infrastructure & scripts
- [ ] Rename shell scripts under `apps/engine/scripts` and update their internal references (`deploy-local`, `deploy-prod`, `logs`, `test-*`).
- [ ] Update Docker assets (Dockerfile `CMD`, image tags `zeke-worker` → `zeke-engine`, compose files if any).
- [ ] Adjust Railway configs (`railway.toml`, environment variables, service names) and Cloud Run deployment commands.
- [ ] Review GitHub Actions or CI workflows for hardcoded worker references.
- [ ] Ensure local helpers (`apps/engine/todo.md`, snippets in runbooks) point to the new script names.

### Workstream 4 — Tests, docs, and references
- [ ] Update unit/integration tests under `apps/engine/src/**/__tests__` for renamed imports and textual assertions.
- [ ] Refresh documentation/runbooks referencing `apps/engine` (`docs/agents.md`, `docs/plans/*`, `apps/engine/README.md`, `docs/plans/done/yt-*`, etc.).
- [ ] Update onboarding guides, IDE snippets, and PR templates mentioning worker commands.
- [ ] Confirm any shared packages or clients (`@zeke/engine-client`, future alias) reflect the new naming.
- [ ] Run repo-wide search for lingering references: `apps/engine`, `@zeke/worker`, `worker service`, `zeke-worker`, `worker-old`.

### Workstream 5 — Validation & rollout
- [ ] `bun run build`, `bun run lint`, `bun run typecheck` (turbo) all succeed post-rename.
- [ ] Run engine scripts: `bun --filter @zeke/engine dev`, `bun --filter @zeke/engine start`, `bash scripts/test-*.sh`.
- [ ] Smoke test health endpoints (`/healthz`, `/ready`, `/debug/status`) locally and in staging environments.
- [ ] Validate Docker/Railway/Cloud Run deployments under the new service name.
- [ ] Update monitoring dashboards/alerts to track `engine` metrics and confirm no data gaps.
- [ ] Only clean up legacy `worker` services after the new deployment passes checks.

## Find & Replace Matrix (primary)
| From | To |
| --- | --- |
| apps/engine | apps/engine |
| @zeke/worker | @zeke/engine |
| src/worker.ts | src/engine.ts |
| src/core/worker-service.ts | src/core/engine-service.ts |
| dist/worker.js | dist/engine.js |
| WorkerService | EngineService |
| startWorkerService | startEngineService |
| worker-old.ts | engine-old.ts |
| zeke-worker | zeke-engine |
| "worker service" (text) | "engine service" |

## Search Checklist (post-rename)
- `rg "apps/engine"`
- `rg "@zeke/worker"`
- `rg "WorkerService"`
- `rg "startWorkerService"`
- `rg "dist/worker.js"`
- `rg "zeke-worker"`
- `rg "worker service"`
- `rg "bun dev:worker"`

## High-Risk Files to Update
- `apps/engine/package.json` (name, scripts, engines)
- `apps/engine/Dockerfile` and `apps/engine/scripts/*`
- `apps/engine/src/core/engine-service.ts`, `src/engine.ts`, legacy `engine-old.ts`
- `apps/dashboard/package.json`, `apps/api/package.json` (workspace dependency names)
- `bun.lockb`
- `docs/agents.md`, `docs/plans/**`, `apps/engine/README.md`, `apps/engine/todo.md`
- Any CI workflow or deployment script referencing `@zeke/worker` or `bun dev:worker`

## Risks & Mitigations
- **Downstream consumers expect `@zeke/worker`.** Provide a compatibility re-export (temporary alias package) if external repos cannot switch immediately.
- **Monitoring dashboards lag behind rename.** Prepare updates to Grafana/DataDog queries before rollout so alerting stays healthy.
- **Queued jobs during deploy.** Drain or pause queues prior to redeploying containers; maintain the old service until the new one is confirmed healthy.
- **Forgotten scripts or docs.** Rely on the search checklist and CI to catch stragglers; block the PR on zero hits for critical strings.

## Rollout & Backout
- Roll out as a single PR (or tightly sequenced PRs) containing mechanical renames and doc updates.
- Validate locally and, if possible, in a staging Railway/Cloud Run service named `zeke-engine`.
- Backout by reverting the PR; keep the previous `zeke-worker` deployment running until `zeke-engine` is validated.

## Exit Criteria
- All builds, linting, and typechecking succeed with the `engine` naming.
- Engine service starts locally/staging with health checks passing.
- Documentation, scripts, and code imports reference `engine`.
- Monitoring/alerting reflects the new service name.

## Notes
- DB role/env rename remains optional and can ship as a follow-up when required.
- Coordinate with the team maintaining `@zeke/engine-client` to align package naming once the rename lands.
