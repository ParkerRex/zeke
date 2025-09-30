# Zeke - Turn 10 Hours of Research into 5 Minutes of Insights

## What Zeke Actually Is

Zeke is an AI-powered research assistant that transforms overwhelming content (podcasts, papers, videos, blogs) into actionable business intelligence. Think of it as "Bloomberg Terminal for AI research" - turning sprawling content into verified insights with citations and ready-to-use playbooks.

**The Promise**: Go from 10 hours of research → 5 minutes of cited, goal-aware outputs.

## Why This Codebase Looks Weird

**Honest context**: We forked this from Midday (an open-source finance app) because their architecture was exactly what we needed - just for research content instead of bank transactions. So yes, you'll find references to invoices, bank accounts, and transactions throughout the code. We're systematically replacing these with research concepts (sources, stories, insights) but kept the patterns because they work.

Think of it like buying a restaurant and turning it into a coffee shop - the kitchen layout still works, you just brew coffee instead of cooking steaks.

## The Architecture (Simple Version)

```
Research Sources → Engine → Jobs → AI Analysis → Dashboard
```

1. **Engine** ("Plaid for research content"): Connects to YouTube, arXiv, RSS, Twitter
2. **Jobs** (Intelligence layer): Applies AI to extract insights and generate playbooks
3. **Dashboard**: Shows what matters, why it matters, and what to do about it

## Project Structure

```
zeke/
├── apps/
│   ├── api/          # Main API (TRPC + REST) - handles all business logic
│   ├── dashboard/    # Next.js app - where users interact with insights
│   ├── engine/       # Cloudflare Worker - fetches content from sources
│   └── website/      # Marketing site (not core to product)
│
├── packages/
│   ├── db/           # Database schema and queries (Drizzle ORM)
│   ├── jobs/         # Background job orchestration (Trigger.dev)
│   ├── ui/           # Shared React components
│   └── [others]/     # Various utilities and shared code
│
└── docs/
    └── system-prompts/  # AI prompts that turn content into insights
```

## The Core Flow

### What Happens When You Drop in a YouTube Link

1. **Dashboard** → User pastes link
2. **API** → Validates and triggers ingestion
3. **Engine** → Fetches video, transcript, metadata
4. **Jobs** → Orchestrates the pipeline:
   - Store raw content
   - Apply AI extraction (`extract-video.prompt.md`)
   - Generate highlights with timestamps
   - Create actionable playbook
5. **Dashboard** → Display insights, "why it matters", next steps

### The Magic: ContentAnalysis

Every piece of content becomes a structured `ContentAnalysis` object:

```typescript
{
  title: "How Cursor Built Their AI Editor",
  highlights: [
    "Used GPT-4 for code completion (t 5:23)",
    "100ms latency requirement for UX (t 12:45)"
  ],
  whyItMatters: "Directly supports your goal: improve developer velocity",
  keyTakeaways: [...],
  playbook: {
    objective: "Implement AI-assisted coding",
    steps: [
      { action: "Audit current IDE performance", owner: "Tech Lead", timeline: "Week 1" }
    ]
  }
}
```

## Midday → Zeke Concept Mapping

Since we forked from Midday, here's the translation table:

| Midday (Finance) | Zeke (Research) | Purpose |
|-----------------|-----------------|----------|
| Bank Accounts | Content Sources | Where data comes from |
| Transactions | Raw Items | Individual pieces of content |
| Invoice/Receipt | Article/Video | Actual content |
| Categories | Topics/Tags | Classification |
| Spending Report | Research Brief | Summarized insights |
| Bank Connection | Source Connection | OAuth/API integration |
| Magic Inbox | Source Inbox | Auto-import content |
| Vault | Library | Content storage |

## Current State (November 2024)

### ✅ What Works
- Database schema (adapted for research)
- Authentication and team management
- Dashboard layout and components
- Trigger.dev job orchestration
- AI extraction prompts

