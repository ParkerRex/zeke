import { logger, schemaTask } from "@trigger.dev/sdk";

import { getDb } from "@jobs/init";
import { dedupeInsightsSchema } from "@jobs/schema";
import {
  createStoryQueries,
  getStoryHighlights,
} from "@zeke/db/queries";

import { buildInsightKey } from "./helpers";
import { attachInsightToStory } from "./attach-to-story";

export const dedupeInsights = schemaTask({
  id: "insights-dedupe",
  schema: dedupeInsightsSchema,
  queue: {
    concurrencyLimit: 5,
  },
  run: async ({ storyId, teamId, createdBy, insights }, { ctx }) => {
    const db = getDb();
    const storyQueries = createStoryQueries(db);

    let resolvedTeamId = teamId ?? null;
    if (!resolvedTeamId) {
      const teams = await storyQueries.getTeamsForStory(storyId);
      resolvedTeamId = teams[0] ?? null;
      if (!resolvedTeamId) {
        logger.warn("insights_dedupe_missing_team", {
          storyId,
          runId: ctx.run.id,
        });
        return;
      }
    }

    const existingHighlights = await getStoryHighlights(db, {
      storyId,
      teamId: resolvedTeamId,
      includeGlobal: true,
    });

    const existingKeys = new Set<string>();
    for (const highlight of existingHighlights) {
      const key = buildInsightKey({
        summary: highlight.summary,
        quote: highlight.quote,
      });
      if (key) {
        existingKeys.add(key);
      }
    }

    const uniqueInsights = [] as typeof insights;
    for (const insight of insights) {
      const key = buildInsightKey({
        summary: insight.summary,
        quote: insight.quote ?? undefined,
      });
      if (!key) {
        logger.warn("insights_dedupe_missing_summary", {
          storyId,
          title: insight.title,
          runId: ctx.run.id,
        });
        continue;
      }
      if (existingKeys.has(key)) {
        logger.info("insights_dedupe_existing", {
          storyId,
          teamId: resolvedTeamId,
          dedupeKey: key,
          runId: ctx.run.id,
        });
        continue;
      }
      existingKeys.add(key);
      uniqueInsights.push({
        ...insight,
        metadata: {
          ...(insight.metadata ?? {}),
          dedupeKey: key,
        },
      });
    }

    if (uniqueInsights.length === 0) {
      logger.info("insights_dedupe_noop", {
        storyId,
        teamId: resolvedTeamId,
        runId: ctx.run.id,
      });
      return;
    }

    for (const insight of uniqueInsights) {
      await attachInsightToStory.trigger({
        storyId,
        teamId: resolvedTeamId,
        createdBy,
        insight,
      });
    }

    logger.info("insights_dedupe_triggered", {
      storyId,
      teamId: resolvedTeamId,
      createdCount: uniqueInsights.length,
      skippedCount: insights.length - uniqueInsights.length,
      runId: ctx.run.id,
    });
  },
});
