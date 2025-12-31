/**
 * Client-side pg-boss API for triggering jobs and checking status.
 * Used by the API layer - separate from worker-side schema-task.ts
 */
import { getBoss } from "./boss";

export interface JobTriggerResult {
  id: string;
  status?: string;
  taskId?: string;
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
 * Get job status by ID
 */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const boss = await getBoss();
  const job = await boss.getJobById(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: job.state as JobStatus["status"],
    taskId: job.name,
    data: job.data as Record<string, unknown> | null,
    output: job.output,
    startedOn: job.startedOn,
    completedOn: job.completedOn,
    createdOn: job.createdOn,
    retryCount: job.retryCount,
  };
}

/**
 * Cancel a job by ID
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const boss = await getBoss();
  return await boss.cancel(jobId);
}

export { getBoss } from "./boss";
