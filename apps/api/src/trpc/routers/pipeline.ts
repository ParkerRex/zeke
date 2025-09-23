import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { ingestUploadSchema } from "@zeke/jobs/schema";
import {
  analyzeStory,
  ingestFromUpload,
  ingestOneOff,
  ingestPull,
  ingestSource,
} from "@zeke/jobs/tasks";
import { z } from "zod";

/**
 * Pipeline router exposes manual triggers for ingestion tasks.
 */
export const pipelineRouter = createTRPCRouter({
  ingestAll: protectedProcedure
    .input(
      z
        .object({ reason: z.enum(["manual", "schedule"]).default("manual") })
        .default({ reason: "manual" }),
    )
    .mutation(async ({ input, ctx }) => {
      await ingestPull.trigger({ reason: input.reason });
      return { ok: true };
    }),

  ingestSource: protectedProcedure
    .input(z.object({ sourceId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await ingestSource.trigger({
        sourceId: input.sourceId,
        reason: "manual",
      });
      return { ok: true };
    }),

  ingestUrl: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      await ingestOneOff.trigger({
        url: input.url,
        requestedBy: ctx.session?.user.id,
      });
      return { ok: true };
    }),

  reanalyzeStory: protectedProcedure
    .input(z.object({ storyId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await analyzeStory.trigger({
        storyId: input.storyId,
        trigger: "manual",
      });
      return { ok: true };
    }),

  upload: protectedProcedure
    .input(ingestUploadSchema)
    .mutation(async ({ input, ctx }) => {
      await ingestFromUpload.trigger({
        ...input,
        uploadedBy: input.uploadedBy ?? ctx.session?.user.id,
      });
      return { ok: true };
    }),
});
