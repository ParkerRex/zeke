# ZEKE Agents Guide

<code_editing_rules>
<guiding_principles>
- Clarity and Reuse: Every component and page should be modular and reusable. Avoid duplication by factoring repeated UI patterns into components.
- Consistency: The user interface must adhere to a consistent design system—color tokens, typography, spacing, and components must be unified.
- Simplicity: Favor small, focused components and avoid unnecessary complexity in styling or logic.
- Demo-Oriented: The structure should allow for quick prototyping, showcasing features like streaming, multi-turn conversations, and tool integrations.
- Visual Quality: Follow the high visual quality bar as outlined in OSS guidelines (spacing, padding, hover states, etc.)
</guiding_principles>

<frontend_stack_defaults>
- Framework: Next.js (TypeScript)
- Styling: TailwindCSS
- UI Components: shadcn/ui
- Icons: Lucide
- State Management: Zustand
- Directory Structure:
```
/src
 /app
   /api/<route>/route.ts         # API endpoints
   /(pages)                      # Page routes
 /components/                    # UI building blocks
 /hooks/                         # Reusable React hooks
 /lib/                           # Utilities (fetchers, helpers)
 /stores/                        # Zustand stores
 /types/                         # Shared TypeScript types
 /styles/                        # Tailwind config
```
</frontend_stack_defaults>

<ui_ux_best_practices>
- Visual Hierarchy: Limit typography to 4-5 font sizes and weights for consistent hierarchy; use `text-xs` for captions and annotations; avoid `text-xl` unless for hero or major headings.
- Color Usage: Use 1 neutral base (e.g., `zinc`) and up to 2 accent colors.
- Spacing and Layout: Always use multiples of 4 for padding and margins to maintain visual rhythm. Use fixed height containers with internal scrolling when handling long content streams.
- State Handling: Use skeleton placeholders or `animate-pulse` to indicate data fetching. Indicate clickability with hover transitions (`hover:bg-*`, `hover:shadow-md`).
- Accessibility: Use semantic HTML and ARIA roles where appropriate. Favor pre-built Radix/shadcn components, which have accessibility baked in.
</ui_ux_best_practices>

<code_editing_rules>

## Overview
- ZEKE ingests multi-format news, analyzes it with LLM overlays, and surfaces actionable briefs across web apps and background pipelines (`README.md:1-74`).
- The monorepo uses Turbo, pnpm, and Bun with unified workflows (`package.json:1-33`).
- Shared packages hold design system, database access, analytics, cache, and AI utilities so UI and worker layers stay consistent.

## Monorepo Layout
- `apps/dashboard` is the primary Next.js 15 App Router experience; layout, providers, and analytics wiring live in `apps/dashboard/src/app/layout.tsx:1-100` and `apps/dashboard/src/app/providers.tsx:1-18`.
- `apps/website` holds the marketing site (Next.js) with a lighter component surface for public pages (`README.md:36-41`).
- `apps/worker` is the modular pg-boss service for ingesting sources, extracting content, and running analysis; entrypoint `apps/worker/src/worker.ts:1-66`, orchestrator `apps/worker/src/core/worker-service.ts:1-160`.
- `apps/api` contains Supabase CLI scaffolding, SQL migrations, and example TRPC code (`apps/api/migrations/0000_nasty_payback.sql:1-160`).
- `packages/` hosts shared modules: `@zeke/ui`, `@zeke/supabase`, `@zeke/db`, `@zeke/events`, `@zeke/ai`, `@zeke/cache`, `@zeke/kv`, `@zeke/utils`, `@zeke/location`.

