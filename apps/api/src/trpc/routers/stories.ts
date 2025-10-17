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
import { gte } from "drizzle-orm";
import { z } from "zod";

export const storiesRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getStoriesSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Team context required",
        });
      }

      return listStoriesForDisplay(db, {
        teamId,
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

  /**
   * Dashboard summaries endpoint - provides categorized story data for hero modules
   * Returns trending, signals, and repo watch stories with pagination and caching
   */
  dashboardSummaries: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(10),
          includeMetrics: z.boolean().default(true),
        })
        .optional(),
    )
    .query(async ({ input, ctx: { db, teamId } }) => {
      const limit = input?.limit ?? 10;
      const includeMetrics = input?.includeMetrics ?? true;

      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Team context required",
        });
      }

      try {
        const now = Date.now();
        const sevenDaysAgoIso = new Date(
          now - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const fourteenDaysAgoIso = new Date(
          now - 14 * 24 * 60 * 60 * 1000,
        ).toISOString();

        // Fetch different categories of stories in parallel
        const [trendingStories, repoWatchStories] = await Promise.all([
          // Trending: Recent stories with high engagement
          db.query.stories.findMany({
            where: (stories, { gte }) =>
              gte(stories.published_at, sevenDaysAgoIso), // Last 7 days
            orderBy: (stories, { desc }) => [desc(stories.published_at)],
            limit,
          }),

          // Repo Watch: Stories from specific watched sources
          db.query.stories.findMany({
            where: (stories, { gte }) =>
              gte(stories.created_at, fourteenDaysAgoIso),
            orderBy: (stories, { desc }) => [desc(stories.created_at)],
            limit: Math.floor(limit / 2), // Fewer repo watch items
          }),
        ]);

        // Signals: Stories marked as important signals - fetch separately
        const signalsStories = await listStoriesForDisplay(db, {
          teamId,
          limit,
          offset: 0,
        }).then((result) => result.stories);

        // Get metrics for all story IDs if requested
        const metricsMap = new Map();
        if (includeMetrics) {
          const allStoryIds = [
            ...trendingStories.map((s) => s.id),
            ...signalsStories.map((s) => s.id),
            ...repoWatchStories.map((s) => s.id),
          ];

          const metrics = await getStoryMetrics(db, {
            teamId,
            storyIds: allStoryIds,
          });

          for (const m of metrics) {
            metricsMap.set(m.storyId, m);
          }
        }

        // Format response with categories
        return {
          trending: {
            title: "Trending Now",
            description: "Latest high-impact stories from the past week",
            stories: trendingStories.map((story) => ({
              ...story,
              metrics: includeMetrics ? metricsMap.get(story.id) : undefined,
              chiliScore: 0,
              whyItMatters: "Analysis pending",
            })),
          },
          signals: {
            title: "Important Signals",
            description: "Stories your team has marked as critical",
            stories: signalsStories.map((story) => ({
              ...story,
              metrics: includeMetrics ? metricsMap.get(story.id) : undefined,
              chiliScore: 0,
              whyItMatters: "Analysis pending",
            })),
          },
          repoWatch: {
            title: "Repository Watch",
            description: "Updates from your monitored sources",
            stories: repoWatchStories.map((story) => ({
              ...story,
              metrics: includeMetrics ? metricsMap.get(story.id) : undefined,
              chiliScore: 0,
              whyItMatters: "Analysis pending",
            })),
          },
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard summaries",
        });
      }
    }),
});
