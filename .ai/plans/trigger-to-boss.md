# Spec: Replace Trigger.dev with pg-boss

## Overview

Migrate from Trigger.dev cloud-hosted job queue to self-hosted pg-boss (PostgreSQL-backed job queue). This removes external dependencies and leverages the existing PostgreSQL database.

## Current State

- **23 tasks** across sources, insights, stories, briefs, playbooks
- **Trigger.dev v4** with cloud hosting
- **Features used**: schemaTask, task-to-task triggering, cron schedules, concurrency limits, real-time status via react-hooks
- **Database**: Already using PostgreSQL 16 (self-hosted)

---

## Architecture Design

### New Structure

```
packages/jobs/
├── src/
│   ├── boss.ts           # pg-boss instance singleton
│   ├── worker.ts         # Worker startup/shutdown
│   ├── scheduler.ts      # Cron schedule definitions
│   ├── schema-task.ts    # schemaTask replacement wrapper
│   ├── tasks/            # Keep existing task structure
│   └── index.ts          # Exports
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Connection | `DATABASE_PRIMARY_URL` | pg-boss manages its own pool |
| Schema | `pgboss.*` | Auto-created by pg-boss |
| Workers | Separate Docker service | Isolation and independent scaling |
| Concurrency | `teamSize` per queue | Maps to Trigger.dev's `concurrencyLimit` |
| Scheduling | pg-boss `schedule()` API | Native cron support |
| Status Tracking | Custom `job_runs` table | Enables API status queries |
| Dashboard | SSE endpoint | Real-time updates without external deps |

---

## Implementation Phases

### Phase 1: Setup pg-boss Infrastructure

#### 1.1 Install pg-boss dependency

**File**: `packages/jobs/package.json`

```diff
  "dependencies": {
-   "trigger.dev": "4.0.4",
+   "pg-boss": "^10.1.1",
  }
```

#### 1.2 Create pg-boss client

**File**: `packages/jobs/src/boss.ts`

```typescript
import PgBoss from "pg-boss";

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss({
      connectionString: process.env.DATABASE_PRIMARY_URL,
      schema: "pgboss",
      archiveCompletedAfterSeconds: 60 * 60 * 24, // 24 hours
      deleteAfterDays: 7,
    });
    await boss.start();
  }
  return boss;
}

export async function stopBoss(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}
```

#### 1.3 Create schemaTask wrapper

**File**: `packages/jobs/src/schema-task.ts`

```typescript
import type { z } from "zod";
import { getBoss } from "./boss";

interface TaskOptions<T extends z.ZodType> {
  id: string;
  schema: T;
  queue?: { concurrencyLimit?: number };
  run: (payload: z.infer<T>, ctx: TaskContext) => Promise<unknown>;
}

interface TaskContext {
  jobId: string;
  logger: Logger;
}

