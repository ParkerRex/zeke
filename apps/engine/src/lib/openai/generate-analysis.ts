import { log } from '../../log.js';
import { withRetry } from '../../utils/retry.js';
import { cleanAndParseJSON } from './clean-json-response.js';
import {
  CHILI_DEFAULT,
  CHILI_MAX,
  CHILI_MIN,
  CONFIDENCE_DEFAULT,
  CONFIDENCE_MAX,
  CONFIDENCE_MIN,
} from './constants.js';
import type { OpenAIClient } from './openai-client.js';
import type { AnalysisInput, AnalysisResult } from './types.js';

export async function generateAnalysis(
  client: OpenAIClient,
  story: AnalysisInput
): Promise<AnalysisResult> {
  const domain = story.canonical_url
    ? new URL(story.canonical_url).hostname
    : 'unknown';
  const truncatedText =
    story.text.length > client.maxAnalysisLen
      ? `${story.text.substring(0, client.maxAnalysisLen)}...[truncated]`
      : story.text;

  const prompt = `Analyze this news article and provide insights in JSON format.

Title: ${story.title || 'No title'}
Source: ${domain}
Content: ${truncatedText}

Please respond with a JSON object containing:
1. "why_it_matters": A 2-3 bullet point explanation of why this story is significant (use • bullet points)
2. "chili": A score from 0-5 indicating how "hot" or important this story is (0=boring, 5=major breakthrough)
3. "confidence": A score from 0-1 indicating your confidence in the analysis (0=low confidence, 1=high confidence)

Consider factors like:
- Technological significance and innovation
- Potential impact on industry or society
- Source reliability (${domain})
- Timeliness and relevance
- Depth and quality of reporting

Respond only with valid JSON, no other text.`;

  try {
    const completion = await withRetry(
      () =>
        client.openai.chat.completions.create({
          model: client.chatModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      { maxRetries: 3 }
    );

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    type LLMAnalysisJSON = {
      why_it_matters?: unknown;
      chili?: unknown;
      confidence?: unknown;
      citations?: unknown;
    };

    const raw = cleanAndParseJSON(responseText) as LLMAnalysisJSON;

    const toNumber = (v: unknown): number | null => {
      if (typeof v === 'number') {
        return v;
      }
      if (typeof v === 'string') {
        return Number(v);
      }
      return null;
    };
    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, n));

    const why =
      typeof raw.why_it_matters === 'string' && raw.why_it_matters.trim()
        ? raw.why_it_matters
        : '• Analysis not available';

    const chiliVal = clamp(
      Math.round(toNumber(raw.chili) ?? CHILI_DEFAULT),
      CHILI_MIN,
      CHILI_MAX
    );

    const confidenceVal = clamp(
      toNumber(raw.confidence) ?? CONFIDENCE_DEFAULT,
      CONFIDENCE_MIN,
      CONFIDENCE_MAX
    );

    const citationsVal =
      typeof raw.citations === 'object' &&
      raw.citations !== null &&
      !Array.isArray(raw.citations)
        ? (raw.citations as Record<string, unknown>)
        : {};

    return {
      why_it_matters: String(why),
      chili: chiliVal,
      confidence: confidenceVal,
      citations: citationsVal,
    };
  } catch (error) {
    log(
      'openai_analysis_error',
      { comp: 'analyze', error: String(error), story_title: story.title },
      'error'
    );
    throw error;
  }
}
