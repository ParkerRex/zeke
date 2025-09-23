import { logger, schemaTask } from "@trigger.dev/sdk";
import type { z } from "zod";

import { getDb } from "@jobs/init";
import { analyzeStorySchema } from "@jobs/schema";
import { createStoryQueries } from "@zeke/db/queries";

import { MODEL_VERSION_LABELS } from "../../utils/openai/constants";
import { generateAnalysis } from "../../utils/openai/generateAnalysis";
import { generateEmbedding } from "../../utils/openai/generateEmbedding";
import { generateStubAnalysis } from "../../utils/openai/generateStubAnalysis";
import { generateStubEmbedding } from "../../utils/openai/generateStubEmbedding";
import { createOpenAIClient } from "../../utils/openai/openaiClient";
import type { AnalysisInput, AnalysisResult } from "../../utils/openai/types";
import type { EmbeddingResult } from "../../utils/openai/types";

const USE_OPENAI = !!process.env.OPENAI_API_KEY;

export const analyzeStory = schemaTask({
  id: "analyze-story",
  schema: analyzeStorySchema,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (
    { storyId, trigger }: z.infer<typeof analyzeStorySchema>,
    { ctx },
  ) => {
    const db = getDb();
    const storyQueries = createStoryQueries(db);

    const story = await storyQueries.getStoryWithContent(storyId);
    if (!story) {
      logger.warn("analyze_story_missing", {
        storyId,
        trigger,
        runId: ctx.run.id,
      });
      return;
    }

    const input: AnalysisInput = {
      title: story.title,
      canonical_url: story.primary_url,
      text: story.text_body ?? "",
    };

    logger.info("analyze_story_start", {
      storyId,
      trigger,
      textLength: input.text.length,
      runId: ctx.run.id,
    });

    try {
      let analysisResult: AnalysisResult;
      let embeddingResult: EmbeddingResult;

      if (USE_OPENAI) {
        const client = createOpenAIClient();
        analysisResult = await generateAnalysis(client, input).catch(async () =>
          generateStubAnalysis(input),
        );
        embeddingResult = await generateEmbedding(client, {
          title: input.title,
          text: input.text,
        }).catch(async () =>
          generateStubEmbedding({ title: input.title, text: input.text }),
        );
      } else {
        [analysisResult, embeddingResult] = await Promise.all([
          generateStubAnalysis(input),
          generateStubEmbedding({ title: input.title, text: input.text }),
        ]);
      }

      const citationsWithChili = {
        ...analysisResult.citations,
        chili: analysisResult.chili,
      } as Record<string, unknown>;

      await Promise.all([
        storyQueries.upsertStoryOverlay({
          story_id: storyId,
          why_it_matters: analysisResult.why_it_matters,
          confidence: analysisResult.confidence,
          citations: citationsWithChili,
          analysis_state: USE_OPENAI ? "completed" : "stub",
        }),
        storyQueries.upsertStoryEmbedding({
          story_id: storyId,
          embedding: embeddingResult.embedding,
          model_version: USE_OPENAI
            ? MODEL_VERSION_LABELS.embedding
            : "stub-v1",
        }),
      ]);

      logger.info("analyze_story_success", {
        storyId,
        trigger,
        chili: analysisResult.chili,
        confidence: analysisResult.confidence,
        embeddingDimensions: embeddingResult.embedding.length,
      });
    } catch (error) {
      logger.error("analyze_story_error", { storyId, trigger, error });
      throw error;
    }
  },
});