export function schemaTask<T extends z.ZodType>(options: TaskOptions<T>) {
  const { id, schema, queue, run } = options;

  return {
    id,

    // Queue a job
    async trigger(payload: z.infer<T>): Promise<string> {
      const boss = await getBoss();
      const validated = schema.parse(payload);
      const jobId = await boss.send(id, validated);
      return jobId!;
    },

    // Register handler (called by worker)
    async register(): Promise<void> {
      const boss = await getBoss();
      await boss.work(
        id,
        { teamSize: queue?.concurrencyLimit ?? 1 },
        async (job) => {
          const validated = schema.parse(job.data);
          const ctx: TaskContext = {
            jobId: job.id,
            logger: createLogger(id, job.id),
          };
          return run(validated, ctx);
        }
      );
    },
  };
}
```

#### 1.4 Create job_runs tracking table

**File**: `packages/db/src/schema.ts` (add to existing)

```typescript
export const jobRuns = pgTable("job_runs", {
  id: text("id").primaryKey(), // pg-boss job ID
  taskId: text("task_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, active, completed, failed
  payload: jsonb("payload"),
  result: jsonb("result"),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### Phase 2: Migrate Tasks (23 total)

#### 2.1 Sources Tasks (8 tasks)

| Task | File | Concurrency |
|------|------|-------------|
| `ingest-pull` | `sources/pull/rss.ts` | 1 |
| `ingest-pull-youtube` | `sources/pull/youtube.ts` | 1 |
| `ingest-oneoff` | `sources/pull/manual.ts` | 2 |
| `ingest-source` | `sources/ingest/from-feed.ts` | 5 |
| `ingest-from-upload` | `sources/ingest/from-upload.ts` | 2 |
| `ingest-from-youtube` | `sources/ingest/from-youtube.ts` | 1 |
| `fetch-content` | `sources/enrich/fetch-content.ts` | 3 |
| `link-source-to-story` | `sources/link/to-stories.ts` | 1 |

#### 2.2 Insights Tasks (7 tasks)

| Task | File | Concurrency |
|------|------|-------------|
| `analyze-story` | `insights/generate.ts` | 5 |
| `generate-brief` | `briefs/generate.ts` | 10 |
| `extract-highlights` | `insights/extract-highlights.ts` | 1 |
| `extract-structured` | `insights/extract-structured.ts` | 1 |
| `score-relevance` | `insights/score-relevance.ts` | 20 |
| `dedupe-insights` | `insights/dedupe.ts` | 1 |
| `insights-attach-to-story` | `insights/attach-to-story.ts` | 3 |

#### 2.3 Stories Tasks (2 tasks)

| Task | File | Concurrency |
|------|------|-------------|
| `story-summarize` | `stories/summarize.ts` | 4 |
| `stories-update-status` | `stories/update-status.ts` | 1 |

#### 2.4 Playbook Tasks (2 tasks - disabled)

| Task | File | Concurrency |
|------|------|-------------|
| `playbook-run` | `playbooks/run.ts` | 2 |

#### Migration Pattern

**Before (Trigger.dev)**:
```typescript
import { schemaTask, logger } from "@trigger.dev/sdk";

export const ingestSource = schemaTask({
  id: "ingest-source",
  schema: ingestSourceSchema,
  queue: { concurrencyLimit: 5 },
  run: async ({ sourceId, reason }, { ctx }) => {
    logger.info("Processing source", { sourceId });
    // ...
  },
});
```

**After (pg-boss)**:
```typescript
import { schemaTask } from "../schema-task";

export const ingestSource = schemaTask({
  id: "ingest-source",
  schema: ingestSourceSchema,
  queue: { concurrencyLimit: 5 },
  run: async ({ sourceId, reason }, { logger }) => {
    logger.info("Processing source", { sourceId });
    // ...
  },
});
```

---

### Phase 3: Update API Layer

#### 3.1 Replace trigger service

**File**: `apps/api/src/services/trigger.ts` → `apps/api/src/services/jobs.ts`

```typescript
import { getBoss } from "@zeke/jobs/boss";
import { db } from "@zeke/db";
import { jobRuns } from "@zeke/db/schema";

export async function sendJob(
  taskId: string,
  payload: Record<string, unknown>
): Promise<string> {
  const boss = await getBoss();
  const jobId = await boss.send(taskId, payload);

  // Track in job_runs for status queries
  await db.insert(jobRuns).values({
    id: jobId!,
    taskId,
    status: "pending",
    payload,
  });

  return jobId!;
}

export async function getJobStatus(runId: string) {
  const [job] = await db
    .select()
    .from(jobRuns)
    .where(eq(jobRuns.id, runId));
  return job;
}
```

#### 3.2 Update tRPC router

**File**: `apps/api/src/trpc/routers/trigger.ts`

- Update imports to use new jobs service
- Keep same external API shape for backwards compatibility

#### 3.3 Update REST router

**File**: `apps/api/src/rest/routers/trigger.ts`

- Update to use new jobs service

---

### Phase 4: Update Dashboard & Add SSE

#### 4.1 Create SSE endpoint for job status

**File**: `apps/api/src/rest/routers/jobs-stream.ts`

```typescript
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "@zeke/db";
import { jobRuns } from "@zeke/db/schema";

const app = new Hono();

app.get("/jobs/:runId/stream", async (c) => {
  const runId = c.req.param("runId");

  return streamSSE(c, async (stream) => {
    let lastStatus = "";

    while (true) {
      const [job] = await db
        .select()
        .from(jobRuns)
        .where(eq(jobRuns.id, runId));

      if (!job) {
        await stream.writeSSE({ data: JSON.stringify({ error: "not_found" }) });
        break;
      }

      if (job.status !== lastStatus) {
        lastStatus = job.status;
        await stream.writeSSE({ data: JSON.stringify(job) });
      }

      if (job.status === "completed" || job.status === "failed") {
        break;
      }

      await stream.sleep(1000);
    }
  });
});

export default app;
```

#### 4.2 Replace react-hooks with SSE hook

**File**: `apps/dashboard/src/hooks/use-job-status.ts`

```typescript
import { useEffect, useState } from "react";

interface JobStatus {
  id: string;
  status: "pending" | "active" | "completed" | "failed";
  result?: unknown;
  error?: string;
}

export function useJobStatus(runId: string | null, accessToken: string) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!runId || !accessToken) return;

    const eventSource = new EventSource(
      `/api/jobs/${runId}/stream`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data);

      if (data.status === "completed" || data.status === "failed") {
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError(new Error("SSE connection failed"));
      eventSource.close();
    };

    return () => eventSource.close();
  }, [runId, accessToken]);

  return { status, error };
}
```

**Files to update**:
- `apps/dashboard/src/hooks/use-sync-status.ts` - use new hook
- `apps/dashboard/src/hooks/use-initial-connection-status.ts` - use new hook
- `apps/dashboard/src/hooks/use-export-status.ts` - use new hook

---

### Phase 5: Create Worker Entry Point

#### 5.1 Worker script

**File**: `packages/jobs/src/worker.ts`

```typescript
import { getBoss, stopBoss } from "./boss";
import { registerAllTasks } from "./tasks";
import { registerSchedules } from "./scheduler";

async function main() {
  console.log("Starting jobs worker...");

  // Initialize pg-boss
  await getBoss();

  // Register all task handlers
  await registerAllTasks();

  // Register cron schedules
  await registerSchedules();

  console.log("Jobs worker started");

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("Shutting down...");
    await stopBoss();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
```

#### 5.2 Scheduler script

**File**: `packages/jobs/src/scheduler.ts`

```typescript
import { getBoss } from "./boss";

export async function registerSchedules() {
  const boss = await getBoss();

  // RSS ingestion every 5 minutes
  await boss.schedule("ingest-pull", "*/5 * * * *", {}, {
    tz: process.env.JOBS_CRON_TZ || "UTC",
  });

  // YouTube ingestion (adjust schedule as needed)
  await boss.schedule("ingest-pull-youtube", "0 * * * *", {}, {
    tz: process.env.JOBS_CRON_TZ || "UTC",
  });
}
```

#### 5.3 Docker compose service

**File**: `docker-compose.yml`

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
    - DATABASE_PRIMARY_URL=${DATABASE_PRIMARY_URL}
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - JOBS_CRON_TZ=${JOBS_CRON_TZ:-UTC}
  restart: unless-stopped
```

#### 5.4 Add package.json scripts

**File**: `packages/jobs/package.json`

```json
{
  "scripts": {
    "worker": "tsx src/worker.ts",
    "worker:dev": "tsx watch src/worker.ts"
  }
}
```

---

### Phase 6: Cleanup

#### 6.1 Remove Trigger.dev files

- `packages/jobs/trigger.config.ts`
- `packages/jobs/src/init.ts`

#### 6.2 Remove dependencies

**Files**:
- `packages/jobs/package.json` - remove `trigger.dev`
- `apps/dashboard/package.json` - remove `@trigger.dev/react-hooks`

#### 6.3 Update environment variables

**File**: `packages/utils/src/env.ts`

Remove:
- `TRIGGER_PROJECT_ID`
- `TRIGGER_SECRET_KEY`
- `TRIGGER_API_KEY`
- `TRIGGER_SECRET`
- `TRIGGER_DEV_API_KEY`
- `TRIGGER_API_URL`
- `TRIGGER_ENDPOINT`
- `TRIGGER_WEBHOOK_SECRET`

#### 6.4 Update deployment configs

**Files**:
- `deploy/env/staging/*` - remove Trigger.dev vars
- `deploy/env/production/*` - remove Trigger.dev vars

---

## Files Summary

### New Files (7)

| File | Purpose |
|------|---------|
| `packages/jobs/src/boss.ts` | pg-boss singleton |
| `packages/jobs/src/schema-task.ts` | schemaTask wrapper |
| `packages/jobs/src/worker.ts` | Worker entry point |
| `packages/jobs/src/scheduler.ts` | Cron schedules |
| `packages/db/src/schema/job-runs.ts` | Status tracking table |
| `apps/api/src/rest/routers/jobs-stream.ts` | SSE endpoint |
| `apps/dashboard/src/hooks/use-job-status.ts` | SSE client hook |

### Modified Files (11)

| File | Changes |
|------|---------|
| `packages/jobs/package.json` | Swap dependencies |
| `packages/jobs/src/tasks/**/*.ts` | All 23 task files |
| `apps/api/src/services/trigger.ts` → `jobs.ts` | New jobs service |
| `apps/api/src/trpc/routers/trigger.ts` | Use jobs service |
| `apps/api/src/rest/routers/trigger.ts` | Use jobs service |
| `apps/dashboard/src/hooks/use-sync-status.ts` | Use SSE hook |
| `apps/dashboard/src/hooks/use-initial-connection-status.ts` | Use SSE hook |
| `apps/dashboard/src/hooks/use-export-status.ts` | Use SSE hook |
| `apps/dashboard/package.json` | Remove trigger.dev |
| `packages/utils/src/env.ts` | Remove trigger vars |
| `docker-compose.yml` | Add jobs-worker service |

### Deleted Files (2)

| File | Reason |
|------|--------|
| `packages/jobs/trigger.config.ts` | Trigger.dev config |
| `packages/jobs/src/init.ts` | Trigger.dev init |

---

## Migration Strategy

**Complete Cutover** - Remove Trigger.dev entirely in one pass.

1. Build pg-boss infrastructure (boss client, schema-task wrapper, worker)
2. Migrate all 23 tasks to pg-boss format
3. Update API services and routers
4. Create SSE endpoint and update dashboard hooks
5. Add jobs-worker service to docker-compose
6. Remove all Trigger.dev code and dependencies
7. Test full flow locally with docker-compose
8. Deploy

---

## Testing Checklist

- [ ] pg-boss starts and creates schema
- [ ] Jobs can be queued via API
- [ ] Worker picks up and processes jobs
- [ ] Job status updates in real-time via SSE
- [ ] Cron schedules fire correctly
- [ ] Concurrency limits are respected
- [ ] Failed jobs are retried
- [ ] Dashboard shows job progress
- [ ] All 23 tasks execute correctly
