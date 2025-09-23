import OpenAI from "openai";
import {
	DEFAULT_CHAT_MODEL,
	DEFAULT_EMBEDDING_MODEL,
	EMBEDDING_DIMENSIONS,
	MAX_CONTENT_LENGTH_ANALYSIS,
	MAX_CONTENT_LENGTH_EMBEDDING,
} from "./constants";

export type OpenAIClient = {
	openai: OpenAI;
	chatModel: string;
	embeddingModel: string;
	embeddingDimensions: number;
	maxAnalysisLen: number;
	maxEmbeddingLen: number;
};

export function createOpenAIClient(config?: {
	apiKey?: string;
	chatModel?: string;
	embeddingModel?: string;
	embeddingDimensions?: number;
	maxAnalysisLen?: number;
	maxEmbeddingLen?: number;
}): OpenAIClient {
	const apiKey = config?.apiKey ?? process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("OPENAI_API_KEY environment variable is required");
	}

	const openai = new OpenAI({ apiKey });

	return {
		openai,
		chatModel: config?.chatModel ?? DEFAULT_CHAT_MODEL,
		embeddingModel: config?.embeddingModel ?? DEFAULT_EMBEDDING_MODEL,
		embeddingDimensions: config?.embeddingDimensions ?? EMBEDDING_DIMENSIONS,
		maxAnalysisLen: config?.maxAnalysisLen ?? MAX_CONTENT_LENGTH_ANALYSIS,
		maxEmbeddingLen: config?.maxEmbeddingLen ?? MAX_CONTENT_LENGTH_EMBEDDING,
	};
}
