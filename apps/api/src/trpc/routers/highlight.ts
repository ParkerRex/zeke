import {
  highlightEngagementSchema,
  highlightIdsInputSchema,
  highlightListResponseSchema,
  highlightsByKindInputSchema,
  highlightsByStoryInputSchema,
  prioritizedHighlightSchema,
  prioritizedHighlightsInputSchema,
} from "@api/schemas/highlight";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { z } from "@hono/zod-openapi";
import {
  getHighlightEngagement,
  getHighlightsByKind,
  getPrioritizedHighlights,
  getStoryHighlights,
} from "@zeke/db/queries";

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

  prioritized: protectedProcedure
    .input(prioritizedHighlightsInputSchema)
    .output(z.array(prioritizedHighlightSchema))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      const highlights = await getPrioritizedHighlights(
        db,
        teamId,
        input.limit,
      );

      return highlights;
    }),

  byKind: protectedProcedure
    .input(highlightsByKindInputSchema)
    .output(z.array(prioritizedHighlightSchema))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      const highlights = await getHighlightsByKind(
        db,
        teamId,
        input.kind,
        input.minRelevance,
        input.limit,
      );

      return highlights;
    }),
});
