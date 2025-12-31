/**
 * Client-side pg-boss API for triggering jobs and checking status.
 * Used by the API layer - separate from worker-side schema-task.ts
 */
import { sql } from "drizzle-orm";
import { getBoss } from "./boss";
import { getDbOrCreate } from "./init";

export interface JobTriggerResult {
  id: string;
  status?: string;
  taskId?: string;
  [key: string]: unknown;
}

export interface JobStatus {
  id: string;
  status: "created" | "retry" | "active" | "completed" | "cancelled" | "failed";
  taskId: string;
  data: Record<string, unknown> | null;
  output: unknown | null;
  startedOn: Date | null;
  completedOn: Date | null;
  createdOn: Date;
  retryCount: number;
  [key: string]: unknown;
}

interface PgBossJobRow {
  id: string;
  name: string;
  state: string;
  data: Record<string, unknown> | null;
  output: unknown | null;
  startedon: Date | null;
  completedon: Date | null;
  createdon: Date;
  retrycount: number;
  [key: string]: unknown;
}

/**
 * Send a job to the queue
 */
export async function sendJob(
  taskId: string,
  payload: Record<string, unknown>,
): Promise<JobTriggerResult> {
  const boss = await getBoss();
  const jobId = await boss.send(taskId, payload);

  if (!jobId) {
    throw new Error(`Failed to queue job for task ${taskId}`);
  }

  return {
    id: jobId,
    status: "created",
    taskId,
  };
}

/**
 * Get job status by ID - queries pgboss tables directly since
 * boss.getJobById requires the queue name
 */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const db = getDbOrCreate();

  // Query the pgboss.job table directly
  const result = await db.execute<PgBossJobRow>(sql`
    SELECT id, name, state, data, output, startedon, completedon, createdon, retrycount
    FROM pgboss.job
    WHERE id = ${jobId}
    UNION ALL
    SELECT id, name, state, data, output, startedon, completedon, createdon, retrycount
    FROM pgboss.archive
    WHERE id = ${jobId}
    LIMIT 1
  `);

  const job = result.rows[0];
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: job.state as JobStatus["status"],
    taskId: job.name,
    data: job.data,
    output: job.output,
    startedOn: job.startedon,
    completedOn: job.completedon,
    createdOn: job.createdon,
    retryCount: job.retrycount,
  };
}

/**
 * Cancel a job by ID - finds the queue name first then cancels
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const boss = await getBoss();
  const db = getDbOrCreate();

  // First find the job to get its queue name
  const result = await db.execute<{ name: string }>(sql`
    SELECT name FROM pgboss.job WHERE id = ${jobId}
  `);

  const job = result.rows[0];
  if (!job) {
    return false;
  }

  await boss.cancel(job.name, jobId);
  return true;
}

// Re-export getBoss for convenience
export { getBoss };
