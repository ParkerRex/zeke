import {
  listStoriesInputSchema,
  listStoriesResponseSchema,
  storyDetailSchema,
  storyIdInputSchema,
  storyMetricsInputSchema,
  storyMetricsSchema,
} from "@api/schemas/story";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getStoryForDisplay,
  getStoryMetrics,
  listStoriesForDisplay,
} from "@zeke/db/queries";
import { TRPCError } from "@trpc/server";
import { z } from "@hono/zod-openapi";

export const storyRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listStoriesInputSchema)
    .output(listStoriesResponseSchema)
    .query(async ({ ctx: { db }, input }) => {
      const { limit, offset, kind, search, storyIds } = input;

      const result = await listStoriesForDisplay(db, {
        limit,
        offset,
        kind,
        search: search ?? null,
        storyIds,
      });

      return result;
    }),

  get: protectedProcedure
    .input(storyIdInputSchema)
    .output(storyDetailSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const detail = await getStoryForDisplay(db, input.storyId);

      if (!detail) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
      }

      if (teamId) {
        const [teamMetrics] = await getStoryMetrics(db, {
          teamId,
          storyIds: [input.storyId],
        });

        if (teamMetrics) {
          return {
            ...detail,
            metrics: teamMetrics,
          };
        }
      }

      return detail;
    }),

  metrics: protectedProcedure
    .input(storyMetricsInputSchema)
    .output(z.array(storyMetricsSchema))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      const rows = await getStoryMetrics(db, {
        teamId,
        storyIds: input.storyIds,
      });

      return rows;
    }),
});
