import {
  triggerRunStatusInputSchema,
  triggerRunStatusResponseSchema,
  triggerTaskInputSchema,
  triggerTaskResponseSchema,
} from "@api/schemas/trigger";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { getTriggerRun, triggerTaskRun } from "@api/services/trigger";

export const triggerRouter = createTRPCRouter({
  trigger: protectedProcedure
    .input(triggerTaskInputSchema)
    .output(triggerTaskResponseSchema)
    .mutation(async ({ input }) => {
      return triggerTaskRun(input.taskId, input.payload ?? {});
    }),

  run: protectedProcedure
    .input(triggerRunStatusInputSchema)
    .output(triggerRunStatusResponseSchema)
    .query(async ({ input }) => {
      return getTriggerRun(input.runId);
    }),
});
