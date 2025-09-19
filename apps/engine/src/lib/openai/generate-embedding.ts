import { log } from '../../log.js';
import { withRetry } from '../../utils/retry.js';
import type { OpenAIClient } from './openai-client.js';
import type { EmbeddingInput, EmbeddingResult } from './types.js';

export async function generateEmbedding(
  client: OpenAIClient,
  story: EmbeddingInput
): Promise<EmbeddingResult> {
  const content = `${story.title || ''}\n\n${story.text}`;
  const truncatedContent =
    content.length > client.maxEmbeddingLen
      ? `${content.substring(0, client.maxEmbeddingLen)}...[truncated]`
      : content;

  try {
    const response = await withRetry(
      () =>
        client.openai.embeddings.create({
          model: client.embeddingModel,
          input: truncatedContent,
          dimensions: client.embeddingDimensions,
        }),
      { maxRetries: 3 }
    );

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length !== client.embeddingDimensions) {
      throw new Error(
        `Invalid embedding response: expected ${client.embeddingDimensions} dimensions, got ${embedding?.length || 0}`
      );
    }
    return { embedding };
  } catch (error) {
    log(
      'openai_embedding_error',
      { comp: 'analyze', error: String(error), story_title: story.title },
      'error'
    );
    throw error;
  }
}
