import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const EMBEDDING_MODEL_NAME = "text-embedding-3-small";
const embeddingModel = openai.embedding(EMBEDDING_MODEL_NAME);

/**
 * Generate a single embedding for a category name
 */
export async function generateCategoryEmbedding(categoryName: string) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: categoryName,
  });

  return {
    embedding,
    model: EMBEDDING_MODEL_NAME,
  };
}

/**
 * Generate embeddings for multiple category names
 */
export async function generateCategoryEmbeddings(categoryNames: string[]) {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: categoryNames,
  });

  return {
    embeddings,
    model: EMBEDDING_MODEL_NAME,
  };
}

/**
 * Category Embedding Service
 * Provides a consistent interface for generating category embeddings
 */
export class CategoryEmbeddings {
  /**
   * Generate embedding for a single category
   */
  public async embed(categoryName: string) {
    return generateCategoryEmbedding(categoryName);
  }

  /**
   * Generate embeddings for multiple categories
   */
  public async embedMany(categoryNames: string[]) {
    return generateCategoryEmbeddings(categoryNames);
  }
}
