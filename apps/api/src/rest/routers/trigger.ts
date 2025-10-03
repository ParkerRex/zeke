import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  triggerRunStatusResponseSchema,
  triggerTaskInputSchema,
  triggerTaskResponseSchema,
} from "@api/schemas/trigger";
import { getTriggerRun, triggerTaskRun } from "@api/services/trigger";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Trigger a background task",
    description:
      "Enqueue a Trigger.dev task using the project's API key. Requires the jobs.trigger scope.",
    operationId: "triggerTask",
    tags: ["Trigger"],
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
        description: "Trigger acknowledged by Trigger.dev",
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
    const result = await triggerTaskRun(payload.taskId, payload.payload ?? {});
    return c.json(validateResponse(result, triggerTaskResponseSchema));
  },
);

const runParamsSchema = z.object({
  runId: z
    .string()
    .min(1)
    .openapi({
      description: "Trigger.dev run identifier",
      example: "run_01jg3v5c2g7h9qxacm8a6y4m2b",
    }),
});

app.openapi(
  createRoute({
    method: "get",
    path: "/runs/{runId}",
    summary: "Fetch run status",
    description: "Retrieve the latest information about a Trigger.dev run.",
    operationId: "getTriggerRun",
    tags: ["Trigger"],
    security: [{ bearerAuth: [] }],
    request: {
      params: runParamsSchema,
    },
    responses: {
      200: {
        description: "Run status payload from Trigger.dev",
        content: {
          "application/json": {
            schema: triggerRunStatusResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("jobs.trigger")],
  }),
  async (c) => {
    const { runId } = c.req.valid("param");
    const run = await getTriggerRun(runId);
    return c.json(validateResponse(run, triggerRunStatusResponseSchema));
  },
);

export const triggerRouter = app;
