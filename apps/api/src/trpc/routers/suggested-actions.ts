import { getSuggestedActionsSchema } from "@api/schemas/suggested-actions";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  type SuggestedActionUsage,
  suggestedActionsCache,
} from "@zeke/cache/suggested-actions-cache";

// Research-focused suggested actions surfaced in the assistant UI
const SUGGESTED_ACTIONS_CONFIG = [
  {
    id: "trending-story-highlights",
    toolName: "getHighlights",
    toolParams: {
      timeframe: "week",
      limit: 6,
    },
  },
  {
    id: "summarize-new-sources",
    toolName: "getSummaries",
    toolParams: {
      maxSources: 5,
      style: "brief",
    },
  },
  {
    id: "draft-executive-brief",
    toolName: "getBrief",
    toolParams: {
      topic: "Latest research findings",
      audience: "executive",
      format: "brief",
      includeRecommendations: true,
    },
  },
  {
    id: "plan-research-playbook",
    toolName: "getPlaybook",
    toolParams: {
      objective: "Launch a competitive intelligence playbook",
      scope: "moderate",
      timeline: "weekly",
      automationLevel: "semi-auto",
    },
  },
  {
    id: "link-related-insights",
    toolName: "linkInsights",
    toolParams: {
      lookForPatterns: true,
      minConfidence: 0.75,
    },
  },
] as const;

export const suggestedActionsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(getSuggestedActionsSchema)
    .query(async ({ ctx: { teamId, session }, input }) => {
      const userId = session.user.id;

      if (!teamId) {
        return {
          actions: SUGGESTED_ACTIONS_CONFIG.slice(0, input.limit).map(
            (action) => ({
              id: action.id,
              toolName: action.toolName,
              toolParams: action.toolParams,
              usageCount: 0,
              lastUsed: null,
            }),
          ),
          total: SUGGESTED_ACTIONS_CONFIG.length,
        } as const;
      }

      // Get usage data for all actions. If the cache is unavailable, fall back to defaults.
      let allUsage: Record<string, SuggestedActionUsage> = {};
      try {
        allUsage = await suggestedActionsCache.getAllUsage(teamId, userId);
      } catch (error) {
        console.error("Failed to load suggested action usage", error);
      }

      // Map actions with usage data and sort by usage count (descending) then by recency
      const actionsWithUsage = SUGGESTED_ACTIONS_CONFIG.map((action) => {
        const usage = allUsage[action.id];

        return {
          id: action.id,
          toolName: action.toolName,
          toolParams: action.toolParams,
          usageCount: usage?.count || 0,
          lastUsed: usage?.lastUsed ? new Date(usage.lastUsed) : null,
        };
      })
        .sort((a, b) => {
          // Sort by usage count first (descending)
          if (a.usageCount !== b.usageCount) {
            return b.usageCount - a.usageCount;
          }

          // Then by recency (most recent first)
          if (a.lastUsed && b.lastUsed) {
            return b.lastUsed.getTime() - a.lastUsed.getTime();
          }

          // If one has been used and the other hasn't, prioritize the used one
          if (a.lastUsed && !b.lastUsed) return -1;
          if (!a.lastUsed && b.lastUsed) return 1;

          // If neither has been used, maintain original order
          return 0;
        })
        .slice(0, input.limit);

      return {
        actions: actionsWithUsage,
        total: SUGGESTED_ACTIONS_CONFIG.length,
      };
    }),
});
