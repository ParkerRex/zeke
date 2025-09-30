import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { getDb } from "@jobs/init";
import { highlights, sources, stories } from "@zeke/db/schema";
import { eq, and } from "drizzle-orm";
import { ICP_KEYWORDS } from "../../config/icp-sources";

const scoreRelevanceSchema = z.object({
  storyId: z.string().uuid(),
});

type ScoreRelevancePayload = z.infer<typeof scoreRelevanceSchema>;

/**
 * Calculate relevance scores for highlights based on ICP keywords
 * Stores score in highlights.metadata for prioritization
 */
export const scoreRelevance = schemaTask({
  id: "score-relevance",
  schema: scoreRelevanceSchema,
  queue: {
    concurrencyLimit: 20,
  },
  run: async ({ storyId }: ScoreRelevancePayload, { ctx }) => {
    const db = getDb();

    // Get story with source and highlights
    const storyData = await db
      .select({
        story_id: stories.id,
        story_title: stories.title,
        story_summary: stories.summary,
        story_published_at: stories.published_at,
        source_authority: sources.authority_score,
        highlight_id: highlights.id,
        highlight_kind: highlights.kind,
        highlight_title: highlights.title,
        highlight_summary: highlights.summary,
        highlight_quote: highlights.quote,
        highlight_metadata: highlights.metadata,
      })
      .from(stories)
      .leftJoin(sources, eq(stories.primary_source_id, sources.id))
      .leftJoin(highlights, eq(highlights.story_id, stories.id))
      .where(eq(stories.id, storyId));

    if (storyData.length === 0) {
      logger.warn("score_relevance_story_missing", { storyId, runId: ctx.run.id });
      return;
    }

    const storyInfo = storyData[0];
    const storyHighlights = storyData.filter(row => row.highlight_id !== null);

    if (storyHighlights.length === 0) {
      logger.info("score_relevance_no_highlights", { storyId, runId: ctx.run.id });
      return;
    }

    logger.info("score_relevance_start", {
      storyId,
      highlightCount: storyHighlights.length,
      runId: ctx.run.id,
    });

    // Calculate freshness score (0.0-1.0)
    // Content < 7 days = 1.0, content > 30 days = 0.5
    const daysSincePublished = storyInfo.story_published_at
      ? (Date.now() - new Date(storyInfo.story_published_at).getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    const freshnessScore = Math.max(0.5, Math.min(1.0, 1.0 - (daysSincePublished / 60)));

    // Source authority (already 0.0-1.0)
    const authorityScore = storyInfo.source_authority
      ? parseFloat(storyInfo.source_authority)
      : 0.7;

    let scored = 0;

    for (const highlight of storyHighlights) {
      if (!highlight.highlight_id) continue;

      // Calculate keyword match score
      const textToScore = [
        highlight.highlight_title || "",
        highlight.highlight_summary || "",
        highlight.highlight_quote?.slice(0, 500) || "", // First 500 chars
        storyInfo.story_title || "",
      ].join(" ").toLowerCase();

      const keywordMatches = ICP_KEYWORDS.filter(keyword =>
        textToScore.includes(keyword.toLowerCase())
      );

      // Keyword score: 0.0 (no matches) to 1.0 (5+ matches)
      const keywordScore = Math.min(1.0, keywordMatches.length / 5);

      // Highlight kind weights
      const kindWeights = {
        code_change: 1.0,   // Breaking changes = highest priority
        api_change: 0.95,   // API updates = very high
        metric: 0.9,        // Performance data = high
        code_example: 0.85, // Code examples = good
        insight: 0.8,       // General insights = medium-high
        action: 0.75,       // Actionable items = medium
        quote: 0.6,         // Quotes = lower
        question: 0.5,      // Questions = lowest
      };

      const kindWeight = kindWeights[highlight.highlight_kind as keyof typeof kindWeights] || 0.7;

      // Final relevance score = weighted average
      // 40% keyword match, 30% kind, 20% authority, 10% freshness
      const relevanceScore =
        keywordScore * 0.4 +
        kindWeight * 0.3 +
        authorityScore * 0.2 +
        freshnessScore * 0.1;

      // Round to 2 decimal places
      const finalScore = Math.round(relevanceScore * 100) / 100;

      // Update highlight metadata with score
      const existingMetadata = (highlight.highlight_metadata || {}) as Record<string, any>;
      await db
        .update(highlights)
        .set({
          metadata: {
            ...existingMetadata,
            relevance_score: finalScore,
            keyword_matches: keywordMatches,
            scored_at: new Date().toISOString(),
            score_breakdown: {
              keyword: Math.round(keywordScore * 100) / 100,
              kind: kindWeight,
              authority: authorityScore,
              freshness: Math.round(freshnessScore * 100) / 100,
            },
          },
        })
        .where(eq(highlights.id, highlight.highlight_id));

      scored++;

      logger.info("score_relevance_highlight", {
        highlightId: highlight.highlight_id,
        kind: highlight.highlight_kind,
        relevanceScore: finalScore,
        keywordMatches: keywordMatches.length,
        runId: ctx.run.id,
      });
    }

    logger.info("score_relevance_success", {
      storyId,
      runId: ctx.run.id,
      highlightsScored: scored,
      avgDaysSincePublished: Math.round(daysSincePublished),
    });

    return {
      storyId,
      highlightsScored: scored,
      freshnessScore,
      authorityScore,
    };
  },
});