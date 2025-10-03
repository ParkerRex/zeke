import {
  createHighlightInputSchema,
  highlightEngagementSchema,
  highlightFeedInputSchema,
  highlightFeedResponseSchema,
  highlightIdsInputSchema,
  highlightListResponseSchema,
  highlightSchema,
  highlightTrendingInputSchema,
  highlightTrendingResponseSchema,
  highlightsByKindInputSchema,
  highlightsByStoryInputSchema,
  prioritizedHighlightSchema,
  prioritizedHighlightsInputSchema,
} from "@api/schemas/highlight";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import { logActivity } from "@db/utils/log-activity";
import { z } from "@hono/zod-openapi";
import { TRPCError } from "@trpc/server";
import {
  createHighlight,
  getHighlightEngagement,
  getHighlightFeed,
  getHighlightsByKind,
  getPrioritizedHighlights,
  getStoryHighlights,
  getTrendingHighlights,
} from "@zeke/db/queries";

export const highlightRouter = createTRPCRouter({
  personalizedFeed: protectedProcedure
    .input(highlightFeedInputSchema)
    .output(highlightFeedResponseSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const effectiveScope = teamId
        ? input.scope
        : input.scope === "team"
          ? "team"
          : input.scope === "all"
            ? "system"
            : input.scope;

      const feed = await getHighlightFeed(db, {
        teamId: teamId ?? null,
        limit: input.limit,
        offset: input.offset,
        kind: input.kind === "all" ? null : input.kind,
        tags: input.tags,
        goalIds: input.goalIds,
        sortBy: input.sortBy,
        scope: effectiveScope,
      });

      return {
        items: feed.items,
        pagination: {
          total: feed.total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < feed.total,
        },
        filters: {
          kind: input.kind === "all" ? null : input.kind,
          tags: input.tags ?? [],
          goalIds: input.goalIds ?? [],
          sortBy: input.sortBy,
          scope: effectiveScope,
        },
      };
    }),

  trending: publicProcedure
    .input(highlightTrendingInputSchema)
    .output(highlightTrendingResponseSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const effectiveScope = teamId
        ? input.scope
        : input.scope === "team"
          ? "team"
          : input.scope === "all"
            ? "system"
            : input.scope;

      const items = await getTrendingHighlights(db, {
        timeframe: input.timeframe,
        limit: input.limit,
        teamId: teamId ?? null,
        scope: effectiveScope,
      });

      return {
        items,
        timeframe: input.timeframe,
        generatedAt: new Date().toISOString(),
      };
    }),

  create: protectedProcedure
    .input(createHighlightInputSchema)
    .output(highlightSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Team context required",
        });
      }

      const highlight = await createHighlight(db, {
        storyId: input.storyId,
        teamId,
        createdBy: session.user.id,
        chapterId: input.chapterId ?? null,
        kind: input.kind,
        title: input.title ?? null,
        summary: input.summary,
        quote: input.quote ?? null,
        startSeconds: input.startSeconds ?? null,
        endSeconds: input.endSeconds ?? null,
        metadata: input.metadata ?? null,
        origin: input.origin,
        originMetadata: input.originMetadata ?? null,
        tags: input.tags,
        turnIds: input.turnIds,
      });

      if (!highlight) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create highlight",
        });
      }

      logActivity({
        db,
        teamId,
        userId: session.user.id,
        type: "highlight_created",
        metadata: {
          highlightId: highlight.id,
          storyId: highlight.storyId,
          kind: highlight.kind,
          origin: highlight.origin,
        },
      });

      return highlight;
    }),

  byStory: protectedProcedure
    .input(highlightsByStoryInputSchema)
    .output(highlightListResponseSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const scope = input.scope ?? (input.includeGlobal ? "all" : "team");
      const records = await getStoryHighlights(db, {
        storyId: input.storyId,
        teamId,
        includeGlobal: input.includeGlobal,
        scope,
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