## Runtime Architecture & Data Flow
- Worker queues coordinate via `pg-boss` with queue names centralized in `apps/worker/src/core/job-definitions.ts:16-78`; schedules seeded in `scheduleRecurringJobs` (`apps/worker/src/core/job-definitions.ts:88-116`).
- RSS/article extraction uses Readability and canonical URL hashing in `apps/worker/src/tasks/extract-article.ts:1-87`; YouTube extraction and transcription mirror this pattern via `apps/worker/src/tasks/extract-youtube-content.ts` (see same folder).
- Story analysis is LLM-driven with OpenAI fallback stubs in `apps/worker/src/tasks/analyze-story.ts:1-89`, calling `generateAnalysis` and `generateEmbedding` (`apps/worker/src/lib/openai/generate-analysis.ts:1-109`) or stub variants (`apps/worker/src/lib/openai/generate-stub-analysis.ts:1-86`).
- HTTP endpoints for health checks, manual triggering, and previews live in `apps/worker/src/http/routes.ts:1-165` and should remain the single surface for operational tooling.
- Worker DB access wraps shared Drizzle queries (`apps/worker/src/data/db.ts:1-63`) but exposes Pool helpers for legacy functions (`apps/worker/src/db.ts:1-120`). Use Drizzle helpers first, fall back to `pool` only when needed.

## Dashboard Application
### App Shell & Providers
- Global metadata, fonts, and analytics are set in `apps/dashboard/src/app/layout.tsx:14-98`; adjust typography tokens there to keep a single source of truth.
- Theme toggling uses the `ThemeProvider` wrapper in `apps/dashboard/src/app/providers.tsx:1-18`; changes to theme behavior should flow through this component.
- Supabase auth is enforced in `apps/dashboard/src/middleware.ts:1-34`; any new public routes must be whitelisted in `config.matcher`.

### Data & URL State
- Supabase server/client factories are in `packages/supabase/src/client/server.ts:1-79` and `packages/supabase/src/client/client.ts:1-9`; always use these wrappers so cookie handling and logging suppression stay intact.
- Story fetching is centralized through `@zeke/supabase/queries` (`packages/supabase/src/queries/index.ts:1-204`), which maps DB rows to rich `Cluster` objects (`packages/supabase/src/types/stories.ts:1-36`).
- URL state is managed with `nuqs`; all parsers are in `apps/dashboard/src/utils/nuqs.ts:1-55`. Extend this file instead of sprinkling new parsers.
- Tab orchestration relies on the URL and metadata stores in `apps/dashboard/src/hooks/use-tabs.ts:1-210`, and client hydration occurs in `apps/dashboard/src/app/(app)/story/[clusterId]/story-client.tsx:1-23`.

### AI & Streaming Patterns
- Server actions use `ai` streaming helpers (`createStreamableValue`, `streamText`, `streamObject`); reference `apps/dashboard/src/actions/ai/editor/generate-editor-content.ts:1-73` for text streaming and `apps/dashboard/src/actions/ai/filters/generate-invoice-filters.ts:1-52` for structured JSON streaming.
- Client components unwrap streamed values with `useStreamableText` (`apps/dashboard/src/hooks/use-streamable-text.tsx:1-25`). Prefer this hook for any multi-turn or real-time surface.
- TRPC hooks (`apps/dashboard/src/hooks/use-user.ts:1-53`) encapsulate optimistic updates; new TRPC procedures should follow this pattern and keep query keys stable.

### UI System
- Reuse `@zeke/ui` primitives (e.g., `Button`, `Sheet`) instead of duplicating shadcn code. The utility `cn` lives at `packages/ui/src/utils/cn.ts:1-6`, and Tailwind globals live beside it.
- Stick to Tailwind tokens defined in shared CSS (`apps/dashboard/src/styles.css` and `packages/ui/globals.css`) to preserve the design system.

## Worker Implementation Notes
- Environment loading happens before imports (`apps/worker/src/core/worker-service.ts:15-33`); ensure new modules stay side-effect free so configuration is resolved first.
- Use Redis-backed caches from `apps/worker/src/utils/retry.ts:1-48` and `packages/cache/src/redis-client.ts:1-133` for resilience, but reset connections on failure as already implemented.
- All network calls must respect `fetchWithTimeout` conventions as shown in `apps/worker/src/tasks/extract-article.ts:24-33`; wire new clients through `utils/http.ts` for consistency.
- When extending the OpenAI client, adjust defaults in `apps/worker/src/lib/openai/openai-client.ts:1-33` and ensure stub paths still work without `OPENAI_API_KEY`.
- Queue orchestration ensures workloads remain idempotent; new jobs should follow the `QUEUES` pattern and register in `createJobQueues` plus `setupJobWorkers` (`apps/worker/src/core/job-definitions.ts:52-157`).