### 🚧 In Progress
- **Engine providers**: YouTube, arXiv, RSS (empty directories, need implementation)
- **Dashboard wiring**: Components exist but need to connect to new TRPC endpoints
- **Story pipeline**: Logic exists but needs to replace transaction concepts

### 📋 Still Has Finance Code
- Variable names (invoices, transactions)
- Some UI components (invoice sheets, bank icons)
- Database tables (being migrated)

## Getting Started

### Prerequisites
```bash
# Required
- Node 20+
- pnpm 8+
- PostgreSQL (or Supabase local)

# Services (can run without for basic dev)
- Supabase account (auth, storage)
- OpenAI API key (AI analysis)
- Trigger.dev account (job orchestration)
```

### Local Development
```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your API keys to .env.local

# Start Supabase locally
supabase start

# Run database migrations
pnpm db:migrate

# Start everything
pnpm dev

# Access at
# - Dashboard: http://localhost:3000
# - API: http://localhost:3001
```

## Key Directories to Understand

### For AI/Content Processing
- `docs/system-prompts/` - The prompts that extract insights
- `packages/jobs/src/tasks/insights/` - Where AI gets applied
- `apps/engine/src/providers/` - Content source connectors (TODO)

### For Product Features
- `apps/dashboard/src/components/` - UI components
- `apps/api/src/trpc/routers/` - API endpoints
- `packages/db/src/schema.ts` - Data model

### For Understanding the Migration
- `.agents/features/in-progress/mapping-plan.md` - Midday → Zeke conversion plan
- `.agents/features/dashboard-wireframe/` - New dashboard design

## Architecture Decisions

### Why Cloudflare Worker for Engine?
- Stateless content fetching scales globally
- Built-in KV storage for OAuth tokens
- Excellent for API aggregation

### Why Trigger.dev for Jobs?
- Replaces pg-boss (PostgreSQL job queue)
- Better observability and error handling
- Handles long-running AI tasks well

### Why Keep Midday's Patterns?
- Proven multi-tenant architecture
- Solid team/permissions system
- Production-tested component patterns

## Common Confusions

**Q: Why are there invoice components in a research app?**
A: We're replacing them with research components, but kept them temporarily as reference implementations.

**Q: What's the difference between Engine and Jobs?**
A: Engine fetches content (like Plaid fetches bank data). Jobs processes it with AI (like Mint analyzes spending).

**Q: Why is there both TRPC and REST?**
A: TRPC for internal dashboard ↔ API communication (type-safe). REST for public endpoints and AI streaming.

**Q: What's with all the `.agents/` directories?**
A: AI-assisted development artifacts. Contains planning docs and implementation notes.

## How to Contribute

1. **Pick a domain**: Engine providers, Dashboard components, or AI prompts
2. **Check the mapping**: See `.agents/features/in-progress/mapping-plan.md`
3. **Follow patterns**: Copy Midday's structure but with Zeke concepts
4. **Test with real content**: Use actual YouTube videos, papers, blogs

## The Vision

Zeke will be the "easy button" for AI research. Drop in any content link, get back:
- What matters (with citations)
- Why it matters (to YOUR goals)
- What to do about it (actionable playbooks)
- How to share it (publishable briefs)

No more 10-hour podcast marathons. No more skimming papers and missing the key insight. No more "I'll watch this later" guilt.

Just insights, evidence, and actions.

---

**Note**: This is an active migration from Midday's finance architecture to Zeke's research domain. Expect some cognitive dissonance between file names and actual functionality. We're fixing it systematically - the patterns are right, the naming is catching up.

For questions: Check the docs, read the code comments, or look at the `.agents/` planning documents. They contain the real story of where we're going.

---

## Technical Reference

