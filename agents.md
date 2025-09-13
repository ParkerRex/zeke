# Agents Guide

This document orients coding agents to the ZEKE codebase so they can work effectively and safely.

## Project Overview

ZEKE is an AI‑powered news intelligence platform that:

- Ingests items from sources (e.g., RSS) into a PostgreSQL/Supabase database
- Extracts and normalizes content, then analyzes it with LLMs
- Serves stories and insights via multiple Next.js applications

**Turborepo Monorepo Architecture:**

- **Main App** (`apps/app`) – Primary user interface and API routes (port 3000)
- **Marketing Site** (`apps/web`) – Public marketing website (port 3001)
- **Storybook** (`apps/storybook`) – Component development and documentation (port 6006)
- **Background Worker** (`apps/worker`) – pg-boss pipeline for ingestion, extraction, analysis (port 8082)
- **Supabase/PostgreSQL** – Database with pgvector for storage and embeddings
- **Shared Packages** (`packages/`) – Reusable code across applications

Primary goals: keep the pipeline healthy, improve analysis quality, and expand sources while maintaining reliable dev/test flows.

## Unified Development Workflow

### Quick Start

**Prerequisites:** Node.js 20+, pnpm, Docker, Supabase CLI

```bash
# One-time setup
pnpm dev:setup

# Start all services (full stack)
pnpm dev

# Stop all services
pnpm stop
```

### Development Commands

**Unified Commands (Root Level):**
- `pnpm dev` – Start all services with proper orchestration
- `pnpm dev:setup` – One-time environment setup and validation
- `pnpm dev:next` – Start main app only (`--filter=app`)
- `pnpm dev:web` – Start marketing site only (`--filter=web`)
- `pnpm dev:storybook` – Start Storybook only (`--filter=storybook`)
- `pnpm dev:worker` – Start worker service only
- `pnpm stop` – Gracefully stop all development services
- `pnpm test:pipeline` – Comprehensive pipeline health check

**Build & Validation:**
- `pnpm build` – Build all applications
- `pnpm typecheck` – Type check across all packages
- `pnpm lint` – Lint all code
- `pnpm test` – Run test suites

**Database & Types:**
- `pnpm db:migrate` – Apply migrations locally
- `pnpm db:reset` – Reset local database
- `pnpm types:generate` – Generate TypeScript types from schema
- `pnpm migration:new <slug>` – Create new migration

### Service URLs

When running `pnpm dev`, services are available at:
- **Main App:** http://localhost:3000
- **Marketing Site:** http://localhost:3001
- **Storybook:** http://localhost:6006
- **Supabase Studio:** http://127.0.0.1:54323
- **Worker API:** http://localhost:8082

### Development Workflow

1. **Initial Setup:**
   ```bash
   pnpm dev:setup  # Validates prerequisites, starts Supabase, runs migrations
   ```

2. **Full Stack Development:**
   ```bash
   pnpm dev  # Starts all services with dependency orchestration
   ```

3. **Focused Development:**
   ```bash
   pnpm dev --filter=app        # Main app only
   pnpm dev --filter=web        # Marketing site only
   pnpm dev --filter=storybook  # Component development only
   ```

4. **Pipeline Testing:**
   ```bash
   pnpm test:pipeline  # Validates Supabase, worker, and database connectivity
   ```

### Service Orchestration

The unified workflow handles:
- **Dependency Order:** Supabase → Migrations → Worker → Apps
- **Health Checks:** Validates services are ready before proceeding
- **Graceful Shutdown:** Properly stops all processes and containers
- **Error Handling:** Continues with warnings for non-critical failures

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

- Parsers live in `src/lib/nuqs.ts` (create if missing). Add and reuse:
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

## Supabase Client Architecture

### Overview

The ZEKE project uses a centralized Supabase client architecture through the `@zeke/supabase` package. This package provides typed database clients, queries, mutations, and utilities for consistent database access across the monorepo.

### Package Structure

```
packages/supabase/
├── src/
│   ├── clients/
│   │   └── admin.ts              # Admin client (service role)
│   ├── queries/
│   │   └── index.ts              # Read-only database operations
│   ├── mutations/
│   │   └── index.ts              # Database write operations
│   ├── types/
│   │   ├── db.ts                 # Generated Supabase types
│   │   ├── pricing.ts            # Domain-specific types
│   │   └── stories.ts            # Story-related types
│   └── utils/
│       └── transform.ts          # Data transformation utilities
├── keys.ts                       # Environment variable validation
└── package.json                  # Package exports configuration
```