## Shared Packages & Services
- `@zeke/ai` re-exports `@ai-sdk` and centralizes model defaults (`packages/ai/lib/models.ts:1-16`). Use these exports for both frontend and worker coherence.
- `@zeke/ui` contains component implementations in `packages/ui/src/components/*`; prefer composition (e.g., `Card`, `Tabs`) over bespoke Tailwind wrappers.
- `@zeke/db` exposes Drizzle clients with snake_case mapping (`packages/db/src/client.ts:1-37`); share schema updates here so worker and dashboard stay aligned.
- `@zeke/cache` (Node `redis`) vs `@zeke/kv` (Upstash REST) target different runtimes; dashboard/serverless code should use `@zeke/kv/src/index.ts:1-8`, while long-lived services use `packages/cache/src/redis-client.ts:1-133`.
- `@zeke/events` provides client/server analytics wrappers (`packages/events/src/client.tsx:1-23`, `packages/events/src/server.ts:1-39`) and event names (`packages/events/src/events.ts:1-160`); route all instrumentation through these to keep taxonomy clean.
- `@zeke/utils` gives environment helpers (`packages/utils/src/envs.ts:1-40`) and formatting helpers—use these to avoid duplicating URL logic.
- Location datasets (countries, currencies, timezones) live under `packages/location/src/`; pull from here for form pickers instead of adding inline constants.

## Database & Migrations
- Supabase migrations sit in `apps/api/migrations`; the initial snapshot defines sources, raw items, contents, stories, overlays, embeddings, and Stripe billing tables (`apps/api/migrations/0000_nasty_payback.sql:1-160`).
- Shared types derive from `packages/supabase/src/types/db.ts` and specific domain helpers like `types/stories.ts:1-36`; regenerate types after migrations with `pnpm types:generate` as noted in the root README (`README.md:83-118`).
- Worker-side Drizzle query factories live in `packages/db/src/queries/*`; extend them before writing bespoke SQL so both worker and dashboard benefit.

## Tooling & Commands
- Use pnpm via Turbo scripts: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck` (`README.md:85-112`, `package.json:9-24`).
- Worker-specific scripts (connection, transcription) are declared in `apps/worker/README.md`; run `pnpm run test:connection` and `pnpm run test:transcription` before deploying worker changes.
- Formatting and linting default to Biome (`package.json:22-24`); avoid adding other formatters.
- Storybook and marketing app run alongside the dashboard via `pnpm dev` orchestrated in the root.

## Testing & Observability
- Dashboard relies on React Query suspense and TRPC. Add cover tests where possible (React Testing Library for components, Vitest where available).
- Worker logs must go through `log` (`apps/worker/src/log.ts`) to preserve structured output, and metrics snapshot endpoints (`/debug/status`) aid manual verification.
- Analytics events use `setupAnalytics` which respects cookie consent (`packages/events/src/server.ts:9-38`); ensure new flows call `waitUntil`-based `track` to keep serverless timing safe.

## Implementation Guardrails
- Favor server actions + streaming UI for new AI surfaces; follow the `generateEditorContent` pattern for deterministic prompts and output sections.
- Keep business logic inside shared packages or worker tasks—avoid embedding fetch/DB calls directly in React components.
- When introducing new state in the dashboard, store it in the URL via `nuqs` or colocated Zustand stores (create under `/stores/` following the stack defaults) to enable shareable workspaces.
- Maintain consistent logging keys in the worker (component prefixes like `comp: 'extract'`) for easier filtering.
- Validate inputs at the edge of Next.js route handlers; reference existing patterns once `@/src/utils/api-schemas` is restored/extended. If you cannot find the helper, create it centrally so routes stay uniform.

## Outstanding Notes
- Confirm the location of `@/src/utils/api-schemas`; referenced in API routes but not present in the repo scan. Reintroduce or generate these schemas before expanding API surface.
- Some TRPC scaffolding (e.g., `@/trpc/client`) is referenced without visible implementation; ensure those packages are synced when pulling from upstream.
- Keep an eye on duplicate Redis clients—prefer `@zeke/cache` inside long-lived services and `@zeke/kv` in serverless contexts to prevent socket exhaustion.