### For DB Changes
Drizzle Flow
  - packages/db/src/schema.ts is the canonical schema file; define new tables/columns
  there before touching anything else.
  - The Drizzle CLI reads packages/db/drizzle.config.ts:1, so export your Supabase
  session pooler URL as DATABASE_SESSION_POOLER (and, when running the API, the
  region-specific URLs such as DATABASE_PRIMARY_URL, etc.).
  - From the repo root run cd packages/db && bunx --bun drizzle-kit generate --name
  add_my_table to emit a SQL migration into the migrations/ folder that lives
  alongside the config; commit the generated SQL plus the updated schema.
  - To get the changes into a local database, point DATABASE_SESSION_POOLER (or
  DATABASE_PRIMARY_URL) at your local Postgres/Supabase instance and run bunx --bun
  drizzle-kit push:pg; the command applies whatever is new in migrations/.
  - For the hosted Supabase project, repeat the push with the production pooler
  string (you’ll find it in Supabase → Project Settings → Database); use a service-
  role key and make sure you’re targeting the right environment before running the
  command.
  - After pushing, restart whatever services depend on the schema (API, jobs, etc.)
  so they pick up the new structure.

  Supabase Types

  - The generated client types live in packages/supabase/src/types/db.ts, and the
  package exposes them via packages/supabase/src/types/index.ts.
  - Install and log in with the Supabase CLI (supabase login), set PROJECT_ID (and
  SUPABASE_ACCESS_TOKEN if you’re using service tokens), then run cd packages/
  supabase && bun run db:generate; this pipes supabase gen types --lang=typescript
  into src/types/db.ts.
  - Commit the regenerated types together with the migration so downstream apps
  (@zeke/supabase) stay in sync.
  - If you need to verify everything end-to-end, rerun the relevant service (bunx
  turbo dev --filter=@zeke/api, etc.) and/or whatever tests exercise the new tables
  before opening a PR.




### Trigger.dev Job Structure (Zeke)

```
packages/jobs
├── package.json
├── scripts
│   └── ensure-ingest-schedule.ts
├── src
│   ├── init.ts
│   ├── schema.ts
│   ├── lib
│   │   ├── array
│   │   │   └── chunk.ts
│   │   ├── async
│   │   │   └── withRetry.ts
│   │   ├── http
│   │   │   └── fetchWithTimeout.ts
│   │   ├── openai
│   │   │   ├── cleanJsonResponse.ts
│   │   │   ├── constants.ts
│   │   │   ├── generateAnalysis.ts
│   │   │   ├── generateEmbedding.ts
│   │   │   ├── generateStubAnalysis.ts
│   │   │   ├── generateStubEmbedding.ts
│   │   │   ├── openaiClient.ts
│   │   │   └── types.ts
│   │   ├── rss
│   │   │   ├── buildDiscoveryArticle.ts
│   │   │   ├── normalizeRssItem.ts
│   │   │   └── parseRssFeed.ts
│   │   └── url
│   │       ├── canonicalizeUrl.ts
│   │       └── hashText.ts
│   ├── tasks
│   │   ├── analyzeStory.ts
│   │   ├── fetchContent.ts
│   │   ├── ingestPull.ts
│   │   ├── ingestSource.ts
│   │   ├── oneOffIngest.ts
│   │   └── index.ts
│   └── utils
│       ├── base-currency.ts
│       ├── blob.ts
│       ├── check-team-plan.ts
│       ├── embeddings.ts
│       ├── enrichment-helpers.ts
│       ├── enrichment-schema.ts
│       ├── generate-cron-tag.ts
│       ├── inbox-matching-notifications.ts
│       ├── parse-error.ts
│       ├── process-batch.ts
│       ├── resend.ts
│       ├── smart-matching.ts
│       ├── text-preparation.ts
│       ├── transaction-notifications.tsx
│       ├── transform.test.ts
│       ├── transform.ts
│       ├── trigger-batch.ts
│       ├── trigger-sequence.ts
│       └── update-invocie.ts
└── trigger.config.ts
```
