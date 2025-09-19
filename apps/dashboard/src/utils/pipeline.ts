import { connectDb } from "@zeke/db/src/client";
import {
  type PipelineActivity,
  type PipelineCounts,
  getPipelineCounts,
  getRecentPipelineActivity,
} from "@zeke/db/src/queries/pipeline";

export type WorkerStatus = Record<string, unknown> & { port?: string };

const DEFAULT_LOCAL_PORTS = ["8082", "8081", "8080"] as const;

/**
 * Return ingestion counts (raw items → contents → stories) for the admin console.
 */
export async function fetchPipelineCounts(): Promise<PipelineCounts> {
  const db = await connectDb();
  return getPipelineCounts(db);
}

/**
 * Return the most recent activity at each pipeline stage.
 */
export async function fetchRecentPipelineActivity(
  limit: number,
): Promise<PipelineActivity> {
  const db = await connectDb();
  return getRecentPipelineActivity(db, { limit });
}

/**
 * Attempt to reach the local worker debug endpoint so the admin UI can report
 * whether the worker is running. Falls back to `null` if no ports respond.
 */
export async function fetchWorkerStatus(): Promise<WorkerStatus | null> {
  const ports = [
    process.env.WORKER_PORT,
    process.env.WORKER_HTTP_PORT,
    ...DEFAULT_LOCAL_PORTS,
  ].filter(Boolean) as string[];

  const seen = new Set<string>();
  const uniquePorts = ports.filter((port) => {
    if (seen.has(port)) {
      return false;
    }
    seen.add(port);
    return true;
  });

  for (const port of uniquePorts) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const response = await fetch(`http://127.0.0.1:${port}/debug/status`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (!response.ok) {
        continue;
      }

      const json = (await response.json()) as Record<string, unknown>;
      return { port, ...json } satisfies WorkerStatus;
    } catch {
      // Try next port
    }
  }

  return null;
}
