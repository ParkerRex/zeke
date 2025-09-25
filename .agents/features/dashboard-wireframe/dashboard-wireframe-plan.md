### Executive Summary
Deliver the research-first dashboard and conversational assistant outlined in the PRD by refitting the sidebar layout, hero modules, personalized feed, overlays, and assistant stack to Zeke’s data model. Work will implement new TRPC contracts, chat persistence, REST streaming, and canvas artifact tooling while retiring Midday finance primitives, wiring observability, and meeting performance, security, and rollout constraints.

### Implementation Tasks

#### Phase 1: Foundation
- [ ] TASK-001: Generate Drizzle migrations for chat tables and indexes
  - Details: Author forward migrations for `chats`, `chat_messages`, and `chat_feedback` tables plus required indexes in `packages/db`, and drop deprecated assistant thread tables to match `schema.ts`.
  - Acceptance: `bun run db:migrate` creates the new tables/indexes without drift; legacy thread tables are removed from local and staging schemas.
  - Dependencies: None
- [ ] TASK-002: Align environment configuration for new dashboard/assistant
  - Details: Verify `NEXT_PUBLIC_API_URL`, AI provider keys, Supabase credentials, and related server env vars are defined in `apps/dashboard` and `apps/api`, documenting any new requirements.
  - Acceptance: Builds run for dashboard and API with updated env config, and staging/prod checklists reflect the required variables.
  - Dependencies: None
- [ ] TASK-003: Refresh staging seed data for research content and chat demos
  - Details: Extend seeding scripts to populate stories, highlights, pipeline status, sample chats, and representative playbooks with mock primitives (e.g., chili score, why it matters) aligned to the new schema for QA demos.
  - Acceptance: Running the seed command populates hero modules, insights feed, assistant history, and playbook listings with the mock primitives on staging.
  - Dependencies: TASK-001

#### Phase 2: Core Implementation
- [ ] TASK-004: Implement `workspace.bootstrap` TRPC procedure
  - Details: Build the router in `apps/api/src/trpc/routers/workspace` to return `{ user, team, navCounts, banners, assistantSummary }`, explaining navCounts as the badge totals per navigation item, and reuse existing queries with caching.
  - Acceptance: TRPC client returns the specified payload in dev with correct types and redirects unauthenticated users.
  - Dependencies: TASK-001
- [ ] TASK-005: Refactor dashboard layout to hydrate from `workspace.bootstrap`
  - Details: Update `apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx` to fetch bootstrap data via `getQueryClient`/`HydrateClient` and remove Midday finance prefetches while making the new experience the default.
  - Acceptance: Layout renders without calling legacy invoice/search/timer endpoints; empty states and redirects match PRD flows.
  - Dependencies: TASK-004
- [ ] TASK-006: Add `stories.dashboardSummaries` TRPC endpoint
  - Details: Implement the stories summaries procedure sourcing Trending/Signals/Repo Watch data with pagination and caching for large story sets.
  - Acceptance: Endpoint returns story slices under expected shapes and latency budgets in local testing.
  - Dependencies: TASK-001
- [ ] TASK-007: Rebuild hero modules against `stories.dashboardSummaries`
  - Details: Replace `HomeSnapshot`, `LatestNewsSection`, and `TopNewsSection` with hero modules named for Zeke primitives (`Stories`, `Highlights`, `Why It Matters`, `Playbooks`) per the mapping plan, including skeletons and hydration timing.
  - Acceptance: New hero modules render correct content and hit hydration ≤300 ms; legacy components are removed.
  - Dependencies: TASK-006
- [ ] TASK-008: Implement `insights.personalizedFeed` and convert `InsightsFeed`
  - Details: Create the TRPC procedure returning paginated highlights filtered by goals/tags and refactor the feed component with locked and empty states.
  - Acceptance: Feed shows paginated insights for eligible users and locks correctly for unauthenticated/unpaid sessions.
  - Dependencies: TASK-004
- [ ] TASK-009: Wire pipeline status and quick actions
  - Details: Build `pipeline.dashboardStatus` query plus quick-action mutations (`pipeline.ingestSource`, `pipeline.ingestUrl`, `playbooks.run`) with optimistic UI updates and error fallbacks.
  - Acceptance: Header quick actions trigger the correct mutations, update UI optimistically, and revert on failure.
  - Dependencies: TASK-004
