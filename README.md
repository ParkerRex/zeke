# ZEKE - AI-Powered News Intelligence Platform

> Codex Config tips:
> `codex --config model_reasoning_effort="high"`

**Status (2025-09-05)**: Core pipeline working! 47 raw items → 16 contents → 17 stories → 9 overlays → 9 embeddings processed. Worker running every 5 min with **real OpenAI GPT-4o-mini analysis**!

ZEKE is an intelligent news aggregation and analysis platform that ingests content from multiple sources (RSS, HN, Reddit, YouTube, arXiv), extracts and normalizes content, generates AI-powered summaries and insights, and serves them through a modern web interface.

## Architecture Overview

ZEKE consists of three main components:

1. **Next.js Web Application** - User interface and API endpoints
2. **Cloud Run Worker** - Background data processing pipeline
3. **Supabase Database** - PostgreSQL with pgvector for storage and vector search

### Current Data Flow

```
RSS Feeds (2 sources) → raw_items (47) → contents (16) → stories (17) → ✅ overlays (9) → ✅ embeddings (9)
                                                                          ↑ Real OpenAI Analysis ↑
```

## 🚀 Quick Start (Development)

### One-Command Setup

```bash
pnpm run dev
```

This will:

1. ✅ Start local Supabase database
2. ✅ Apply all migrations (including PgBoss setup)
3. ✅ Test worker connectivity
4. ✅ Start Next.js app (port 3000)
5. ✅ Start background worker

### Individual Commands

```bash
pnpm run dev:setup    # Setup database only
pnpm run dev:full     # Start Next.js + Worker (after setup)
pnpm run dev:next     # Start Next.js only
pnpm run dev:worker   # Start worker only
pnpm run stop         # Stop everything
```

### Testing

```bash
pnpm run test         # Test database + worker connectivity
pnpm run test:worker  # Test worker connection + job queue
```

### Services

- **Next.js App**: http://localhost:3000
- **Supabase Studio**: http://127.0.0.1:54323
- **Supabase API**: http://127.0.0.1:54321

## Current Status

### ✅ What's Working

**Data Pipeline Infrastructure:**

- **Ingestion**: 47 raw items from 2 RSS sources (Hacker News + Ars Technica)
- **Content Processing**: 16 contents extracted, 17 stories created with clean text
- **AI Analysis**: 9 overlays with GPT-4o-mini summaries, 9 embeddings with text-embedding-3-small
- **Worker Infrastructure**: pg-boss scheduling, Cloud Run deployment, 5-minute intervals
- **Database**: All tables created, pgvector enabled, proper indexes and constraints
- **Job Processing**: ingest:pull (17 completed), ingest:fetch-content (42 completed), analyze:llm (working)

**Next.js Application:**

- Modern React 19 + Next.js 15 setup with TypeScript
- Supabase integration for database and authentication
- Stripe integration for subscriptions and payments
- shadcn/ui components and Tailwind CSS styling
- Email system with React Email and Resend

### ✅ Recently Fixed

**LLM Analysis Pipeline (WORKING):**

- Real OpenAI GPT-4o-mini integration generating contextual "why it matters" summaries
- Smart chili scoring (0-5) and confidence ratings (0-1) based on content analysis
- Real embeddings using text-embedding-3-small (1536-dimensional vectors)
- Graceful fallbacks to stub analysis if OpenAI API fails
- Proper error handling and JSON parsing for reliable operation

### ✅ Recently Fixed

**API Endpoints (COMPLETE):**

- `/api/stories` now serves real database content with AI overlays
- `/api/stories/[id]` fully implemented with real story data and analysis
- Frontend successfully displaying processed stories with AI-powered insights

### 🚧 In Development

**Frontend Features:**

- Story reader interface and annotation system
- Tab-based navigation with pinning and keyboard shortcuts
- Company and industry analysis panels
- See [frontend task list](docs/prompts/wdim-tasks.md) for detailed status

**Pipeline Features:**

- Content clustering and deduplication
- Additional sources (Reddit, arXiv, YouTube)
- PDF and video transcript processing
- See [pipeline task list](docs/plans/pipeline-tasks.md) for detailed status

## Technology Stack

### Core Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + pgvector), Stripe, Resend
- **Worker**: Node.js, TypeScript, pg-boss, Cloud Run
- **Content Processing**: Mozilla Readability, fast-xml-parser, jsdom

### Data Pipeline Components

- **Scheduling**: pg-boss with cron-based job scheduling
- **Ingestion**: RSS/Atom feed parsing, content fetching with 15s timeouts
- **Extraction**: HTML cleaning with Readability, content hashing for deduplication
- **Analysis**: LLM integration for summaries and scoring (currently broken)
- **Storage**: PostgreSQL with pgvector for embeddings, Supabase Storage for raw content

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)

### 1. Clone and Install

```bash
git clone <your-repo>
cd zeke
pnpm install
cd worker && pnpm install && cd ..
```

### 2. Environment Setup

```bash
cp .env.local.example .env.development
# Fill in your Supabase, Stripe, and Resend credentials
```

### 3. Database Setup

```bash
# Link to your Supabase project
pnpm run supabase:link

# Run migrations to create tables
pnpm run migration:up

# Generate TypeScript types
pnpm run generate-types
```

