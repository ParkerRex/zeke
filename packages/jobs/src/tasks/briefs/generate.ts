import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { getDb } from "@jobs/init";
import { stories, storyOverlays } from "@zeke/db/schema";
import { eq } from "drizzle-orm";

import { createOpenAIClient } from "../../utils/openai/openaiClient";

const generateBriefSchema = z.object({
  storyId: z.string().uuid(),
  reason: z.enum(["new_story", "manual", "regenerate"]).default("new_story"),
});

type GenerateBriefPayload = z.infer<typeof generateBriefSchema>;

/**
 * Generates a brief (40-second read) from a story's existing why_it_matters
 *
 * Brief hierarchy:
 * - brief_one_liner: Single punchy sentence (Twitter-style)
 * - brief_two_liner: 2 sentences with more context
 * - brief_elevator: Full 30-40 second pitch with key details
 *
 * Also calculates time_saved_seconds based on original content length
 */
export const generateBrief = schemaTask({
  id: "generate-brief",
  schema: generateBriefSchema,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ storyId, reason }: GenerateBriefPayload, { ctx }) => {
    const db = getDb();

    // Get story with overlay
    const [story] = await db
      .select({
        id: stories.id,
        title: stories.title,
        summary: stories.summary,
        why_it_matters: storyOverlays.why_it_matters,
        overlay_exists: storyOverlays.story_id,
      })
      .from(stories)
      .leftJoin(storyOverlays, eq(stories.id, storyOverlays.story_id))
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      logger.warn("generate_brief_story_missing", { storyId, reason, runId: ctx.run.id });
      return;
    }

    if (!story.why_it_matters) {
      logger.info("generate_brief_no_analysis", {
        storyId,
        reason,
        message: "Story has no why_it_matters yet",
        runId: ctx.run.id,
      });
      return;
    }

    try {
      // Use OpenAI to generate brief variants
      const client = createOpenAIClient();

      const prompt = `You are a master of concise technical communication. Given a story analysis, create 3 brief variants:

STORY TITLE: ${story.title}

FULL ANALYSIS:
${story.why_it_matters}

Generate exactly 3 variants (no headers, just the text):

1. ONE-LINER (single sentence, <140 chars, punchy and direct)
2. TWO-LINER (exactly 2 sentences, <280 chars, add key context)
3. ELEVATOR (3-4 sentences, 40-second read, include specific details like code changes, API updates, or metrics)

Format:
ONE_LINER: [text]
TWO_LINER: [text]
ELEVATOR: [text]

Focus on what developers/researchers need to know RIGHT NOW. Include specifics: version numbers, breaking changes, new capabilities, performance metrics.`;

      const response = await client.openai.responses.create({
        model: client.chatModel,
        input: [
          {
            role: "system",
            content: "You are a master of concise technical communication.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      const briefText = response.output_text;
      if (!briefText) {
        throw new Error("No response from OpenAI");
      }

      // Parse response
      const oneLinerMatch = briefText.match(/ONE_LINER:\s*(.+?)(?=\n|TWO_LINER|$)/s);
      const twoLinerMatch = briefText.match(/TWO_LINER:\s*(.+?)(?=\n|ELEVATOR|$)/s);
      const elevatorMatch = briefText.match(/ELEVATOR:\s*(.+?)$/s);

      const briefOneLiner = oneLinerMatch?.[1]?.trim() || null;
      const briefTwoLiner = twoLinerMatch?.[1]?.trim() || null;
      const briefElevator = elevatorMatch?.[1]?.trim() || null;

      if (!briefOneLiner || !briefTwoLiner || !briefElevator) {
        logger.warn("generate_brief_parse_failed", {
          storyId,
          reason,
          response: briefText,
          runId: ctx.run.id,
        });
        return;
      }

      // Calculate time saved
      // Assume original content takes 200 words/min reading speed
      // Average article length: ~800 words = 4 minutes = 240 seconds
      // Brief elevator pitch: ~80 words = 24 seconds
      const estimatedOriginalSeconds = 240; // 4 minute read
      const briefReadSeconds = 40; // 40 second read
      const timeSavedSeconds = estimatedOriginalSeconds - briefReadSeconds;

      // Update or insert story overlay with brief fields
      if (story.overlay_exists) {
        await db
          .update(storyOverlays)
          .set({
            brief_one_liner: briefOneLiner,
            brief_two_liner: briefTwoLiner,
            brief_elevator: briefElevator,
            time_saved_seconds: timeSavedSeconds,
            brief_generated_at: new Date().toISOString(),
          })
          .where(eq(storyOverlays.story_id, storyId));
      } else {
        await db.insert(storyOverlays).values({
          story_id: storyId,
          brief_one_liner: briefOneLiner,
          brief_two_liner: briefTwoLiner,
          brief_elevator: briefElevator,
          time_saved_seconds: timeSavedSeconds,
          brief_generated_at: new Date().toISOString(),
        });
      }

      logger.info("generate_brief_success", {
        storyId,
        reason,
        runId: ctx.run.id,
        timeSavedSeconds,
        briefLength: {
          oneLiner: briefOneLiner.length,
          twoLiner: briefTwoLiner.length,
          elevator: briefElevator.length,
        },
      });

      return {
        storyId,
        briefOneLiner,
        briefTwoLiner,
        briefElevator,
        timeSavedSeconds,
      };
    } catch (error) {
      logger.error("generate_brief_error", {
        storyId,
        reason,
        runId: ctx.run.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});