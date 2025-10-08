import { z } from "@hono/zod-openapi";

export const triggerTaskInputSchema = z
  .object({
    taskId: z.string().min(1).openapi({
      description: "Trigger.dev task identifier",
      example: "generate-brief",
    }),
    payload: z.record(z.unknown()).default({}).openapi({
      description: "JSON payload forwarded to the task",
      example: {
        storyId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "manual",
      },
    }),
  })
  .openapi({
    description: "Parameters for initiating a Trigger.dev task run",
  });

export const triggerTaskResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique run identifier",
      example: "run_01jg3v5c2g7h9qxacm8a6y4m2b",
    }),
    status: z.string().optional().openapi({
      description: "Run status as returned by Trigger.dev",
      example: "queued",
    }),
    taskId: z.string().optional().openapi({
      description: "Task identifier acknowledged by Trigger.dev",
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
      description: "Trigger.dev run identifier",
      example: "run_01jg3v5c2g7h9qxacm8a6y4m2b",
    }),
  })
  .openapi({
    description: "Parameters for fetching the status of a Trigger.dev run",
  });

export const triggerRunStatusResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Run identifier",
      example: "run_01jg3v5c2g7h9qxacm8a6y4m2b",
    }),
    status: z.string().openapi({
      description: "Current status reported by Trigger.dev",
      example: "completed",
    }),
  })
  .passthrough()
  .openapi({
    description: "Detailed Trigger.dev run payload",
  });

export const triggerIngestUrlInputSchema = z
  .object({
    url: z.string().url().openapi({
      description: "URL to queue for ingestion",
      example: "https://example.com/article",
    }),
    priority: z
      .enum(["normal", "high"])
      .default("normal")
      .openapi({
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
    context: z
      .record(z.unknown())
      .optional()
      .openapi({
        description: "Optional context metadata forwarded to the run",
      }),
  })
  .openapi({
    description: "Parameters for triggering a playbook run",
  });

export type TriggerTaskInput = z.infer<typeof triggerTaskInputSchema>;
export type TriggerTaskResponse = z.infer<typeof triggerTaskResponseSchema>;
export type TriggerRunStatusInput = z.infer<typeof triggerRunStatusInputSchema>;
export type TriggerRunStatusResponse = z.infer<typeof triggerRunStatusResponseSchema>;
export type TriggerIngestUrlInput = z.infer<typeof triggerIngestUrlInputSchema>;
export type TriggerRunPlaybookInput = z.infer<typeof triggerRunPlaybookInputSchema>;
