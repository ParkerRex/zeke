import {
  CHAR_NORMALIZATION,
  CONFIDENCE_DEFAULT,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_NORMALIZATION_FACTOR,
} from "./constants";
import type { EmbeddingInput, EmbeddingResult } from "./types";

export async function generateStubEmbedding(
  story: EmbeddingInput,
): Promise<EmbeddingResult> {
  const content = `${story.title || ""} ${story.text}`.toLowerCase();
  const embedding = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);

  for (let i = 0; i < content.length && i < EMBEDDING_DIMENSIONS; i++) {
    const charCode = content.charCodeAt(i);
    embedding[i % EMBEDDING_DIMENSIONS] +=
      (charCode / CHAR_NORMALIZATION - CONFIDENCE_DEFAULT) *
      EMBEDDING_NORMALIZATION_FACTOR;
  }

  const magnitude = Math.sqrt(
    embedding.reduce((sum, value) => sum + value * value, 0),
  );
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return { embedding };
}
