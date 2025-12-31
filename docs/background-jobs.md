# Background Jobs (pg-boss)

Zeke uses [pg-boss](https://github.com/timgit/pg-boss) for background job processing. pg-boss is a PostgreSQL-backed job queue that provides reliable, scalable background processing without external dependencies.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   API Server    │────▶│   PostgreSQL    │◀────│   Jobs Worker   │
│  (job trigger)  │     │   (pg-boss)     │     │  (job handler)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │              ┌─────────────────┐              │
         └─────────────▶│   SSE Stream    │◀─────────────┘
                        │  (job status)   │
                        └─────────────────┘
```

## Key Components

### packages/jobs/

| File | Purpose |
|------|---------|
| `src/boss.ts` | pg-boss singleton instance |
| `src/schema-task.ts` | Task definition wrapper with Zod validation |
| `src/worker.ts` | Worker entry point |
| `src/scheduler.ts` | Cron schedule definitions |
| `src/client.ts` | Client API for triggering jobs |
| `src/init.ts` | Database context for job execution |
| `src/tasks/` | Task implementations |

### apps/api/

| File | Purpose |
|------|---------|
| `src/services/jobs.ts` | API service for job operations |
| `src/rest/routers/jobs-stream.ts` | SSE endpoint for real-time status |
| `src/trpc/routers/trigger.ts` | tRPC router for job operations |

## Running the Worker

### Development

```bash
# From project root
pnpm --filter @zeke/jobs worker:dev

# Or from packages/jobs directory
pnpm worker:dev
```

### Production (Docker)

The jobs worker runs as a separate container in production. Uncomment the `jobs-worker` service in `docker-compose.yml`:

```yaml
jobs-worker:
  build:
    context: .
    dockerfile: Dockerfile
  command: pnpm --filter @zeke/jobs worker
  depends_on:
    postgres:
      condition: service_healthy
  environment:
    DATABASE_PRIMARY_URL: postgresql://zeke:${POSTGRES_PASSWORD}@postgres:5432/zeke
    OPENAI_API_KEY: ${OPENAI_API_KEY}
    JOBS_CRON_TZ: ${JOBS_CRON_TZ:-UTC}
  restart: unless-stopped
```

## Defining Tasks

Tasks are defined using the `schemaTask` wrapper which provides:
- Zod schema validation for payloads
- Structured logging
- Concurrency control
- Automatic registration

```typescript
import { z } from "zod";
import { schemaTask, tasks, logger } from "@jobs/schema-task";

export const myTask = schemaTask({
  id: "my-task",
  schema: z.object({
    itemId: z.string().uuid(),
    options: z.object({
      force: z.boolean().optional(),
    }).optional(),
  }),
  queue: {
    concurrencyLimit: 5, // Max parallel executions
  },
  run: async (payload, { logger, run }) => {
    logger.info("Processing item", { itemId: payload.itemId });

    // Your task logic here

    // Trigger another task
    await tasks.trigger("another-task", { data: "value" });

    return { success: true };
  },
});
```

## Triggering Jobs

### From API Code

```typescript
import { sendJob } from "@api/services/jobs";

// Trigger a job
const result = await sendJob("my-task", {
  itemId: "123e4567-e89b-12d3-a456-426614174000",
  options: { force: true },
});

console.log("Job ID:", result.id);
```

### From Tasks

```typescript
import { tasks } from "@jobs/schema-task";

// Inside a task's run function
await tasks.trigger("another-task", { data: "value" });
```

### Via REST API

```bash
curl -X POST http://localhost:3003/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "my-task", "payload": {"itemId": "123"}}'
```

## Scheduled Jobs (Cron)

Schedules are defined in `packages/jobs/src/scheduler.ts`:

```typescript
const schedules: ScheduleConfig[] = [
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

The timezone for cron schedules is configured via the `JOBS_CRON_TZ` environment variable (defaults to UTC).

## Monitoring Job Status

### SSE Stream (Real-time)

The dashboard uses Server-Sent Events for real-time job status updates:

```typescript
import { useJobStatus } from "@/hooks/use-job-status";

function JobStatusComponent({ jobId }) {
  const { status, output, error } = useJobStatus({ runId: jobId });

  if (status === "COMPLETED") {
    return <div>Done! Result: {JSON.stringify(output)}</div>;
  }

  return <div>Status: {status}</div>;
}
```

### REST API

```bash
# Get job status
curl http://localhost:3003/trigger/runs/{jobId} \
  -H "Authorization: Bearer $TOKEN"

# Stream status updates (SSE)
curl http://localhost:3003/jobs/stream/{jobId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: text/event-stream"
```

## Job Status Values

| Status | Description |
|--------|-------------|
| `QUEUED` | Job is waiting to be processed |
| `EXECUTING` | Job is currently running |
| `COMPLETED` | Job finished successfully |
| `FAILED` | Job failed with an error |
| `CANCELLED` | Job was cancelled |

## Available Tasks

### Source Ingestion
- `ingest-pull` - Pull RSS feeds for new content
- `ingest-pull-youtube` - Pull YouTube channels for new videos
- `ingest-oneoff` - One-off URL ingestion
- `ingest-source` - Process individual feed items
- `ingest-from-upload` - Process uploaded files
- `ingest-from-youtube` - Process YouTube videos
- `fetch-content` - Fetch and enrich content
- `link-source-to-story` - Link sources to stories

### Story Analysis
- `analyze-story` - Full story analysis pipeline
- `summarize-story` - Generate story summaries
- `update-story-status` - Update story processing status

### Insights
- `extract-highlights` - Extract key highlights
- `score-relevance` - Score content relevance
- `dedupe-insights` - Deduplicate insights
- `attach-insight-to-story` - Link insights to stories

### Briefs
- `generate-brief` - Generate executive briefs

### Playbooks
- `playbook-run` - Execute automation playbooks

## Database Tables

pg-boss automatically creates tables in the `pgboss` schema:

- `pgboss.job` - Active and scheduled jobs
- `pgboss.archive` - Completed job history
- `pgboss.schedule` - Cron schedule definitions
- `pgboss.version` - Schema version tracking

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PRIMARY_URL` | (required) | PostgreSQL connection string |
| `JOBS_CRON_TZ` | `UTC` | Timezone for cron schedules |
| `OPENAI_API_KEY` | (required) | OpenAI API key for AI tasks |

### pg-boss Options

Configured in `packages/jobs/src/boss.ts`:

```typescript
{
  schema: "pgboss",
  archiveCompletedAfterSeconds: 60 * 60 * 24, // 24 hours
  deleteAfterDays: 7,
  retryLimit: 3,
  retryDelay: 1,
  retryBackoff: true,
  expireInSeconds: 60 * 60, // 1 hour default job expiry
}
```

## Troubleshooting

### Jobs not processing

1. Ensure the worker is running: `pnpm --filter @zeke/jobs worker:dev`
2. Check PostgreSQL connection
3. Verify the task is registered (check worker logs)

### Job stuck in EXECUTING

pg-boss has built-in job expiration. Jobs that exceed `expireInSeconds` are automatically failed and retried.

### Viewing job history

```sql
-- Recent jobs
SELECT * FROM pgboss.job
ORDER BY createdon DESC
LIMIT 20;

-- Failed jobs
SELECT * FROM pgboss.job
WHERE state = 'failed'
ORDER BY createdon DESC;

-- Archived jobs
SELECT * FROM pgboss.archive
ORDER BY archivedon DESC
LIMIT 100;
```
