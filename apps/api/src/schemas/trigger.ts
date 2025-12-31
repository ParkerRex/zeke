import { z } from "@hono/zod-openapi";

export const triggerTaskInputSchema = z
  .object({
    taskId: z.string().min(1).openapi({
      description: "Background task identifier",
      example: "generate-brief",
    }),
    payload: z
      .record(z.string(), z.unknown())
      .default({})
      .openapi({
        description: "JSON payload forwarded to the task",
        example: {
          storyId: "123e4567-e89b-12d3-a456-426614174000",
          reason: "manual",
        },
      }),
  })
  .openapi({
    description: "Parameters for initiating a background task run",
  });

export const triggerTaskResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique job identifier",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    status: z.string().optional().openapi({
      description: "Job status",
      example: "created",
    }),
    taskId: z.string().optional().openapi({
      description: "Task identifier",
      example: "generate-brief",
    }),
  })
  .passthrough()
  .openapi({
    description: "Acknowledgement returned after triggering a task",
  });

export const triggerRunStatusInputSchema = z
  .object({
    runId: z.string().min(1).openapi({
      description: "Job run identifier",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
  })
  .openapi({
    description: "Parameters for fetching the status of a job run",
  });

export const triggerRunStatusResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Job identifier",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    status: z.string().openapi({
      description: "Current job status",
      example: "completed",
    }),
  })
  .passthrough()
  .openapi({
    description: "Job run status payload",
  });

export const triggerIngestUrlInputSchema = z
  .object({
    url: z.string().url().openapi({
      description: "URL to queue for ingestion",
      example: "https://example.com/article",
    }),
    priority: z.enum(["normal", "high"]).default("normal").openapi({
      description: "Relative ingestion priority",
      example: "high",
    }),
  })
  .openapi({
    description: "Parameters for triggering a manual ingestion run",
  });

export const triggerRunPlaybookInputSchema = z
  .object({
    playbookId: z.string().uuid().openapi({
      description: "Playbook to execute",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    context: z.record(z.string(), z.unknown()).optional().openapi({
      description: "Optional context metadata forwarded to the run",
    }),
  })
  .openapi({
    description: "Parameters for triggering a playbook run",
  });

export type TriggerTaskInput = z.infer<typeof triggerTaskInputSchema>;
export type TriggerTaskResponse = z.infer<typeof triggerTaskResponseSchema>;
export type TriggerRunStatusInput = z.infer<typeof triggerRunStatusInputSchema>;
export type TriggerRunStatusResponse = z.infer<
  typeof triggerRunStatusResponseSchema
>;
export type TriggerIngestUrlInput = z.infer<typeof triggerIngestUrlInputSchema>;
export type TriggerRunPlaybookInput = z.infer<
  typeof triggerRunPlaybookInputSchema
>;
