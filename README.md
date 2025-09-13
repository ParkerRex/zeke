# ∆ / ZEKE

**AI-Powered News Intelligence Platform**

ZEKE ingests news from multiple sources, analyzes it with LLMs, and delivers stories and insights through modern web applications.

## Architecture

**Turborepo Monorepo Structure:**

- **Main App** (`apps/app`) – Primary user interface and API routes
- **Marketing Site** (`apps/web`) – Public marketing website  
- **Storybook** (`apps/storybook`) – Component development and documentation
- **Background Worker** (`apps/worker`) – pg-boss pipeline for ingestion, extraction, analysis
- **Supabase/PostgreSQL** – Database with pgvector for storage and embeddings
- **Shared Packages** (`packages/`) – Reusable utilities, design system, and configurations

## Quick Start

### Prerequisites

- **Node.js 20+** (current requirement)
- **pnpm** (package manager)
- **Docker** (for Supabase and worker containers)
- **Supabase CLI** (`npm install -g supabase`)

### Development Setup

```bash
# One-time setup (validates prerequisites, starts services, runs migrations)
pnpm dev:setup

# Start all services (full stack development)
pnpm dev

# Stop all services
pnpm stop
```

### Service URLs

When running `pnpm dev`, access services at:

- **Main App:** http://localhost:3000
- **Marketing Site:** http://localhost:3001
- **Storybook:** http://localhost:6006
- **Supabase Studio:** http://127.0.0.1:54323
- **Worker API:** http://localhost:8082

## Development Commands

### Unified Workflow

```bash
# Full stack development
pnpm dev                    # Start all services with orchestration
pnpm dev:setup             # One-time environment setup
pnpm stop                  # Stop all services gracefully

# Individual services (Turborepo filtering)
pnpm dev --filter=app      # Main app only
pnpm dev --filter=web      # Marketing site only  
pnpm dev --filter=storybook # Storybook only
pnpm dev:worker            # Worker service only

# Build and validation
pnpm build                 # Build all applications
pnpm typecheck            # Type check across packages
pnpm lint                 # Lint all code
pnpm test:pipeline        # Comprehensive health check
```

### Database Management

```bash
# Local database operations
pnpm db:migrate           # Apply migrations locally
pnpm db:reset            # Reset local database
pnpm types:generate      # Generate TypeScript types
pnpm migration:new <name> # Create new migration
```

## Development Workflow

### 1. Initial Setup

Run the setup command to validate your environment:

```bash
pnpm dev:setup
```

This will:
- Check Node.js 20+, pnpm, Docker, and Supabase CLI
- Start Supabase if not running
- Apply database migrations
- Generate TypeScript types
- Install dependencies

### 2. Full Stack Development

Start all services with proper orchestration:

```bash
pnpm dev
```

This starts services in dependency order:
1. Supabase (if not running)
2. Database migrations
3. Worker container
4. Next.js applications

### 3. Focused Development

Use Turborepo filtering for individual services:

```bash
# Work on main app only
pnpm dev --filter=app

# Work on marketing site only  
pnpm dev --filter=web

# Component development
pnpm dev --filter=storybook
```

### 4. Pipeline Testing

Validate the entire pipeline:

```bash
pnpm test:pipeline
```

Tests:
- Supabase connectivity
- Worker health and job queue
- Database permissions
- Type checking
- Build processes

## Stripe Integration (Optional)

For payment features, set up Stripe webhooks:

### Setup

1. **Start webhook listener:**
   ```bash
   stripe listen --forward-to=localhost:3000/api/webhooks
   ```

2. **Configure environment:**
   Add the webhook secret to `.env.development`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Seed test data:**
   ```bash
   stripe fixtures ./apps/app/stripe-fixtures.json
   ```

### Webhook Resiliency

The webhook handler (`apps/app/app/api/webhooks/route.ts`) handles out-of-order events:
- Automatically fetches missing Product data when processing Price events
- Retries failed operations with proper error handling
- Maintains data consistency across Stripe and database

## Troubleshooting

### Common Issues

**Node.js Version:** Ensure you're using Node.js 20+
```bash
node --version  # Should show v20.x.x or higher
```

**Service Ports:** Check if ports are already in use:
```bash
lsof -i :3000  # Main app
lsof -i :3001  # Marketing site
lsof -i :8082  # Worker
```

**Database Connection:** Test worker database connectivity:
```bash
cd apps/worker && pnpm run test:connection
```

**Pipeline Health:** Run comprehensive checks:
```bash
pnpm test:pipeline
```

### Getting Help

- Check service logs: `docker logs -f zeke-worker-local-8082`
- Validate Supabase: Visit http://127.0.0.1:54323
- Review environment files: `.env.development`, `apps/worker/.env.development`

## Contributing

This monorepo uses:
- **Turborepo** for build orchestration and caching
- **TypeScript** strict mode across all packages
- **Biome** for formatting and linting
- **pnpm** for package management

See `agents.md` for detailed development guidelines and architecture patterns.
