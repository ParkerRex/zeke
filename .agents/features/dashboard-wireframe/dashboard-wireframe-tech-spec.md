# Dashboard Wireframe Technical PRD

## Executive Summary
- Rebuild the authenticated dashboard layout at `apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx` to mirror the updated wireframe (`.agents/features/in-progress/wire-updated.png`) and the new conversational assistant surface under `apps/dashboard/src/app/[locale]/(app)/(sidebar)/[[...chatId]]/`.
- Deliver a unified workspace that pairs research discovery (Stories, Sources, Insights, Briefs, Playbooks) with the streaming assistant and canvas artifact system migrated from Midday (`apps/api/src/ai`, `apps/dashboard/src/components/chat`, `apps/dashboard/src/components/canvas`), adapted to Zeke’s Discover → Apply promise in `docs/exec-overview.md`.
- Technical approach: introduce a `workspace.bootstrap` TRPC contract, retrofit the new chat tables/queries (`packages/db/src/schema.ts`, `packages/db/src/queries/chat.ts`), stand up a `/chat` REST endpoint with `@ai-sdk` tool execution, and retire Midday-only primitives (bank connections, tracker timers, invoices) across layout, widgets, and global overlays.

## Problem Statement
- The dashboard layout still prefetches Midday finance endpoints (`trpc.invoice.defaultSettings`, `trpc.search.global`, tracker timers) and renders placeholder global sheets (`src/components/sheets/global-sheets.tsx`, `src/hooks/use-global-timer-status.ts`). This prevents us from loading the research-focused modules and assistant shell.
- Newly added assistant files (`apps/api/src/ai`, `apps/dashboard/src/components/chat`, `apps/dashboard/src/components/canvas`, `apps/dashboard/src/actions/ai`, `/[[...chatId]]/page.tsx`) remain finance-centric. While the DB schema now exposes `chats`, `chat_messages`, `chat_feedback` and `packages/db/src/queries/chat.ts` provides persistence helpers, TRPC routers (`trpc.chats.*`) and research tools have not been wired in, and layout still references Midday widgets.
- Without a cohesive bootstrap + assistant integration, authenticated users land in a finance shell, the assistant can’t persist Zeke research threads, and sales cannot demonstrate the promised Discover → Apply → Publish flows (`.agents/features/in-progress/user-flows.md`, `.agents/features/in-progress/migration-context.md`).
- Competitors already combine dashboards with conversational research (Perplexity, ElevenLabs); staying on the Midday scaffolding risks churn and undermines launches.

## Goals and Objectives
- Ship the new dashboard + assistant experience within the current sprint (≤ 2 weeks) with SSR P95 < 500 ms, keeping to the existing Next.js 15 + TRPC + Supabase stack.
- Remove Midday-specific references (`transactions`, `bankAccounts`, `invoices`, `tracker`) from layout, widgets, chat, and canvas modules (static analysis should show zero matches under `apps/dashboard/src/components/**/*`).
- Stand up chat persistence & tooling: ≥80 % of assistant prompts should return story/highlight outputs rather than finance metrics (verified via staging telemetry).
- Enable QA to run scripted UAT covering dashboard landing + assistant/canvas flows with ≥90 % pass rate.
- Within 30 days, capture ≥5 analytics events/session (`dashboard_view`, `hero_search`, `assistant_message_sent`, `artifact_opened`, `quick_action_triggered`).

## Target Users and Use Cases
- Personas: Founders/Operators seeking daily intelligence, Research Leads synthesising sources, GTM/Marketing teams transforming insights into outputs.
- Journeys:
  1. Post-auth landing (flow 10) must render sidebar, hero discover modules, personalized feed, and assistant shell without additional redirects.
  2. Conversational research: users visit `/[[...chatId]]`, continue or start a thread; assistant streams citations, triggers canvases, suggests next steps.
  3. Applied workflows: from hero modules or assistant, users launch Source Intake, Playbooks, or Insight linking via quick actions.
- Edge cases: empty datasets (show guided empty states with ingestion CTA), missing chat history (`ChatEmpty`), expired trials (header upsell), missing team context (`/teams` redirect), failed geolocation (fallback to profile timezone/country).

