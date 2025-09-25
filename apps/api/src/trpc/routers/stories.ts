import {
  listStoriesInputSchema as getStoriesSchema,
  storyIdInputSchema as getStoryByIdSchema,
  storyMetricsInputSchema as getStoryMetricsSchema,
} from "@api/schemas/stories";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  getStoryForDisplay,
  getStoryMetrics,
  listStoriesForDisplay,
} from "@zeke/db/queries";

export const storiesRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getStoriesSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return listStoriesForDisplay(db, {
        teamId: teamId!,
        limit: input.limit,
        offset: input.offset,
        kind: input.kind,
        search: input.search ?? null,
        storyIds: input.storyIds,
      });
    }),

  getById: protectedProcedure
    .input(getStoryByIdSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const detail = await getStoryForDisplay(db, input.storyId);

      if (!detail) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
      }

      if (!teamId) {
        return detail;
      }

      const [teamMetrics] = await getStoryMetrics(db, {
        teamId,
        storyIds: [input.storyId],
      });

      if (!teamMetrics) {
        return detail;
      }

      return {
        ...detail,
        metrics: teamMetrics,
      };
    }),

  getMetrics: protectedProcedure
    .input(getStoryMetricsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        return [];
      }

      return getStoryMetrics(db, {
        teamId,
        storyIds: input.storyIds,
      });
    }),
});
