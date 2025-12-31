# Zeke Jobs - Background Processing

Background job processing for Zeke, powered by [pg-boss](https://github.com/timgit/pg-boss).

## Overview

Jobs is Zeke's orchestration and intelligence layer. While the Engine fetches and normalizes content from research sources, Jobs applies AI to transform that content into structured insights, playbooks, and actionable intelligence.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Engine    │────▶│     Jobs     │────▶│  AI Prompts   │────▶│   Database   │
│  (Fetch)    │     │ (Orchestrate)│     │  (Transform)  │     │   (Store)    │
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘
```

## Running the Worker

```bash
# Development (with hot reload)
pnpm worker:dev

# Production
pnpm worker
```

## Task Organization

```
src/tasks/
├── sources/                    # Content ingestion pipeline
│   ├── pull/                   # Scheduled fetching from Engine
│   │   ├── rss.ts             # Pull RSS feeds
│   │   ├── youtube.ts         # Pull YouTube videos
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
    └── steps/                  # Playbook step handlers
```

## Defining Tasks

Tasks are defined using the `schemaTask` wrapper:

```typescript
import { z } from "zod";
import { schemaTask, tasks, logger } from "@jobs/schema-task";

export const myTask = schemaTask({
  id: "my-task",
  schema: z.object({
    itemId: z.string().uuid(),
  }),
  queue: {
    concurrencyLimit: 5,
  },
  run: async (payload, { logger, run }) => {
    logger.info("Processing", { itemId: payload.itemId });

    // Trigger another task
    await tasks.trigger("another-task", { data: "value" });

    return { success: true };
  },
});
```

## Scheduled Jobs

Schedules are defined in `src/scheduler.ts`:

```typescript
const schedules = [
  {
    taskId: "ingest-pull",
    cron: "*/5 * * * *", // Every 5 minutes
    description: "RSS feed ingestion",
  },
  {
    taskId: "ingest-pull-youtube",
    cron: "0 */6 * * *", // Every 6 hours
    description: "YouTube channel ingestion",
  },
];
```

## Environment Variables

```bash
# Database (required)
DATABASE_PRIMARY_URL=postgresql://...

# OpenAI (required for AI tasks)
OPENAI_API_KEY=sk-...

# Timezone for cron schedules
JOBS_CRON_TZ=UTC
```

## Key Files

| File | Purpose |
|------|---------|
| `src/boss.ts` | pg-boss singleton |
| `src/schema-task.ts` | Task wrapper with Zod validation |
| `src/worker.ts` | Worker entry point |
| `src/scheduler.ts` | Cron schedules |
| `src/client.ts` | Client API for triggering jobs |

## Monitoring

pg-boss stores job data in the `pgboss` schema:

```sql
-- View recent jobs
SELECT * FROM pgboss.job ORDER BY createdon DESC LIMIT 20;

-- View failed jobs
SELECT * FROM pgboss.job WHERE state = 'failed';

-- View schedules
SELECT * FROM pgboss.schedule;
```

See [docs/background-jobs.md](../../docs/background-jobs.md) for full documentation.
