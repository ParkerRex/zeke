# Dashboard Agent Preferences

## Coding Preferences
- Favor Next.js App Router patterns: default to server components for data-heavy views, add `"use client"` only when a React hook or browser API requires it.
- Lean on `@/trpc` clients and React Query for reads; pair mutations with `next-safe-action` server actions so side effects stay on the server and optimistic updates are guarded.
- Keep TypeScript strictness intact: prefer explicit return types, avoid `any`, and extend shared types from `@midday/*` packages before creating local duplicates.
- Model validation with Zod schemas that live beside the features they protect (actions, forms, APIs); reuse shared schemas from the database package when possible.
- Compose UI with the shared `@midday/ui` primitives and Tailwind utility classes; only reach for bespoke CSS when a component needs custom keyframes or global overrides.
- Manage page-level state with React Query caches or `src/store` Zustand slices; limit component-level `useState` to ephemeral UI knobs.
- Derive URL state via `nuqs` helpers (`useQueryStates`, `parseAs*`) so filters and modal steps stay shareable and reload-safe.
- Keep forms declarative: couple `react-hook-form` with the `useZodForm` helper, encapsulate sync work in hooks like `useUpload`, and surface activity through the shared `SubmitButton`.
- Encapsulate integrations (Plaid, Teller, Polar, Resend, Trigger.dev) behind dedicated modules in `src/utils` or `src/lib/tools`; never call third-party SDKs directly from components.
- When introducing new async flows, hook into the toast system from `@midday/ui/use-toast` and invalidate affected queries to keep the dashboard realtime.
- Guard time-sensitive logic with the UTC default set in `package.json` scripts and reuse helpers from `@midday/utils` for formatting, number flow, and date math.
- Keep instrumentation consistent by exporting traces from `instrumentation.ts` and logging through `src/utils/logger`; follow Sentry’s setup when capturing errors.
- Respect localization: load copy through `next-international` helpers in `src/locales` and ensure new routes live under `[locale]` with the providers wired in.
- Test where behaviour is non-trivial using `bun test` and component contracts with `@testing-library/react` (when introduced); run `biome check` before shipping.

## Layout Overview
``` markdown
apps/dashboard/
├── README.md                     # Minimal package readme; expand with onboarding notes if needed
├── image-loader.ts               # Custom Next image loader that maps to Midday’s CDN rules
├── next.config.mjs               # Next.js 15 configuration and experimental feature toggles
├── package.json                  # Application scripts, dependencies, and tooling definitions
├── postcss.config.cjs            # PostCSS plugins used by Tailwind during build
├── public/                       # Static assets served verbatim (favicons, images, manifest)
├── sentry.edge.config.ts         # Sentry runtime configuration for edge environments
├── sentry.server.config.ts       # Sentry setup for Node/serverless execution
├── src/                          # Source code for the dashboard experience
│   ├── actions/                  # Server actions exposed via next-safe-action
│   │   ├── ai/                   # AI-specific actions (assistant prompts, summaries)
│   │   ├── export-transactions-action.ts # Bundles CSV export logic into a safe action
│   │   ├── hide-connect-flow-action.ts   # Persists user preference to hide the connect modal
│   │   ├── institutions/         # Financial-institution mutations (linking, refreshing)
│   │   ├── mfa-verify-action.ts  # Handles multi-factor verification submissions
│   │   ├── revalidate-action.ts  # Triggers cache revalidation for incremental static paths
│   │   ├── send-feedback-action.tsx # Collects in-app feedback and forwards to support
│   │   ├── send-support-action.tsx   # Sends support ticket payloads to the inbox backend
│   │   ├── transactions/         # Transaction import, sync, and reconnect flows
│   │   ├── update-column-visibility-action.ts # Stores table visibility preferences
│   │   └── verify-otp-action.ts  # Validates one-time passwords during sensitive flows
│   ├── app/                      # Next.js App Router entrypoints and route layouts
│   │   ├── [locale]/             # Locale-scoped routes with shared providers
│   │   │   ├── (app)/            # Authenticated shell pages (sidebar, setup, teams, etc.)
│   │   │   ├── (public)/         # Public auth routes (login, verify, onboarding complete)
│   │   │   ├── error.tsx         # Locale-aware error boundary for route segments
│   │   │   ├── layout.tsx        # Root layout wiring themes, providers, and navigation
│   │   │   ├── not-found.tsx     # Fallback for unmatched locale routes
│   │   │   └── providers.tsx     # Client providers (themes, query client, i18n) per locale
│   │   └── api/                  # Edge-bound API routes proxied through the dashboard
│   │       ├── chat/route.ts     # Streams assistant responses via the AI gateway
│   │       ├── checkout/route.ts # Creates checkout sessions through the billing service
│   │       ├── portal/route.ts   # Generates customer portal access links
│   │       ├── preview/route.ts  # Builds preview payloads for transactional documents
│   │       └── proxy/route.ts    # Thin proxy for whitelisted external APIs
│   ├── components/               # Reusable UI building blocks grouped by domain
│   │   ├── assistant/            # Assistant panes, message list, and tool executions
│   │   ├── base-currency/        # Widgets for selecting and persisting base currency
│   │   ├── charts/               # Visualization primitives built on Recharts
│   │   ├── chat/                 # Chat composer, thread list, and AI tool surfaces
│   │   ├── forms/                # Form controls configured for react-hook-form
│   │   ├── inbox/                # Inbox list, filters, and detail view composites
│   │   ├── invoice/              # Invoice builder components and PDF previews
│   │   ├── modals/               # Modal shells and flows (imports, invites, etc.)
│   │   ├── notification-center/  # Notification popover and unread feeds
│   │   ├── oauth/                # OAuth application management tables and dialogs
│   │   ├── sheets/               # Bottom sheet patterns shared across the dashboard
│   │   ├── tables/               # Data tables with TanStack Table for each domain
│   │   ├── tracker/              # Project tracker cards, filters, and charts
│   │   ├── vault/                # Secure document vault viewers and upload widgets
│   │   └── widgets/              # Home widgets (assistant, spending, balances, etc.)
│   ├── hooks/                    # Client hooks for URL state, uploads, realtime, etc.
│   ├── instrumentation-client.ts # Client-side tracing bootstrap forwarded to Sentry
│   ├── instrumentation.ts        # OpenTelemetry/Sentry instrumentation configuration
│   ├── lib/                      # Helper libraries and domain-specific data loaders
│   │   ├── download.ts           # Shared file download utilities with streaming support
│   │   └── tools/                # Finance analytics helpers (burn rate, runway, revenue)
│   ├── locales/                  # next-international locale dictionaries and loaders
│   ├── middleware.ts             # Next middleware enforcing locale and auth guards
│   ├── store/                    # Zustand slices for cross-component state (assistant, vault)
│   ├── styles/                   # Global CSS entry point layered over Tailwind
│   ├── trpc/                     # tRPC client/server bindings and query helpers
│   ├── types/                    # Local ambient type declarations
│   └── utils/                    # Pure utilities for integrations, formatting, and config
├── tailwind.config.ts            # Tailwind theme tokens, plugins, and content mapping
├── tsconfig.json                 # TypeScript compiler options scoped to the dashboard
└── vercel.json                   # Vercel deployment configuration and routing overrides