### API Reference

#### Clients

**Admin Client**
```typescript
import { supabaseAdminClient } from '@zeke/supabase/admin';

// Service role client - bypasses RLS, use with caution
const { data, error } = await supabaseAdminClient
  .from('customers')
  .select('*')
  .eq('id', userId);
```

**Server Client (from @zeke/auth)**
```typescript
import { createSupabaseServerClient } from '@zeke/auth';

// User-scoped client - respects RLS and session cookies
const supabase = await createSupabaseServerClient();
const { data, error } = await supabase
  .from('users')
  .select('*')
  .single();
```

#### Queries (Read Operations)

```typescript
import {
  getUser,
  getSession,
  getSubscription,
  getCustomerId,
  getAdminFlag,
  listStories
} from '@zeke/supabase/queries';

// Get current user data
const userResult = await getUser();
if (userResult.success) {
  console.log(userResult.data);
}

// Get current user session
const session = await getSession();

// Get user's active subscription
const subscription = await getSubscription();

// Get customer ID for Stripe integration
const customerId = await getCustomerId({ userId: 'user-id' });

// Check if user has admin privileges
const { userId, isAdmin } = await getAdminFlag();

// List stories with overlays and content
const stories = await listStories();
```

#### Mutations (Write Operations)

```typescript
import {
  upsertProduct,
  upsertPrice,
  softDeleteProduct
} from '@zeke/supabase/mutations';

// Create or update a Stripe product
await upsertProduct(stripeProduct);

// Create or update a Stripe price
await upsertPrice(stripePrice);

// Soft delete a product (sets active: false)
await softDeleteProduct('prod_123');
```

#### Types

```typescript
import type {
  Database,
  Tables,
  ProductWithPrices,
  SubscriptionWithProduct,
  Cluster
} from '@zeke/supabase/types';

// Database schema types
type User = Tables<'users'>;
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

// Domain-specific types
const products: ProductWithPrices[] = await getProducts();
const subscription: SubscriptionWithProduct | null = await getSubscription();
const stories: Cluster[] = await listStories();
```

### Data Layers: Queries, Mutations, Actions

Keep data access boring and obvious. Names reflect what each file does and where it belongs.

#### Layer Definitions

- **Queries** (read-only DB): Pure database reads with no side effects
  - Location: `@zeke/supabase/queries`
  - Rules: No side effects, no 3rd‑party calls, just typed Supabase reads
  - Examples: `getSession()`, `listStories()`, `getCustomerId()`

- **Mutations** (DB writes): Pure database writes with no business logic
  - Location: `@zeke/supabase/mutations`
  - Rules: No 3rd‑party calls; return typed results/IDs; parameterized inputs
  - Examples: `upsertProduct()`, `softDeleteProduct()`

- **Actions** (business logic): Orchestrate multiple services and enforce business rules
  - Location: `apps/app/actions/<area>/<verb-noun>.ts`
  - Rules: May call queries/mutations and 3rd‑party APIs; enforce domain rules; side effects allowed
  - Examples: `apps/app/actions/account/get-or-create-customer.ts`

#### Client Usage Patterns

**When to use Admin Client:**
- Server actions that need to bypass RLS
- Background jobs and worker processes
- System-level operations (user creation, admin functions)
- Never import into client components

**When to use Server Client:**
- Server components and route handlers
- User-scoped operations that respect RLS
- Authentication-aware database access
- Operations that need session context

**Example: Action vs Query/Mutation**
```typescript
// ❌ Don't put business logic in queries/mutations
export async function getOrCreateCustomer() {
  // This belongs in actions/ because it:
  // 1. Calls multiple services (Supabase + Stripe)
  // 2. Contains business logic
  // 3. Has side effects
}

// ✅ Keep queries pure
export async function getCustomerId({ userId }: { userId: string }) {
  // Pure database read - belongs in queries
  const { data, error } = await supabaseAdminClient
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) throw new Error('Error fetching stripe_customer_id');
  return data.stripe_customer_id as string;
}
```

