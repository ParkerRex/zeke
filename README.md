# ∆ / ZEKE

**AI-Powered News Intelligence Platform**

ZEKE ingests news from multiple sources, analyzes it with LLMs, and delivers stories and insights through modern web applications.

## Architecture

**Turborepo Monorepo Structure:**

- **Main App** (`apps/app`) – Primary user interface and API routes
- **Marketing Site** (`apps/web`) – Public marketing website
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

## VS Code Debugging

ZEKE includes comprehensive VS Code debugging configurations optimized for the multi-service architecture. The setup supports debugging across Next.js apps, Node.js worker processes, and client-side code.

### Quick Start

1. **Open VS Code** in the project root
2. **Press F5** or go to Run & Debug panel (Ctrl/Cmd+Shift+D)
3. **Choose your debugging scenario** from the dropdown

### Debug Configurations

#### 🚀 **Full Stack Development**
- **ZEKE: Full Stack (All Services)** - Starts all services with `pnpm dev`
- **ZEKE: Full Pipeline Debug** - Adds debug logging with `DEBUG=zeke:*`

#### 📱 **Individual Services**
- **Dashboard App (port 3000)** - Main user interface
- **Marketing Web (port 3001)** - Landing/marketing site
- **Worker (Node.js)** - Background processing with tsx watch
- **Email Templates (port 3003)** - React Email development
- **Supabase Local** - Database services

#### ⚙️ **Worker Debugging** (News Intelligence Pipeline)
- **Worker: Debug with Breakpoints** - Direct Node.js debugging with breakpoints
- **Worker: Docker Container** - Production-like container debugging

#### 🌐 **Browser Debugging**
- **Chrome: Dashboard App** - Client-side debugging at localhost:3000
- **Chrome: Marketing Site** - Client-side debugging at localhost:3001
- **Chrome: Email Templates** - Email template preview at localhost:3003
- **Chrome: Supabase Studio** - Database management at localhost:54323

#### 🔧 **Advanced Full-Stack**
- **Dashboard: Full Stack Debug** - Server + client debugging with Edge runtime
- **Marketing: Full Stack Debug** - Complete marketing site debugging

### Debugging Workflows

#### **News Pipeline Debugging**
Perfect for debugging RSS ingestion, content extraction, and LLM analysis:

1. Set breakpoints in worker code (`apps/worker/src/`)
2. Launch **"🔍 Worker: Debug with Breakpoints"**
3. Trigger ingestion via dashboard or API calls
4. Step through the entire pipeline from source to analysis

#### **Full-Stack Feature Development**
Debug interactions between frontend, API routes, and background processing:

1. Launch **"🔧 Dashboard: Full Stack Debug"**
2. Set breakpoints in both client and server code
3. Debug user actions that trigger background jobs
4. Monitor real-time data flow from UI to worker to database

#### **Multi-Service Coordination**
Debug complex interactions across services:

1. Launch **"🚀 ZEKE: Full Pipeline Debug"** for logging
2. Use individual service debuggers for specific breakpoints
3. Monitor logs and breakpoints across all services simultaneously

### Debugging Features

- **Organized configurations** grouped by purpose and service
- **Proper working directories** for each service
- **Environment variables** configured for development
- **Source maps** enabled for TypeScript debugging
- **Skip node internals** for cleaner debugging experience
- **Integrated terminal** support for background processes

### Supporting Tasks

The setup includes VS Code tasks for common operations:
- **build-worker** - Compile worker TypeScript
- **dev-setup** - Run full development setup
- **test-pipeline** - Validate entire pipeline
- **supabase-start/stop** - Database service management
- **worker-logs** - View Docker container logs

Access tasks via **Ctrl/Cmd+Shift+P** → "Tasks: Run Task"

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