## Functional Requirements
- **FR-001 Workspace Bootstrap**: Layout prefetches `trpc.workspace.bootstrap` returning `{ user, team, navCounts, featureFlags, banners, assistantSummary }`. Maintain existing redirects for unauthenticated/incomplete context.
- **FR-002 Sidebar Navigation**: Sidebar uses bootstrap data to render research nav items (Sources, Stories, Insights, Briefs, Playbooks, Settings) with role-based visibility and badges (e.g., unread insights). Preserve hover-expand animation.
- **FR-003 Hero Discover Module**: Replace existing hero placeholders (`HomeSnapshot`, `LatestNewsSection`, `TopNewsSection`) with Zeke modules backed by `trpc.stories.dashboardSummaries` (Trending Today/Week, Company Signals, Repo Watch). Provide skeleton fallback; target hydration within 300 ms.
- **FR-004 Personalized Feed**: Convert `PersonalizedNewsFeed` into `InsightsFeed` using `trpc.insights.personalizedFeed({ goalIds, tags })`. Lock state for unauthenticated/unpaid sessions; otherwise show paginated highlights with goal/tag filters.
- **FR-005 Pipeline Health & Quick Actions**: Header exposes ingestion/playbook health via `trpc.pipeline.dashboardStatus`; quick-action buttons trigger `pipeline.ingestSource`, `pipeline.ingestUrl`, `playbooks.run` mutations with optimistic updates.
- **FR-006 Global Overlays**: Rebuild `GlobalSheets` with Zeke overlays only (`SourceIntakeSheet`, `AssistantModal`, `PlaybookRunSheet`, `NotificationCenterSheet`, `InsightLinkSheet`). Remove Midday modals (tracker, invoices, bank connections). Maintain Nuqs integration for open state.
- **FR-007 Header Utilities**: Header receives `ingestionStatus`, `trialDaysLeft`, `notifications` props and renders search, assistant launcher, notifications, pipeline status, and upsell states per bootstrap data.
- **FR-008 Conversational Assistant Surface**:
  - `/[[...chatId]]/page.tsx` loads `ChatInterface` within `HydrateClient` and `ChatProvider`, passing geolocation data and prefetching chat via `trpc.chats.get`.
  - `ChatInterface` uses `useChat<UIChatMessage>` with authenticated `DefaultChatTransport` hitting `${NEXT_PUBLIC_API_URL}/chat` (REST) and persisting via TRPC routers.
  - Provide chat history list, follow-up suggestions, assistant examples, and redirect to `/` if `chatId` invalid.
- **FR-009 Canvas Artifacts**: Align canvas components with research outputs (rename/repurpose `BurnRateCanvas`, `RevenueCanvas`, etc., into `TrendCanvas`, `BriefCanvas`, `PlaybookCanvas`, etc.). `Canvas` listens to artifacts via `@ai-sdk-tools/artifacts`. Maintain toast progress UI.
- **FR-010 Assistant Tooling**: Swap Midday finance tools for research tools: `getStoryHighlights`, `summarizeSources`, `draftBrief`, `planPlaybook`, `linkInsights`, `webSearch`. Update `apps/api/src/ai/tools` registry metadata, schemas, and follow-up question generator.
- **FR-011 Chat Persistence & Feedback**: Use new DB tables (`chats`, `chat_messages`, `chat_feedback`) with queries in `packages/db/src/queries/chat.ts`. Ensure save/get/delete operations store `UIChatMessage` JSON, track titles, and record optional feedback (positive/negative). Add TRPC routers to expose history, detail, deletion, and feedback submission.
- **FR-012 Observability**: Emit `dashboard_view`, `hero_search`, `assistant_message_sent`, `assistant_tool_invoked`, `artifact_opened`, `quick_action_triggered` events via `@zeke/events` with `teamId`, `userId`, `goalContext`.

## Technical Requirements
- **Stack**: Next.js 15 App Router + React 19, TRPC v11, TanStack Query 5, Supabase auth, Drizzle ORM, `ai` SDK (`streamText`, `DefaultChatTransport`), `@ai-sdk-tools/store` & `artifacts`.
- **Platform**: Support latest Chrome/Edge/Firefox/Safari; responsive from 375 px mobile to 1440 px desktop; keep locale routing.
- **Dev Environment**: Bun 1.2.21, Turborepo scripts, Biome lint/format, strict TS. Follow `.cursor/rules` patterns.
- **Deployment**: Dashboard on Vercel; API on Fly/Hono. `/chat` streaming endpoint served via API workers with SSE/HTTP chunking. Ensure env vars for AI provider, Supabase, feature flags configured.
- **Scalability**: Handle 10k stories/team, 100k highlights, 1k chats/team. Implement pagination/cursors for chat list. Use caching for heavy stories queries.
- **Availability**: Target ≥99.5 % uptime. Provide fallback UI if TRPC/AI fails.
- **Compatibility**: Maintain compatibility with existing stories/highlights schema; avoid breaking desktop app exports. Feature flag new layout via `NEXT_PUBLIC_ENABLE_NEW_LAYOUT`.

