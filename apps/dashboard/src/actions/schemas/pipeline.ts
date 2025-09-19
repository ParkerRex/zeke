import { z } from "zod";

export const pipelineStatusInputSchema = z.object({});

export const pipelineActivityInputSchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
});

export type PipelineActivityInput = z.infer<typeof pipelineActivityInputSchema>;
