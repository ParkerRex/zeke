import { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { highlights } from "@zeke/db/schema";
import { createStoryQueries } from "@zeke/db/queries";

import { extractStructuredHighlights } from "./extract-structured";

const extractHighlightsSchema = z.object({
  storyId: z.string().uuid(),
  userId: z.string().uuid(), // System user for auto-generated highlights
  teamId: z.string().uuid().optional(), // null = global highlights
});

type ExtractHighlightsPayload = z.infer<typeof extractHighlightsSchema>;

/**
 * Extract structured highlights (code examples, changes, API updates, metrics)
 * Runs after analyzeStory to add detailed highlights beyond the basic analysis
 */
export const extractHighlights = schemaTask({
  id: "extract-highlights",
  schema: extractHighlightsSchema,
  queue: {
    concurrencyLimit: 10,
  },
  run: async (
    { storyId, userId, teamId }: ExtractHighlightsPayload,
    { logger, run },
  ) => {
    const db = getDb();
    const storyQueries = createStoryQueries(db);

    // Get story with content
    const story = await storyQueries.getStoryWithContent(storyId);
    if (!story) {
      logger.warn("extract_highlights_story_missing", {
        storyId,
        runId: run.id,
      });
      return;
    }

    const textBody = story.text_body || "";
    if (!textBody || textBody.length < 200) {
      logger.info("extract_highlights_content_too_short", {
        storyId,
        textLength: textBody.length,
        runId: run.id,
      });
      return;
    }

    logger.info("extract_highlights_start", {
      storyId,
      textLength: textBody.length,
      runId: run.id,
    });

    try {
      // Extract all structured highlights
      const structuredHighlights = extractStructuredHighlights(textBody);

      if (structuredHighlights.length === 0) {
        logger.info("extract_highlights_none_found", {
          storyId,
          runId: run.id,
        });
        return;
      }

      // Insert highlights into database
      const inserted = [];
      for (const highlight of structuredHighlights) {
        const [result] = await db
          .insert(highlights)
          .values({
            story_id: storyId,
            team_id: teamId || null,
            created_by: userId,
            kind: highlight.kind,
            origin: "system" as const,
            title: highlight.title,
            summary: highlight.summary,
            quote: highlight.quote,
            confidence: highlight.confidence.toString(),
            is_generated: true,
            metadata: highlight.metadata,
          })
          .returning({ id: highlights.id });

        if (result?.id) {
          inserted.push(result.id);
        }
      }

      logger.info("extract_highlights_success", {
        storyId,
        runId: run.id,
        extracted: structuredHighlights.length,
        inserted: inserted.length,
        breakdown: {
          code_example: structuredHighlights.filter(
            (h) => h.kind === "code_example",
          ).length,
          code_change: structuredHighlights.filter(
            (h) => h.kind === "code_change",
          ).length,
          api_change: structuredHighlights.filter(
            (h) => h.kind === "api_change",
          ).length,
          metric: structuredHighlights.filter((h) => h.kind === "metric")
            .length,
        },
      });

      return {
        storyId,
        highlightIds: inserted,
        count: inserted.length,
      };
    } catch (error) {
      logger.error("extract_highlights_error", {
        storyId,
        runId: run.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});