- [ ] TASK-010: Rebuild global overlays with Zeke modals only
  - Details: Refactor `GlobalSheets` to register `SourceIntakeSheet`, `AssistantModal`, `PlaybookRunSheet`, `NotificationCenterSheet`, and `InsightLinkSheet`, removing Midday overlays while keeping Nuqs state sync.
  - Acceptance: Only the specified overlays remain and open/close state persists via URL parameters.
  - Dependencies: TASK-005
- [ ] TASK-011: Update header utilities to consume bootstrap payload
  - Details: Revise header components to surface ingestion health, trial status, notifications, search, and assistant launcher using `workspace.bootstrap` data.
  - Acceptance: Header reflects real bootstrap data across roles and hides removed finance widgets.
  - Dependencies: TASK-004, TASK-009
- [ ] TASK-012: Implement TRPC chats router suite
  - Details: Add `chats.list`, `chats.get`, `chats.delete`, and `chats.feedback` procedures using `packages/db/src/queries/chat.ts`, enforcing team scoping, pagination, and audit logging hooks.
  - Acceptance: TRPC endpoints return/persist chat data correctly and reject unauthorized access in local testing.
  - Dependencies: TASK-001
- [ ] TASK-013: Refactor chat route and interface for new TRPC data
  - Details: Update `/[[...chatId]]/page.tsx`, `ChatInterface`, and supporting components to prefetch chat history, handle invalid IDs, show examples, and manage empty states with geolocation fallback.
  - Acceptance: Navigating to existing/new chats renders history, redirects invalid IDs to `/`, and meets edge-case behaviors.
  - Dependencies: TASK-012
- [ ] TASK-014: Rework assistant tool registry for research tooling
  - Details: Replace finance tools in `apps/api/src/ai/tools` with `getStoryHighlights`, `summarizeSources`, `draftBrief`, `planPlaybook`, `linkInsights`, and `webSearch`, updating schemas and follow-up prompt logic.
  - Acceptance: Tool registry exports only the new research tools with validated metadata and passes unit smoke tests.
  - Dependencies: TASK-012
- [ ] TASK-015: Implement streaming `/chat` REST endpoint
  - Details: Build `POST /chat` using `streamText` with the updated tool registry, persist messages/titles via chat queries, enforce rate limits, and expose structured errors.
  - Acceptance: Endpoint streams assistant responses in dev, stores chat transcripts, and throttles requests per spec.
  - Dependencies: TASK-012, TASK-014
- [ ] TASK-016: Align canvas components with artifact outputs
  - Details: Rename and adapt canvas modules to research artifact types (`TrendCanvas`, `BriefCanvas`, `PlaybookCanvas`, etc.), consuming `@ai-sdk-tools/artifacts` store and maintaining progress toasts.
  - Acceptance: Assistant-triggered artifacts render the new canvases and no finance-specific canvases remain.
  - Dependencies: TASK-015

- [ ] TASK-017: Verify dashboard layout matches updated wireframe
  - Details: Review `.agents/features/in-progress/wire-updated.png` against the rebuilt layout components (sidebar, hero modules, quick actions, assistant surface, canvas launcher) and note adjustments needed, implementing minor alignment fixes.
  - Acceptance: Annotated checklist or PR notes confirm every wireframe section exists and aligns visually; identified gaps are addressed or ticketed.
  - Dependencies: TASK-005, TASK-007, TASK-008, TASK-010, TASK-011, TASK-013, TASK-016
- [ ] TASK-018: Prototype LLM-driven replacements for legacy jobs
  - Details: Evaluate `packages/jobs` workflows for opportunities to replace with on-demand AI calls, implement an initial handler in `apps/api/src/ai` and `apps/dashboard/src/actions/ai` using `docs/system-prompts/extract-pdf.md` (reference output `docs/system-prompts/extract-pdf-eval-1.json`), and document follow-up conversions.
  - Acceptance: New AI action runs end-to-end without job worker, producing structured output matching eval baseline; list of remaining job candidates captured in issue tracker.
  - Dependencies: TASK-012, TASK-014, TASK-015

#### Phase 3: Integration
- [ ] TASK-019: Instrument analytics events for dashboard and assistant flows
  - Details: Fire `dashboard_view`, `hero_search`, `assistant_message_sent`, `assistant_tool_invoked`, `artifact_opened`, and `quick_action_triggered` via `@zeke/events`, including `teamId`, `userId`, and `goalContext` payloads.
  - Acceptance: Events appear in analytics pipeline when flows run locally/staging and include the required fields.
  - Dependencies: TASK-007, TASK-008, TASK-009, TASK-011, TASK-013, TASK-016
