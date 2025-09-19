import {
  getStoryWithContent,
  upsertStoryEmbedding,
  upsertStoryOverlay,
} from '../db.js';
import { MODEL_VERSION_LABELS } from '../lib/openai/constants.js';
import { generateAnalysis as oaGenerateAnalysis } from '../lib/openai/generate-analysis.js';
import { generateEmbedding as oaGenerateEmbedding } from '../lib/openai/generate-embedding.js';
import { generateStubAnalysis } from '../lib/openai/generate-stub-analysis.js';
import { generateStubEmbedding } from '../lib/openai/generate-stub-embedding.js';
import { createOpenAIClient } from '../lib/openai/openai-client.js';
import type {
  AnalysisInput,
  AnalysisResult,
  EmbeddingResult,
} from '../lib/openai/types.js';
import { log } from '../log.js';

const USE_OPENAI = !!process.env.OPENAI_API_KEY;

export async function analyzeStory(storyId: string): Promise<void> {
  const story = await getStoryWithContent(storyId);
  if (!story) {
    throw new Error(`Story not found: ${storyId}`);
  }

  log('analyze_story_start', {
    comp: 'analyze',
    story_id: storyId,
    title: story.title,
    text_length: story.text.length,
  });

  try {
    const input: AnalysisInput = {
      title: story.title,
      canonical_url: story.canonical_url,
      text: story.text,
    };

    let analysis: AnalysisResult;
    let embedding: EmbeddingResult;
    if (USE_OPENAI) {
      const client = createOpenAIClient();
      analysis = await oaGenerateAnalysis(client, input).catch(async () => {
        return await generateStubAnalysis(input);
      });
      embedding = await oaGenerateEmbedding(client, input).catch(async () => {
        return await generateStubEmbedding(input);
      });
    } else {
      [analysis, embedding] = await Promise.all([
        generateStubAnalysis(input),
        generateStubEmbedding(input),
      ]);
    }

    await Promise.all([
      upsertStoryOverlay({
        story_id: storyId,
        why_it_matters: analysis.why_it_matters,
        chili: analysis.chili,
        confidence: analysis.confidence,
        citations: analysis.citations,
        model_version: USE_OPENAI ? MODEL_VERSION_LABELS.chat : 'stub-v1',
      }),
      upsertStoryEmbedding({
        story_id: storyId,
        embedding: embedding.embedding,
        model_version: USE_OPENAI ? MODEL_VERSION_LABELS.embedding : 'stub-v1',
      }),
    ]);

    log('analyze_story_success', {
      comp: 'analyze',
      story_id: storyId,
      chili: analysis.chili,
      confidence: analysis.confidence,
      embedding_dim: embedding.embedding.length,
    });
  } catch (error) {
    log(
      'analyze_story_error',
      { comp: 'analyze', story_id: storyId, error: String(error) },
      'error'
    );
    throw error;
  }
}
