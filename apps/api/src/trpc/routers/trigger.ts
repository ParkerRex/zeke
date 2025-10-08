import {
  triggerIngestUrlInputSchema,
  triggerRunPlaybookInputSchema,
  triggerRunStatusInputSchema,
  triggerRunStatusResponseSchema,
  triggerTaskInputSchema,
  triggerTaskResponseSchema,
} from "@api/schemas/trigger";
import { getTriggerRun, triggerTaskRun } from "@api/services/trigger";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { TRPCError } from "@trpc/server";

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

  ingestUrl: protectedProcedure
    .input(triggerIngestUrlInputSchema)
    .output(triggerTaskResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;

      return triggerTaskRun("ingest-oneoff", {
        url: input.url,
        requestedBy: session?.user.id,
        priority: input.priority,
      });
    }),

  runPlaybook: protectedProcedure
    .input(triggerRunPlaybookInputSchema)
    .output(triggerTaskResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const { teamId, session } = ctx;

      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Team context required",
        });
      }

      return triggerTaskRun("playbook-run", {
        playbookId: input.playbookId,
        teamId,
        triggeredBy: session.user.id,
        triggerSource: "dashboard",
        metadata: input.context ?? undefined,
      });
    }),
});