- [ ] TASK-020: Enforce auth, RBAC, and audit logging across new endpoints
  - Details: Apply Supabase `withTeamPermission` checks to new TRPC procedures and `/chat`, log `chat_message_created`, `assistant_tool_called`, and `chat_feedback_submitted` via `@zeke/logger`, and verify role-based access.
  - Acceptance: Unauthorized roles are rejected, audit logs emit the new events, and automated checks confirm RBAC rules.
  - Dependencies: TASK-012, TASK-015

#### Phase 4: Testing & Quality
- [ ] TASK-021: Add unit tests for new TRPC routers and utilities
  - Details: Cover `workspace`, `stories`, `insights`, `pipeline`, and `chats` procedures plus tool registry helpers using Bun/Jest with realistic fixtures.
  - Acceptance: Tests pass locally with ≥80 % coverage on newly touched server modules.
  - Dependencies: TASK-004, TASK-006, TASK-008, TASK-009, TASK-012, TASK-014
- [ ] TASK-022: Create integration tests for `/chat` streaming and persistence
  - Details: Write tests exercising the REST endpoint with mocked LLM responses to validate streaming chunks, persistence, and error paths.
  - Acceptance: Integration suite verifies success and failure cases and runs in CI without flakiness.
  - Dependencies: TASK-015
- [ ] TASK-023: Extend Playwright/Cypress flows for dashboard and assistant UX
  - Details: Automate scenarios covering post-auth landing, hero interactions, insights pagination, sending assistant messages, artifact viewing, chat deletion, and feedback submission.
  - Acceptance: E2E suite passes in CI and fails when key UI flows break.
  - Dependencies: TASK-005, TASK-007, TASK-008, TASK-013, TASK-016
- [ ] TASK-024: Run performance tests for bootstrap and `/chat`
  - Details: Configure k6 scripts to measure bootstrap (P50/P95) and `/chat` start times/chunk cadence, tuning caching or batching as needed.
  - Acceptance: Metrics meet PRD targets (SSR P95 < 500 ms, chat start ≤ 2 s, chunk < 200 ms) in staging runs.
  - Dependencies: TASK-004, TASK-015
- [ ] TASK-025: Execute security and RBAC validation
  - Details: Perform automated RBAC tests and OWASP ZAP scans against new TRPC and REST endpoints; verify chat deletion purges messages/feedback.
  - Acceptance: Security scans pass without high-severity issues and RBAC tests confirm correct enforcement.
  - Dependencies: TASK-020, TASK-022

#### Phase 5: Deployment Preparation
- [ ] TASK-026: Update API and feature documentation
  - Details: Revise `apps/api/src/trpc/trpc-diagram.md`, REST docs, and release notes to describe new contracts, rate limits, and fallbacks.
  - Acceptance: Docs published with accurate endpoints and shared with stakeholders.
  - Dependencies: TASK-015
- [ ] TASK-027: Configure rollout monitoring and launch checklist
  - Details: Set up dashboards/alerts for `/chat`, TRPC error rates, and analytics KPIs, and document rollout/rollback steps for the always-on launch.
  - Acceptance: Monitoring dashboards exist, alerts fire on thresholds, and rollout checklist is approved.
  - Dependencies: TASK-019, TASK-024

### Dependencies and Blockers
- Requires reliable research datasets and hero styling updates from design (`@zeke/ui`) to populate new modules.
- Supabase, OpenAI (or configured LLM), Trigger.dev, Upstash, and Resend services must be accessible; rate limits or outages will block testing.
- Maintaining `docs/system-prompts/*` coverage (e.g., `extract-pdf.md`) is critical for replacing `packages/jobs` automations; prompt regressions reintroduce worker dependencies.
- AI usage budget and data privacy reviews must be cleared before enabling `/chat` in production.

### Success Criteria
- SSR bootstrap P95 < 500 ms; chat streaming starts ≤ 2 s with <200 ms chunk cadence.
- <1 % bootstrap error rate; <0.5 % chat failure rate; zero P1 incidents post-launch.
- ≥70 % of sessions interact with hero modules; ≥50 % of assistant sessions trigger at least one research tool.
- ≥80 % test coverage on new routers/components; lint/typecheck remain clean.
- +30 % trial-to-onboard conversion, +25 % DAU lift, +5 NPS for “Found insights quickly.”
