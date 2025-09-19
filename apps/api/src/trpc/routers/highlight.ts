import {
  highlightEngagementSchema,
  highlightIdsInputSchema,
  highlightListResponseSchema,
  highlightsByStoryInputSchema,
} from "@api/schemas/highlight";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { z } from "@hono/zod-openapi";
import { getHighlightEngagement, getStoryHighlights } from "@zeke/db/queries";

export const highlightRouter = createTRPCRouter({
  byStory: protectedProcedure
    .input(highlightsByStoryInputSchema)
    .output(highlightListResponseSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const records = await getStoryHighlights(db, {
        storyId: input.storyId,
        teamId,
        includeGlobal: input.includeGlobal,
      });

      return records;
    }),

  engagement: protectedProcedure
    .input(highlightIdsInputSchema)
    .output(z.array(highlightEngagementSchema))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      const rows = await getHighlightEngagement(db, {
        teamId,
        highlightIds: input.highlightIds,
      });

      return rows;
    }),
});
