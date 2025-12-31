# Jobs Package

Background job processing with pg-boss.

## Overview

| Property | Value |
|----------|-------|
| Package | `@zeke/jobs` |
| Queue | pg-boss (PostgreSQL-backed) |
| Schema | `pgboss.*` tables |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Engine    │────▶│     Jobs     │────▶│  AI Prompts   │────▶│   Database   │
│  (Fetch)    │     │ (Orchestrate)│     │  (Transform)  │     │   (Store)    │
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘
```

## Exports

```typescript
import { schemaTask, tasks, logger } from "@zeke/jobs/schema-task";
import { sendJob, getJobStatus } from "@zeke/jobs/client";
import { getBoss } from "@zeke/jobs/boss";
```

| Export | Description |
|--------|-------------|
| `./schema-task` | Task definition wrapper |
| `./client` | Job triggering API |
| `./boss` | pg-boss singleton |
| `./schema` | Payload schemas |
| `./tasks` | All task handlers |

## Running the Worker

```bash
# Development (with hot reload)
pnpm worker:dev

# Production
pnpm worker
```

## Defining Tasks

```typescript
import { schemaTask, tasks, logger } from "@zeke/jobs/schema-task";
import { z } from "zod";

export const myTask = schemaTask({
  id: "my-task",
  schema: z.object({
    itemId: z.string().uuid(),
  }),
  queue: {
    concurrencyLimit: 5,  // Parallel job limit
  },
  run: async (payload, { logger, run }) => {
    logger.info("Processing", { itemId: payload.itemId });

    // Trigger another task
    await tasks.trigger("another-task", { data: "value" });

    return { success: true };
  },
});
```

## Triggering Jobs

### From API

```typescript
import { sendJob } from "@zeke/jobs/client";

const result = await sendJob("my-task", { itemId: "123" });
// { id: "job-uuid", status: "created", taskId: "my-task" }
```

### From Another Task

```typescript
await tasks.trigger("my-task", { itemId: "123" });
```

## Task Categories

### Source Ingestion

| Task | Description | Concurrency |
|------|-------------|-------------|
| `ingest-pull` | Scheduled RSS fetch | 1 |
| `ingest-pull-youtube` | YouTube channel fetch | 1 |
| `ingest-oneoff` | On-demand URL ingest | 2 |
| `ingest-source` | Process feed items | 5 |
| `ingest-from-upload` | Process uploads | 2 |
| `fetch-content` | Get full text | 3 |

### AI Processing

| Task | Description | Concurrency |
|------|-------------|-------------|
| `analyze-story` | AI analysis | 5 |
| `generate-brief` | Create digests | 10 |
| `extract-highlights` | Extract highlights | 1 |
| `score-relevance` | Score insights | 20 |
| `dedupe-insights` | Remove duplicates | 1 |

### Stories

| Task | Description | Concurrency |
|------|-------------|-------------|
| `story-summarize` | Generate summaries | 4 |
| `stories-update-status` | Lifecycle management | 1 |

## Scheduled Jobs

Defined in `src/scheduler.ts`:

```typescript
const schedules = [
  {
    taskId: "ingest-pull",
    cron: "*/5 * * * *",  // Every 5 minutes
    description: "RSS feed ingestion",
  },
  {
    taskId: "ingest-pull-youtube",
    cron: "0 */6 * * *",  // Every 6 hours
    description: "YouTube ingestion",
  },
];
```

## Job Status

### Query Status

```typescript
import { getJobStatus } from "@zeke/jobs/client";

const status = await getJobStatus(jobId);
// { id, status, taskId, data, output, createdOn, ... }
```

### Status Values

| Status | Description |
|--------|-------------|
| `created` | Job queued |
| `active` | Currently processing |
| `completed` | Successfully finished |
| `failed` | Error occurred |
| `cancelled` | Manually cancelled |
| `retry` | Awaiting retry |

## Monitoring

```sql
-- Recent jobs
SELECT * FROM pgboss.job
ORDER BY createdon DESC
LIMIT 20;

-- Failed jobs
SELECT * FROM pgboss.job
WHERE state = 'failed';

-- Active schedules
SELECT * FROM pgboss.schedule;

-- Job counts by state
SELECT state, COUNT(*)
FROM pgboss.job
GROUP BY state;
```

## Directory Structure

```
packages/jobs/src/
├── boss.ts           # pg-boss singleton
├── worker.ts         # Worker entry point
├── scheduler.ts      # Cron schedules
├── schema-task.ts    # Task wrapper
├── client.ts         # Public API
├── schema.ts         # Payload schemas
├── init.ts           # Database setup
└── tasks/
    ├── sources/      # Ingestion tasks
    │   ├── pull/
    │   ├── ingest/
    │   └── enrich/
    ├── insights/     # AI tasks
    ├── stories/      # Story tasks
    ├── briefs/       # Brief generation
    └── playbooks/    # Automation
```

## Configuration

```typescript
// boss.ts
const boss = new PgBoss({
  connectionString: process.env.DATABASE_PRIMARY_URL,
  schema: "pgboss",
  archiveCompletedAfterSeconds: 86400,  // 24 hours
  deleteAfterDays: 7,
  retryLimit: 3,
  retryDelay: 1,
  retryBackoff: true,
});
```

## Environment Variables

```bash
# Database (required)
DATABASE_PRIMARY_URL=postgresql://...

# OpenAI (for AI tasks)
OPENAI_API_KEY=sk-...

# Timezone for cron
JOBS_CRON_TZ=UTC
```

## Error Handling

Tasks automatically retry on failure:

```typescript
export const myTask = schemaTask({
  id: "my-task",
  queue: {
    concurrencyLimit: 1,
    // Retries configured at pg-boss level
  },
  run: async (payload, { logger }) => {
    try {
      // Task logic
    } catch (error) {
      logger.error("Task failed", { error });
      throw error;  // Will trigger retry
    }
  },
});
```

## SSE Job Status

Real-time job status via Server-Sent Events:

```typescript
// API endpoint: GET /api/jobs/stream/:runId
const eventSource = new EventSource(`/api/jobs/stream/${runId}`);
eventSource.onmessage = (event) => {
  const status = JSON.parse(event.data);
  console.log(status);
};
```

## Related

- [API Application](../apps/api.md)
- [Engine Application](../apps/engine.md)
- [Database Package](./database.md)
