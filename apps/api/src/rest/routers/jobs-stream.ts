import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { getJobRun } from "@api/services/jobs";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

const streamParamsSchema = z.object({
  runId: z.string().min(1).openapi({
    description: "Job run identifier to stream status updates for",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
});

app.openapi(
  createRoute({
    method: "get",
    path: "/{runId}",
    summary: "Stream job status updates",
    description:
      "Subscribe to real-time job status updates via Server-Sent Events. The connection will automatically close when the job completes or fails.",
    operationId: "streamJobStatus",
    tags: ["Jobs"],
    security: [{ bearerAuth: [] }],
    request: {
      params: streamParamsSchema,
    },
    responses: {
      200: {
        description: "SSE stream of job status updates",
      },
      404: {
        description: "Job not found",
      },
    },
    middleware: [withRequiredScope("jobs.trigger")],
  }),
  async (c) => {
    const { runId } = c.req.valid("param");

    // Check if job exists
    const initialJob = await getJobRun(runId);
    if (!initialJob) {
      return c.json({ error: "Job not found" }, 404);
    }

    // If job is already complete, return immediately
    if (
      initialJob.status === "completed" ||
      initialJob.status === "failed" ||
      initialJob.status === "cancelled"
    ) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({
          event: "status",
          data: JSON.stringify({
            id: initialJob.id,
            status: mapStatus(initialJob.status),
            taskId: initialJob.taskId,
            output: initialJob.output,
            completedOn: initialJob.completedOn,
          }),
        });
        await stream.writeSSE({
          event: "close",
          data: "complete",
        });
      });
    }

    // Stream status updates
    return streamSSE(c, async (stream) => {
      let lastStatus = initialJob.status;
      let attempts = 0;
      const maxAttempts = 300; // 5 minutes at 1 second intervals
      const pollInterval = 1000;

      // Send initial status
      await stream.writeSSE({
        event: "status",
        data: JSON.stringify({
          id: initialJob.id,
          status: mapStatus(initialJob.status),
          taskId: initialJob.taskId,
        }),
      });

      // Poll for status changes
      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;

        const job = await getJobRun(runId);
        if (!job) {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({ error: "Job not found" }),
          });
          break;
        }

        // Send update if status changed
        if (job.status !== lastStatus) {
          lastStatus = job.status;
          await stream.writeSSE({
            event: "status",
            data: JSON.stringify({
              id: job.id,
              status: mapStatus(job.status),
              taskId: job.taskId,
              output: job.output,
              completedOn: job.completedOn,
            }),
          });
        }

        // Close stream when job is done
        if (
          job.status === "completed" ||
          job.status === "failed" ||
          job.status === "cancelled"
        ) {
          await stream.writeSSE({
            event: "close",
            data: "complete",
          });
          break;
        }
      }

      // Timeout case
      if (attempts >= maxAttempts) {
        await stream.writeSSE({
          event: "timeout",
          data: JSON.stringify({ message: "Stream timeout" }),
        });
      }
    });
  },
);

// Map pg-boss status to simplified status for clients
function mapStatus(
  status: string,
): "QUEUED" | "EXECUTING" | "COMPLETED" | "FAILED" | "CANCELLED" {
  switch (status) {
    case "created":
    case "retry":
      return "QUEUED";
    case "active":
      return "EXECUTING";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "QUEUED";
  }
}

export const jobsStreamRouter = app;
