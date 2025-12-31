import {
  sendJob as pgBossSendJob,
  getJobStatus as pgBossGetJobStatus,
  type JobTriggerResult,
  type JobStatus,
} from "@zeke/jobs/client";

export type { JobTriggerResult, JobStatus };

/**
 * Send a job to the background queue
 */
export async function sendJob(
  taskId: string,
  payload: Record<string, unknown>,
): Promise<JobTriggerResult> {
  return pgBossSendJob(taskId, payload);
}

/**
 * Get job status by run ID
 */
export async function getJobRun(runId: string): Promise<JobStatus | null> {
  return pgBossGetJobStatus(runId);
}