## System Architecture
- **Flow**:
  1. Layout fetches `workspace.bootstrap` (TRPC) using `getQueryClient` & `HydrateClient`.
  2. Client components use `useTRPC()` + TanStack Query; Nuqs manages URL state.
  3. `ChatInterface` uses `useChat<UIChatMessage>` with `DefaultChatTransport` calling `/chat`; responses stream UI messages + artifact metadata.
  4. DB layer uses new tables & queries (`packages/db/src/queries/chat.ts`) to persist chats/messages/feedback.
- **Components**: Layout shell (Sidebar, Header, Hero, Feed, Quick Actions), Assistant (ChatInterface, Widgets, Canvas), overlays (Sheets/Modals), TRPC routers (`workspace`, `stories`, `insights`, `pipeline`, `chats`, `playbooks`).
- **Integration**: Shared logic in `packages/db`, `packages/engine`, `packages/events`, `packages/import`. Use Supabase for auth/session; Trigger.dev for ingestion and playbooks.
- **Caching/State**: TanStack Query caches for TRPC data; potential Upstash/Redis for trending stories; `chatCache` replacement for user context (Zeke namespace). `@ai-sdk-tools/store` handles chat state; `@ai-sdk-tools/artifacts` handles canvas artifacts.

## Data Requirements
- **Tables**:
  - `chats(id, teamId, userId, title, createdAt, updatedAt)` – indexes on `teamId`, `userId`, `updatedAt`.
  - `chat_messages(id, chatId, teamId, userId, content jsonb<UIChatMessage>, createdAt)` – indexes on `chatId`, `teamId`, `userId`, `createdAt`.
  - `chat_feedback(id, chatId, messageId, teamId, userId, type, comment, createdAt)` – indexes for analytics.
  - Existing stories/highlights tables provide content for assistant tools and hero modules.
- **Queries**: Use `packages/db/src/queries/chat.ts` functions (`getChatById`, `getChatsByTeam`, `saveChat`, `saveChatMessage`, `deleteChat`) within TRPC routers.
- **Storage**: Postgres for chat data; Supabase storage for uploaded files referenced in chat messages. Potential caching for user context.
- **Volume**: Expect thousands of chats/messages per team; plan for archival/pagination. Ensure JSONB message storage stays under 64 KB per row.
- **Migration**: Run Drizzle migrations for new tables/indexes. Remove deprecated assistant thread tables after verifying nothing references them. Update seeds for staging demos.
- **Privacy**: Chats contain potentially sensitive research; enforce `teamId` scoping. Provide deletion via TRPC `chats.delete`. Avoid logging message content.

## API Specifications
- **TRPC `workspace.bootstrap`**: Hydrates layout with user/team/nav/pipeline/assistant summary. Rate limit 30 req/min/user.
- **TRPC `stories.dashboardSummaries`**: Returns story slices for hero modules.
- **TRPC `insights.personalizedFeed`**: Provides personalized highlights feed with pagination.
- **TRPC `pipeline.dashboardStatus`**: Returns ingestion/playbook health summary.
- **TRPC `chats.list`**: `{ limit?, cursor?, search? } → { chats: [{ id, title, createdAt, updatedAt }], nextCursor? }`.
- **TRPC `chats.get`**: `{ chatId } → { id, title, createdAt, updatedAt, messages: UIChatMessage[] }`.
- **TRPC `chats.delete`**: `{ chatId } → { success: true }` and cascades messages/feedback.
- **TRPC `chats.feedback`**: Optional endpoint to persist feedback entries.
- **REST `POST /chat`**: Streams assistant responses (UI messages + artifact metadata). Validates `chatRequestSchema`, loads user context, runs `streamText` with tool registry, saves messages via `saveChatMessage`, optionally updates titles via `saveChat`. Rate limit 60 req/min/chat.

