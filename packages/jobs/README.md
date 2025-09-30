# Zeke Jobs - The Intelligence Layer

## Executive Summary

Jobs is Zeke's orchestration and intelligence layer, powered by Trigger.dev. While the Engine fetches and normalizes content from research sources, Jobs applies AI to transform that content into structured insights, playbooks, and actionable intelligence. Think of it as the "brain" that turns raw research into `ContentAnalysis` JSON.

**Key Insight**: Engine is to Jobs what Plaid is to Mint - Engine provides normalized data access, Jobs provides intelligent analysis.

## Architecture Overview

### The Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Engine    │────▶│     Jobs     │────▶│  AI Prompts   │────▶│   Database   │
│  (Fetch)    │     │ (Orchestrate)│     │  (Transform)  │     │   (Store)    │
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘
     │                     │                      │                     │
  Stateless            Stateful              Intelligence          Persistence
  - OAuth             - Workflows            - extract-pdf       - Stories
  - Fetch             - Scheduling           - extract-blog      - Highlights
  - Normalize         - Retries              - extract-video     - Playbooks
```

### Division of Labor

**What Jobs DOES:**
- Orchestrates multi-step workflows (fetch → enrich → analyze → notify)
- Applies AI extraction prompts to normalized content
- Manages deduplication and story clustering
- Handles scheduling and retries
- Stores processed results in database
- Generates playbooks aligned to business goals

**What Jobs DOES NOT DO:**
- Connect directly to external APIs (that's Engine's job)
- Handle OAuth flows (Engine manages auth)
- Store raw API responses (uses Engine's normalized format)

## Task Organization

```
packages/jobs/src/tasks/
├── sources/                    # Content ingestion pipeline
│   ├── pull/                   # Scheduled fetching from Engine
│   │   ├── rss.ts             # Pull RSS feeds via Engine
│   │   ├── youtube.ts         # Pull YouTube videos via Engine
│   │   └── manual.ts          # On-demand URL ingestion
│   ├── ingest/                 # Process and store
│   │   ├── from-feed.ts       # Process RSS items
│   │   └── from-upload.ts     # Process user uploads
│   ├── enrich/                 # Enhance content
│   │   └── fetch-content.ts   # Get full text/transcripts
│   └── link/
│       └── to-stories.ts      # Connect sources to stories
│
├── insights/                    # AI intelligence layer
│   ├── generate.ts             # Apply extraction prompts
│   ├── dedupe.ts              # Prevent duplicate insights
│   └── attach-to-story.ts     # Link insights to narratives
│
├── stories/                     # Narrative assembly
│   ├── summarize.ts           # Build story summaries
│   └── update-status.ts       # Manage story lifecycle
│
└── playbooks/                   # Actionable automation
    ├── run.ts                  # Execute playbook workflow
    └── steps/
        ├── gather-context.ts   # Collect business context
        ├── branch-content.ts   # Route by content type
        └── finalize.ts         # Generate final playbook
```

## Integration with Engine

### Example Flow: YouTube Video Processing

```typescript
// 1. Jobs schedules a pull (sources/pull/youtube.ts)
export const pullYouTube = schemaTask({
  id: "pull-youtube",
  schedule: "every 30 minutes",
  run: async () => {
    // Call Engine to get normalized content
    const videos = await engine.youtube.getContent({
      channelIds: user.subscriptions,
      since: lastPull
    });

    // Trigger processing for each video
    for (const video of videos) {
      await generateInsights.trigger({ content: video });
    }
  }
});

// 2. Jobs applies AI extraction (insights/generate.ts)
export const generateInsights = schemaTask({
  id: "generate-insights",
  run: async ({ content }) => {
    // Apply the appropriate extraction prompt
    const analysis = await extractVideo({
      transcript: content.transcript,
      businessContext: {
        companyName: user.company,
        strategicGoals: user.goals,
        kpis: user.metrics
      }
    });

    // Store ContentAnalysis with citations, playbooks
    await storeAnalysis(analysis);
  }
});

// 3. Result: Structured ContentAnalysis
{
  title: "How Cursor built their AI editor",
  highlights: [
    "Used GPT-4 for code completion (t 5:23)",
    "100ms latency target for suggestions (t 12:45)"
  ],
  whyItMatters: "Directly supports Goal: improve developer velocity",
  keyTakeaways: [...],
  playbook: {
    objective: "Implement AI code completion",
    steps: [
      {
        label: "Audit current IDE latency",
        owner: "Engineering Lead",
        timeline: "Week 1"
      }
    ]
  }
}
```

## AI Extraction Prompts

Jobs applies three main extraction prompts (found in `docs/system-prompts/`):

### extract-pdf.prompt.md
- Processes academic papers and technical documents
- Extracts: novelty, prerequisites, citations, reproducibility
- Output: `ContentAnalysis` with page-level citations

### extract-blog.prompt.md
- Processes blog posts and articles
- Extracts: key points, quotes, frameworks
- Output: `ContentAnalysis` with section citations

### extract-video.prompt.md
- Processes video transcripts (YouTube, podcasts)
- Extracts: key moments, speaker positions, timestamps
- Output: `ContentAnalysis` with time-based citations

## Scheduling & Orchestration

Jobs uses Trigger.dev v3 for orchestration:

```typescript
// Recurring schedules
schedules.create({
  id: "pull-all-sources",
  cron: "0 */6 * * *",  // Every 6 hours
  task: pullAllSources.id
});

// Event-driven triggers
await ingestUrl.trigger({
  url: "https://arxiv.org/abs/2401.12345",
  requestedBy: userId
});

// Batch processing
await generateInsights.batchTrigger(
  contents.map(c => ({ payload: { contentId: c.id }}))
);
```

## Why This Architecture Works

### Separation of Concerns
- **Engine**: Handles the messy reality of external APIs
- **Jobs**: Handles the complex reality of AI processing
- **Result**: Each layer can evolve independently

### Scalability
- Engine scales horizontally (more workers)
- Jobs scales through concurrency limits
- AI processing can be parallelized

### Reliability
- Failed AI processing doesn't require re-fetching
- Engine responses can be cached aggressively
- Jobs handles retries with exponential backoff

### Cost Optimization
- Cache expensive API calls at Engine layer
- Batch AI processing to reduce API costs
- Skip processing for duplicate content

## Environment Configuration

```bash
# Trigger.dev
TRIGGER_PROJECT_ID=xxx
TRIGGER_SECRET_KEY=xxx

# OpenAI (for extraction prompts)
OPENAI_API_KEY=xxx

# Database
DATABASE_URL=postgresql://...

# Engine API
ENGINE_API_URL=https://engine.zekehq.com
ENGINE_API_KEY=xxx
```

## Running Locally

```bash
# Install dependencies
pnpm install

# Run Trigger.dev dev server
pnpm trigger:dev

# In another terminal, run the worker
pnpm dev:jobs

# Trigger a test job
pnpm trigger:test
```

## Deployment

Jobs are automatically deployed when pushing to main:

```bash
# Deploy to staging
pnpm run deploy:staging

# Deploy to production
pnpm run deploy:production
```

## Monitoring

Access the Trigger.dev dashboard to:
- View running jobs and schedules
- Monitor success/failure rates
- Inspect job payloads and errors
- Manage concurrency limits

---

Jobs is the intelligence layer that transforms Zeke from a content aggregator into an insight generator. By cleanly separating ingestion (Engine) from intelligence (Jobs), we can scale each layer independently while maintaining a simple, reliable pipeline from source to insight.