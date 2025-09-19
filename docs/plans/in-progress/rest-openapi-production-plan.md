# REST + OpenAPI Productionization Plan

## Objective
Deliver a minimal, well-typed REST surface that mirrors our TRPC contracts, emits an accurate OpenAPI spec, and aligns with Zeke's actual product surfaces (stories, highlights, assistant, search, team, tags, users). The goal is to remove the Midday scaffolding that was copied in, replace it with Zeke-aware handlers, and keep REST thin by leaning on existing schemas and query helpers.

## Current State Findings
- **Midday artifacts everywhere.** Routers such as `bank-accounts.ts`, `invoices.ts`, `transactions.ts`, and OAuth flows reference `@midday/*` packages, nonexistent schemas, and domain concepts we do not ship. Several schema imports (e.g. `@api/schemas/customers`) do not exist, so the code does not even type-check.
- **Auth pipeline mismatch.** `middleware/auth.ts` expects Midday API keys and caches, while TRPC already relies on Supabase JWTs + `withTeamPermission`. REST and TRPC contexts are diverging.
- **Scope list is stale.** `utils/scopes.ts` exports financial scopes; nothing matches the permissions we need for stories/assistant/search.
- **Context duplication.** REST maintains its own `withDatabase` + replication middleware instead of reusing the logic already hardened for TRPC.
- **Router index exposes the wrong surface.** `routers/index.ts` wires up the Midday suite and omits anything for stories/highlights/assistant.
- **No OpenAPI entrypoint.** `apps/api/src/index.ts` never mounts the REST app or serves `/openapi.json`; the copied code is effectively dead.

## Workstreams & Tasks

### 1. Shared Foundation & Context
- Extract a common `createApiContext` helper (Supabase session, db handle, team resolution, geo) that both TRPC and REST call.
- Replace `withDatabase`/`withPrimaryReadAfterWrite` to reuse the TRPC middleware implementations instead of duplicating cache logic.
- Create an explicit REST app module (e.g. `rest/app.ts`) that configures OpenAPI (title, version, server URLs) and exposes a `routes` object for mounting.
- Update `apps/api/src/index.ts` to mount REST under `/v1` (or similar) and expose `/openapi.json` + `/reference` swagger UI if desired.

### 2. Authentication & Authorization
- Rewrite `middleware/auth.ts` to exclusively use Supabase JWTs for now (mirroring `verifyAccessToken`); stub API-key support as a follow-up instead of shipping broken Midday logic.
- Ensure team resolution leverages `withTeamPermission` so REST gains the same `teamId` guarantees as TRPC.
- Redefine scopes in `utils/scopes.ts` to Zeke-friendly values (e.g. `stories.read`, `assistant.write`, `search.read`, `teams.manage`, `users.read`). Include a migration note for updating seed data / key issuance once the list is final.
- Update `withRequiredScope` messaging to drop Midday terminology and support defaulting to read-only presets.

### 3. Router Inventory & Actions
Create a clean slate for `apps/api/src/rest/routers` that mirrors active TRPC routers.