## Security Requirements
- Supabase JWT auth for TRPC + `/chat`; ensure `withTeamPermission` attaches `teamId`.
- RBAC: owners/admins manage settings; viewers limited to read-only. `/chat` checks membership.
- Encrypt in transit (TLS). Store secrets securely. No raw chats in logs.
- Validate inputs with Zod (TRPC schemas, chat request schema). Sanitize tool parameters.
- Audit log `chat_message_created`, `assistant_tool_called`, `chat_feedback_submitted`, `pipeline_action_triggered` via `@zeke/logger` (retain ≥30 days).
- GDPR compliance: support chat deletion (team-level) and user export if requested.
- Security testing: include `/chat` and new TRPC routers in automated scans (ZAP); add RBAC tests.

## Performance Requirements
- Bootstrap P50 ≤ 250 ms, P95 ≤ 400 ms (server). `/chat` streaming should start ≤ 2 s from request and maintain <200 ms chunk cadence.
- Support 100 rps combined (bootstrap + hero + chat). Allow 5k concurrent sessions. Use connection pooling in Postgres.
- Limit `/chat` worker memory (<256 MB). Lazy-load heavy canvas charts. Keep initial payload ≤ 120 KB gzipped.

## Integration Requirements
- Third-party: OpenAI (or configured LLM), Supabase, Trigger.dev, Upstash, Sentry, Posthog/Amplitude, Resend (for notifications).
- Internal: `packages/engine` (playbooks), `packages/import` (ingestion), `packages/events` (analytics), `packages/utils` (feature flags).
- Data exchange: TRPC JSON (SuperJSON), `/chat` streaming (SSE/HTTP chunk). Artifact payloads map to canvas components.
- Error handling: Retry pipeline mutations (3 attempts, exponential backoff); circuit breaker for failing `/chat` or tools.
- Versioning: Update `apps/api/src/trpc/trpc-diagram.md` and REST docs. Bump API minor version.

## Testing Strategy
- Unit: Bun/Jest for TRPC routers (`workspace`, `stories`, `insights`, `pipeline`, `chats`), AI utilities (`generate-system-prompt`, tool registry), canvas helpers.
- Integration: TRPC caller tests with seeded DB; REST `/chat` tests with mocked LLM/tools verifying persistence and streaming.
- Contract: Snapshot Zod schemas to ensure dashboard & API alignment (e.g., `zod-openapi`).
- UI: Playwright/Cypress for dashboard rendering, hero interactions, assistant chat (send message, stream response, artifact view, chat deletion, feedback submission).
- Performance: k6 load tests for bootstrap and `/chat`. Monitor resource usage.
- Security: RBAC tests, OWASP ZAP scan. Validate chat deletion purges messages/feedback.
- UAT: PM/Design walkthrough referencing this PRD; run scenarios covering UC1–UC3 + assistant flows.
- Regression: Ensure login/setup/team flows unaffected; run `bun test`, lint, typecheck.

## Success Metrics and KPIs
- Business: +30 % trial-to-onboard conversion; +25 % DAU; +5 NPS for “Found insights quickly”.
- Technical: <1 % bootstrap error rate; <0.5 % chat failure rate; zero P1 incidents post-launch.
- User: ≥70 % of sessions interact with hero modules; ≥50 % of assistant sessions trigger at least one research tool.
- Quality: ≥80 % coverage on new routers/components; zero `any` regressions; lint/typecheck clean.

## Risk Assessment
- Technical: Potential N+1 queries in bootstrap/chat; mitigate with batched loaders. Streaming failures must degrade gracefully.
- Integration: Tool registry overhaul needs coordination with Trigger.dev; lack of research data may leave canvases empty—seed demo content.
- Security: Chat data exposure; enforce team scoping, monitor for prompt injection, sandbox tools.
- Business: Delays block marketing launch; add feature flag & rollback path.
- Mitigation: Progressive rollout behind feature flag, canary metrics, fallback UI for assistant, thorough QA.
- Contingency: If `/chat` fails, disable assistant via flag, show static insight cards, log incident, surface system banner.

## Dependencies and Constraints
- External: Supabase availability, OpenAI quotas, Trigger.dev reliability, Upstash limits, Resend notifications.
- Internal: Updated research datasets for canvas demos, `@zeke/ui` tweaks for hero styling, adherence to mapping plan `.agents/features/in-progress/mapping-plan.md`.
- Technical: Maintain locale-aware routing, ensure compatibility with desktop app exports, respect strict TS/lint rules.
- Business: Launch coordination with marketing, budgeting for AI usage, data privacy commitments.
- Assumptions: Story/highlight overlays populated; feature flag infra ready; team roles defined; AI provider quotas sufficient for beta.
