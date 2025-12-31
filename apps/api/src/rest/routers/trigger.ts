import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  triggerRunStatusResponseSchema,
  triggerTaskInputSchema,
  triggerTaskResponseSchema,
} from "@api/schemas/trigger";
import { getJobRun, sendJob } from "@api/services/jobs";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Trigger a background task",
    description: "Enqueue a background job. Requires the jobs.trigger scope.",
    operationId: "triggerTask",
    tags: ["Jobs"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: triggerTaskInputSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Job queued successfully",
        content: {
          "application/json": {
            schema: triggerTaskResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("jobs.trigger")],
  }),
  async (c) => {
    const payload = c.req.valid("json");
    const result = await sendJob(payload.taskId, payload.payload ?? {});
    return c.json(validateResponse(result, triggerTaskResponseSchema));
  },
);

const runParamsSchema = z.object({
  runId: z.string().min(1).openapi({
    description: "Job run identifier",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
});

app.openapi(
  createRoute({
    method: "get",
    path: "/runs/{runId}",
    summary: "Fetch job run status",
    description: "Retrieve the latest status of a background job run.",
    operationId: "getJobRun",
    tags: ["Jobs"],
    security: [{ bearerAuth: [] }],
    request: {
      params: runParamsSchema,
    },
    responses: {
      200: {
        description: "Job run status",
        content: {
          "application/json": {
            schema: triggerRunStatusResponseSchema,
          },
        },
      },
      404: {
        description: "Job run not found",
      },
    },
    middleware: [withRequiredScope("jobs.trigger")],
  }),
  async (c) => {
    const { runId } = c.req.valid("param");
    const job = await getJobRun(runId);
    if (!job) {
      return c.json({ error: "Job run not found" }, 404);
    }
    return c.json(validateResponse(job, triggerRunStatusResponseSchema));
  },
);

export const triggerRouter = app;