| Router file | Current status | Plan |
| --- | --- | --- |
| `bank-accounts.ts`, `documents.ts`, `invoices.ts`, `reports.ts`, `transactions.ts`, `tracker-entries.ts`, `tracker-projects.ts`, `notifications.ts`, `inbox.ts`, `oauth.ts` | Midday-only; broken imports | Delete entirely. Document removal in changelog so future diffs show the intentional cut. |
| `customers.ts` | Imports nonexistent `@api/schemas/customers`; domain unclear | Remove for now. If we reintroduce customer analytics later, design schemas first and add back intentionally. |
| `search.ts` | Uses valid Zeke query helpers but wrong request schema (`globalSearchSchema`) and copy/pasted description | Rewrite: expose `/search/global` & `/search/semantic`, reuse TRPC input/output schemas, normalize descriptions, and ensure `withRequiredScope('search.read')` aligns with new scope names. |
| `tags.ts` | Mostly aligned but response codes/scopes need polish | Refactor to match TRPC contract (list, get, create, update, delete). Ensure error handling translates TRPC errors and remove `"x-speakeasy-name-override"` cruft unless still needed. |
| `teams.ts` | Closer to reality but still uses Midday copy describing "workspace" | Update schema references, include `setActive` endpoint mirroring TRPC mutation, align success codes, and gate by `teams.read`/`teams.manage` scopes. |
| `users.ts` | Relevant; simply wraps `getUserById`/`updateUser` | Keep but modernize descriptions, make sure response shape matches `userSchema` (e.g. include nested team summary if TRPC returns it), and ensure we block unauthenticated access. |
| _New_: `stories.ts` | Missing | Add REST handlers for `GET /stories`, `GET /stories/{id}`, `GET /stories/{id}/metrics` using TRPC schemas (`listStoriesResponseSchema`, `storyDetailSchema`, `storyMetricsSchema`). |
| _New_: `highlights.ts` | Missing | Add CRUD/read endpoints consistent with `highlightRouter` (`GET /highlights?storyId=`, `GET /highlights/{id}`). |
| _New_: `assistant.ts` | Missing | Surface the assistant thread/message endpoints we support in TRPC (list threads, get thread, post message, attach/detach sources). |
| _New_: `story-clusters.ts` or `insights.ts` | Optional depending on upcoming roadmap | Placeholder to capture future work if we decide to expose cluster/insight endpoints via REST. |

Update `routers/index.ts` to mount the rewritten/new routers and ensure protected middleware applies after public ones (e.g. keep OAuth slot empty or repurpose for future public endpoints).

### 4. Schema Alignment & Reuse
- Audit `apps/api/src/schemas` to confirm each REST endpoint reuses the same Zod objects as TRPC. Where schemas are missing (e.g. assistant responses), extract them from TRPC routers into shared files.
- Remove dead schema files copied from Midday once their routers go away (e.g. delete `apps/api/src/schemas/bank-accounts.ts` if added by mistake). If a schema is still valuable for future work, move it into `docs/backlog` with a note instead of shipping unused code.
- Normalize naming (`listStoriesInputSchema` vs `listStoriesQuerySchema`) so both transports can share request parsing helpers.

### 5. Error Handling & Utilities
- Standardize JSON error responses (structure `code`, `message`, `details`) and make sure `validateResponse` gracefully handles nulls.
- Introduce helpers for pagination metadata (common across TRPC and REST) to avoid rewriting the same shaped response in multiple routers.
- Ensure rate limiting middleware uses contextual identifiers (team or user ID) and is configurable per route group.
- Verify logging hooks (`logger` usage) send structured messages consistent with engine/service logs.

### 6. OpenAPI Spec Output & Tooling
- Configure `OpenAPIHono` to emit a final spec (title, version, security schemes for Bearer tokens). Add `/openapi.json` and `/docs` (if we enable Redoc/Scalar UI).
- Add a CI check or script (`pnpm openapi:validate`) that builds the spec and ensures there are no missing schemas.
- Document the discovery endpoint and authentication story in `docs/api/README.md`.

### 7. Validation & Rollout
- Type-check and lint once the deletions/additions land (`pnpm lint`, `pnpm typecheck`).
- Smoke test endpoints locally with Supabase access tokens to confirm session extraction, team scoping, and scope gating work.
- Update onboarding docs to clarify that REST and TRPC share the same Zod contracts and permission model.

## Open Questions / Follow-Ups
- Do we need API key support at launch? If yes, spec out a Supabase-backed key issuance flow before touching REST auth again.
- Should REST expose write operations for stories/highlights now or stay read-only until we have moderation stories?
- What path/versioning do we want (`/api/v1` vs `/v1`)? Decide before wiring the mount point so clients are stable.

Once these workstreams are complete, the REST layer will be a thin, well-documented shim over our existing TRPC logic with an accurate OpenAPI contract ready for partners.
