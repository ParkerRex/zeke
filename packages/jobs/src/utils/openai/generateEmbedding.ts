import { logger } from "@jobs/schema-task";
import { withRetry } from "../async/withRetry";
import type { OpenAIClient } from "./openaiClient";
import type { EmbeddingInput, EmbeddingResult } from "./types";

export async function generateEmbedding(
  client: OpenAIClient,
  story: EmbeddingInput,
): Promise<EmbeddingResult> {
  const content = `${story.title || ""}\n\n${story.text}`;
  const truncated =
    content.length > client.maxEmbeddingLen
      ? `${content.substring(0, client.maxEmbeddingLen)}...[truncated]`
      : content;

  try {
    const response = await withRetry(
      () =>
        client.openai.embeddings.create({
          model: client.embeddingModel,
          input: truncated,
          dimensions: client.embeddingDimensions,
        }),
      { maxRetries: 3 },
    );

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length !== client.embeddingDimensions) {
      throw new Error(
        `Invalid embedding response: expected ${client.embeddingDimensions} dimensions, got ${embedding?.length || 0}`,
      );
    }

    return { embedding };
  } catch (error) {
    logger.error("openai_embedding_error", {
      error,
      storyTitle: story.title,
    });
    throw error;
  }
}