### Configuration Options

**Environment Variables:**
```bash
# Required for admin client
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for server client (from @zeke/auth)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Package Exports:**
- `@zeke/supabase/admin` - Admin client
- `@zeke/supabase/queries` - Read operations
- `@zeke/supabase/mutations` - Write operations
- `@zeke/supabase/types` - TypeScript types
- `@zeke/supabase/keys` - Environment validation

### Error Handling

**Query/Mutation Error Patterns:**
```typescript
// ✅ Throw on unexpected errors, return null for not found
export async function getCustomerId({ userId }: { userId: string }) {
  const { data, error } = await supabaseAdminClient
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) throw new Error('Error fetching stripe_customer_id');
  return data.stripe_customer_id as string;
}

// ✅ Handle expected null results gracefully
export async function getSubscription() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (error) throw new Error('Error fetching subscription');
  return data; // Can be null
}
```

**Action Error Patterns:**
```typescript
// ✅ Actions can have more complex error handling
export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }) {
  try {
    // Try to get existing customer
    const customerId = await getCustomerId({ userId });
    return customerId;
  } catch (error) {
    // Create new customer if not found
    const customer = await stripeAdmin.customers.create({
      email,
      metadata: { userId },
    });

    // Store in database
    await supabaseAdminClient
      .from('customers')
      .insert([{ id: userId, stripe_customer_id: customer.id }]);

    return customer.id;
  }
}
```

## Project Organization (Layer‑First)

We use a layer‑first (aka by‑type) structure, with domain (area) subfolders for clarity. This keeps “all X in one place” easy to find and grep.

**Monorepo Structure:**
- Apps: `apps/<app-name>/` (app, web, storybook, worker)
- Packages: `packages/<package-name>/` (shared utilities, design system)
- Database: `packages/supabase/` (queries, mutations, types)

**Within Apps:**
- Queries (read‑only DB): `packages/supabase/queries/<area>/<verb-noun>.ts`
- Mutations (DB writes): `packages/supabase/mutations/<area>/<verb-noun>.ts`
- Actions (business logic): `apps/<app>/actions/<area>/<verb-noun>.ts`
- Components:
  - Shared primitives: `packages/design-system/components/ui/*`
  - App components: `apps/<app>/components/<area>/*`

**Example Structure:**
```
apps/
  app/
    actions/
      pricing/create-checkout-session.ts
      account/get-or-create-customer.ts
    components/
      pricing/price-card.tsx
      stories/story-list.tsx
  web/
    components/
      marketing/hero-section.tsx
packages/
  supabase/
    queries/
      stories/list-stories.ts
      account/get-session.ts
    mutations/
      pricing/upsert-product.ts
  design-system/
    components/ui/button.tsx
```

**Naming Conventions:**
- Names say exactly what they do (verbs): `get-story-by-id`, `list-stories`, `upsert-product`
- Actions may compose queries, mutations, and 3rd‑party SDKs; queries/mutations must not
- Avoid barrels; import from concrete files to keep intent explicit and navigation simple

## Security Considerations

- **Secrets**: Never commit `.env*` files. Use `.env.development` (root) and `apps/worker/.env.development` locally
- **Supabase keys**: `NEXT_PUBLIC_*` are public; keep `SUPABASE_SERVICE_ROLE_KEY` server‑only
- **API keys**: OpenAI/third‑party keys are server‑only, do not expose in client bundles
- **Validation**: Treat source URLs and external content as untrusted; validate and time out fetches
- **Data access**: Guard server routes and worker tasks with explicit checks; avoid leaking PII in logs
- **Environment access**: Use `getEnvVar(...)` so missing critical config fails fast

If in doubt, prefer server‑side execution for anything that touches secrets or the database, and avoid logging credentials or raw tokens.

## Database Management

### Supabase Best Practices

- **Realtime**: Prefer `broadcast` with private channels and granular topics over `postgres_changes`
- **Postgres style**: Use snake_case, explicit schemas, clear naming, consistent formatting, and comments
- **DB functions**: Default to `SECURITY INVOKER`, set `search_path = ''`, fully qualify object names, and favor `IMMUTABLE`/`STABLE` where possible

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

The unified development workflow (`pnpm dev:setup`) automatically handles worker role setup and database configuration.
