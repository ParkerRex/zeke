import { createOpenAI } from '@ai-sdk/openai';
import { keys } from '../keys';

const openai = createOpenAI({
  apiKey: keys().OPENAI_API_KEY,
});

// Use type assertion to work around TypeScript monorepo type inference issues
export const chatModel = openai('gpt-4o-mini') as any;
export const embeddingModel = openai.embedding('text-embedding-3-small') as any;

// Legacy export for backward compatibility
export const models = {
  chat: chatModel,
  embeddings: embeddingModel,
} as any;