### 4. Run Development Servers

**Frontend:**

```bash
pnpm run dev
# Visit http://localhost:3000
```

**Worker (for pipeline development):**

```bash
cd worker
cp .env.example .env.development
# Add your DATABASE_URL and other worker-specific env vars
pnpm run dev
```

### 5. Stripe Setup (for payments)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Configure products
stripe fixtures ./stripe-fixtures.json --api-key YOUR_STRIPE_SECRET_KEY
```

## Database Schema

The pipeline uses the following core tables:

- **`sources`** - RSS feeds and other content sources (2 configured)
- **`raw_items`** - Unprocessed items from sources (47 items)
- **`contents`** - Extracted and cleaned content with content_hash (16 items)
- **`stories`** - Normalized story records (15 items)
- **`story_overlays`** - AI-generated summaries and scores (0 items - BROKEN)
- **`story_embeddings`** - Vector embeddings for search (0 items - BROKEN)
- **`clusters`** - Groups of related stories (not yet implemented)
- **`highlights`** - User annotations and highlights

See [pipeline diagrams](docs/plans/pipeline-diagrams.md) for detailed schema and relationships.

## Data Pipeline Architecture

### How It Works (Current)

1. **Ingestion** (`ingest:pull`): Every 5 minutes, worker fetches new items from RSS feeds
2. **Content Fetch** (`ingest:fetch-content`): Downloads and extracts clean text using Readability
3. **Story Creation**: Generates content_hash for deduplication, creates story records
4. **Analysis** (`analyze:llm`): **BROKEN** - Should generate summaries, scores, and embeddings

### Worker Deployment

The worker runs on Google Cloud Run and processes jobs from pg-boss queues:

```bash
cd worker

# Deploy to production
pnpm run deploy:prod

# View logs
pnpm run logs

# View error logs only
pnpm run logs:errors
```

### Job Queues (pg-boss)

- **`system:heartbeat`** - Health check every 5 minutes ✅
- **`ingest:pull`** - Fetch new RSS items every 5 minutes ✅
- **`ingest:fetch-content`** - Extract content from URLs ✅
- **`analyze:llm`** - Generate AI summaries and embeddings ✅ WORKING

## Known Issues & Next Steps

### � Next Steps

1. **Build Reader Interface** - Story viewing and annotation features (highest priority)
2. **Add Content Sources** - Implement Reddit, arXiv, YouTube ingestion
3. **Implement Clustering** - Group related stories by similarity
4. **Enhance AI Analysis** - Add citation extraction and improved confidence scoring
5. **Add Highlights API** - Create `/api/highlights` for user annotations

See detailed task lists:

- [Pipeline Tasks](docs/plans/pipeline-tasks.md) - Worker and data processing
- [Frontend Tasks](docs/prompts/wdim-tasks.md) - UI and user experience

## Development Guide

### File Structure

```
├── src/                    # Next.js application
│   ├── app/               # App router pages and API routes
│   ├── components/        # Reusable UI components
│   ├── features/          # Feature-specific code (stories, auth, etc.)
│   └── libs/              # Shared utilities and clients
├── worker/                # Background processing pipeline
│   ├── src/               # Worker source code
│   └── scripts/           # Deployment and utility scripts
├── supabase/              # Database migrations and config
└── docs/                  # Project documentation
```

### Key Directories

- **`src/features/stories/`** - Story-related controllers and types (currently uses mock data)
- **`worker/src/`** - Data pipeline implementation (ingestion, extraction, analysis)
- **`supabase/migrations/`** - Database schema definitions
- **`docs/plans/`** - Architecture documentation and task tracking

### Environment Variables

**Frontend (`.env.development`):**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret
RESEND_API_KEY=your_resend_key
```

**Worker (`worker/.env.development`):**

```bash
DATABASE_URL=postgresql://worker:password@host:5432/postgres?sslmode=require
BOSS_SCHEMA=pgboss
BOSS_CRON_TZ=UTC
BOSS_MIGRATE=false
```

### Debugging the Pipeline

1. **Check job status:**

   ```sql
   SELECT name, state, COUNT(*) FROM pgboss.job GROUP BY name, state;
   ```

2. **View recent stories:**

   ```sql
   SELECT title, canonical_url, created_at FROM stories ORDER BY created_at DESC LIMIT 10;
   ```

3. **Check worker logs:**
   ```bash
   cd worker && pnpm run logs:errors
   ```

## Contributing

1. **Fix the LLM Analysis Bug** - The most critical issue blocking AI features
2. **Connect APIs to Database** - Replace mock data with real queries
3. **Add Content Sources** - Implement additional ingestion sources
4. **Improve UI/UX** - See [frontend tasks](docs/prompts/wdim-tasks.md)

## Documentation

- [Pipeline Architecture](docs/plans/pipeline-diagrams.md) - Visual diagrams of system components
- [Pipeline Specification](docs/plans/pipeline-spec.md) - Detailed technical specification
- [Pipeline Tasks](docs/plans/pipeline-tasks.md) - Current development status and tasks
- [Frontend Tasks](docs/prompts/wdim-tasks.md) - UI development checklist

---

**Current Priority**: Connect APIs to database to serve real story data with AI-powered summaries and insights.
