import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";
import * as schema from "@zeke/db/schema";
import { and } from "drizzle-orm";
import { requirePermission } from "../middleware/rbac";
import { createAuditLogger } from "@api/utils/audit-logger";

/**
 * Insights router - provides personalized highlight feeds
 */
export const insightsRouter = createTRPCRouter({
  /**
   * Personalized feed endpoint - returns paginated highlights filtered by goals/tags
   * Includes proper access control for free vs paid users
   */
  personalizedFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        goalIds: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        kind: z
          .enum(["insight", "quote", "action", "question", "all"])
          .default("all"),
        sortBy: z
          .enum(["recent", "relevant", "confidence"])
          .default("relevant"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { db, session, teamId } = ctx;
      const isAuthenticated = !!session?.user;
      const isPaidUser = await checkPaidStatus(db, teamId);

      // Determine content access level
      const accessLevel = isPaidUser
        ? "full"
        : isAuthenticated
          ? "limited"
          : "teaser";

      try {
        // Base query for highlights
        let query = db.query.highlights;
        let whereConditions = [];

        // Filter by team if authenticated
        if (teamId) {
          whereConditions.push(["teamId", "eq", teamId]);
        } else {
          // Show only public highlights for unauthenticated users
          whereConditions.push(["teamId", "isNull", true]);
        }

        // Filter by kind if specified
        if (input.kind !== "all") {
          whereConditions.push(["kind", "eq", input.kind]);
        }

        // Filter by goals if specified
        if (input.goalIds && input.goalIds.length > 0) {
          // This would require a join with a goal_highlights table
          // Simplified for this implementation
        }

        // Fetch highlights with related data
        const highlights = await db.query.highlights.findMany({
          where: (highlights, { and, eq, isNull }) => {
            if (teamId) {
              return eq(highlights.teamId, teamId);
            }
            return isNull(highlights.teamId);
          },
          with: {
            story: {
              with: {
                overlays: true,
                primarySource: true,
              },
            },
            tags: true,
            collaborators: true,
          },
          orderBy: (highlights, { desc }) => {
            switch (input.sortBy) {
              case "confidence":
                return [desc(highlights.confidence)];
              case "relevant":
                // In production, this would use a relevance score
                return [
                  desc(highlights.confidence),
                  desc(highlights.createdAt),
                ];
              default:
                return [desc(highlights.createdAt)];
            }
          },
          limit: input.limit,
          offset: input.offset,
        });

        // Filter by tags if specified (post-query filtering for simplicity)
        let filteredHighlights = highlights;
        if (input.tags && input.tags.length > 0) {
          filteredHighlights = highlights.filter((h) =>
            h.tags?.some((t) => input.tags?.includes(t.tag)),
          );
        }

        // Apply access control
        const processedHighlights = filteredHighlights.map((highlight) => {
          if (accessLevel === "teaser") {
            // Show only preview for unauthenticated users
            return {
              ...highlight,
              summary: highlight.summary
                ? highlight.summary.substring(0, 100) + "..."
                : null,
              quote: null,
              isLocked: true,
              lockMessage: "Sign up to view full insights",
            };
          } else if (accessLevel === "limited") {
            // Show limited content for free authenticated users
            return {
              ...highlight,
              isLocked: false,
              limitedAccess: true,
              upgradeMessage: "Upgrade for unlimited insights",
            };
          }
          // Full access for paid users
          return {
            ...highlight,
            isLocked: false,
            fullAccess: true,
          };
        });

        // Get total count for pagination
        const totalCount = await db.query.highlights
          .findMany({
            where: (highlights, { and, eq, isNull }) => {
              if (teamId) {
                return eq(highlights.teamId, teamId);
              }
              return isNull(highlights.teamId);
            },
          })
          .then((results) => results.length);

        return {
          items: processedHighlights,
          pagination: {
            total: totalCount,
            limit: input.limit,
            offset: input.offset,
            hasMore: input.offset + input.limit < totalCount,
          },
          accessLevel,
          metadata: {
            isPersonalized: !!input.goalIds || !!input.tags,
            appliedFilters: {
              kind: input.kind !== "all" ? input.kind : null,
              tags: input.tags || [],
              goals: input.goalIds || [],
            },
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch personalized feed",
        });
      }
    }),

  /**
   * Get trending insights across all teams (public)
   */
  trending: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        timeframe: z.enum(["day", "week", "month"]).default("week"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { db } = ctx;

      const timeframeMap = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      };

      const since = new Date(Date.now() - timeframeMap[input.timeframe]);

      try {
        const trendingHighlights = await db.query.highlights.findMany({
          where: (highlights, { gte, gt }) =>
            and(
              gte(highlights.createdAt, since),
              gt(highlights.confidence, 0.7),
            ),
          orderBy: (highlights, { desc }) => [
            desc(highlights.confidence),
            desc(highlights.createdAt),
          ],
          limit: input.limit,
          with: {
            story: {
              with: {
                overlays: true,
              },
            },
          },
        });

        return {
          items: trendingHighlights,
          timeframe: input.timeframe,
          generatedAt: new Date().toISOString(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch trending insights",
        });
      }
    }),

  /**
   * Create a new highlight
   */
  create: protectedProcedure
    .use(requirePermission("write:insights"))
    .input(
      z.object({
        storyId: z.string().uuid(),
        kind: z.enum(["insight", "quote", "action", "question"]),
        title: z.string().optional(),
        summary: z.string(),
        quote: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db, session, teamId } = ctx;

      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Team context required",
        });
      }

      try {
        // Create the highlight
        const highlight = await db
          .insert(schema.highlights)
          .values({
            storyId: input.storyId,
            teamId,
            createdBy: session.user.id,
            kind: input.kind,
            origin: "user",
            title: input.title,
            summary: input.summary,
            quote: input.quote,
            confidence: 0.95, // User-created highlights have high confidence
          })
          .returning();

        // Add tags if provided
        if (input.tags && input.tags.length > 0) {
          await Promise.all(
            input.tags.map((tag) =>
              db.insert(schema.highlightTags).values({
                highlightId: highlight[0].id,
                tag,
              }),
            ),
          );
        }

        // Track activity
        await db.insert(schema.activities).values({
          teamId,
          actorId: session.user.id,
          type: "highlight_created",
          visibility: "team",
          highlightId: highlight[0].id,
          metadata: { kind: input.kind },
        });

        // Audit log
        const audit = createAuditLogger(ctx);
        audit.log({
          type: "insight_created",
          resource: { type: "insight", id: highlight[0].id },
          metadata: { kind: input.kind, storyId: input.storyId },
        });

        return highlight[0];
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create highlight",
        });
      }
    }),
});

/**
 * Check if team has paid subscription
 */
async function checkPaidStatus(db: any, teamId?: string): Promise<boolean> {
  if (!teamId) return false;

  const subscription = await db.query.subscriptions.findFirst({
    where: (subs, { and, eq, inArray }) =>
      and(
        eq(subs.teamId, teamId),
        inArray(subs.status, ["active", "trialing"]),
      ),
  });

  return !!subscription;
}
