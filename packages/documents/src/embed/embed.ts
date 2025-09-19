import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const EMBEDDING_MODEL_NAME = "text-embedding-3-small";
const embeddingModel = openai.embedding(EMBEDDING_MODEL_NAME);

export class Embed {
  public async embedMany(content: string[]): Promise<{
    embeddings: number[][];
    model: string;
  }> {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: content,
    });

    return {
      embeddings,
      model: EMBEDDING_MODEL_NAME,
    };
  }

  public async embed(content: string): Promise<{
    embedding: number[];
    model: string;
  }> {
    const { embedding } = await embed({
      model: embeddingModel,
      value: content,
    });

    return {
      embedding,
      model: EMBEDDING_MODEL_NAME,
    };
  }
}
