import type { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { summarizeStorySchema } from "@jobs/schema";
import { createStoryQueries } from "@zeke/db/queries";

const FALLBACK_SUMMARY_LENGTH = 320;

function buildFallbackSummary(title: string | null, text: string): string {
  const content = (title?.trim() ? `${title.trim()} — ` : "") + text.trim();
  if (!content) {
    return "No summary available yet.";
  }

  if (content.length <= FALLBACK_SUMMARY_LENGTH) {
    return content;
  }

  return `${content.slice(0, FALLBACK_SUMMARY_LENGTH - 3)}...`;
}

export const summarizeStory = schemaTask({
  id: "story-summarize",
  schema: summarizeStorySchema,
  queue: {
    concurrencyLimit: 4,
  },
  run: async (
    { storyId, mode }: z.infer<typeof summarizeStorySchema>,
    { logger, run },
  ) => {
    const db = getDb();
    const storyQueries = createStoryQueries(db);

    const story = await storyQueries.getStoryWithContent(storyId);

    if (!story) {
      logger.warn("story_summary_missing", { storyId, runId: run.id });
      return;
    }

    if (mode === "auto" && story.summary) {
      logger.info("story_summary_skip_existing", {
        storyId,
        runId: run.id,
      });
      return;
    }

    const overlay = await storyQueries.getStoryOverlay(storyId);
    const summary = overlay?.why_it_matters
      ? String(overlay.why_it_matters)
      : buildFallbackSummary(story.title, story.text_body ?? "");

    await storyQueries.updateStorySummary(storyId, summary);

    logger.info("story_summary_updated", {
      storyId,
      mode,
      runId: run.id,
      usedOverlay: Boolean(overlay?.why_it_matters),
      summaryLength: summary.length,
    });
  },
});
