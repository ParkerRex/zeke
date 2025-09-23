import { logger } from "@trigger.dev/sdk";
import { withRetry } from "../async/withRetry";
import { cleanAndParseJSON } from "./cleanJsonResponse";
import {
  CHILI_DEFAULT,
  CHILI_MAX,
  CHILI_MIN,
  CONFIDENCE_DEFAULT,
  CONFIDENCE_MAX,
  CONFIDENCE_MIN,
} from "./constants";
import type { OpenAIClient } from "./openaiClient";
import type { AnalysisInput, AnalysisResult } from "./types";

export async function generateAnalysis(
  client: OpenAIClient,
  story: AnalysisInput,
): Promise<AnalysisResult> {
  const domain = story.canonical_url
    ? safeHostname(story.canonical_url)
    : "unknown";
  const truncatedText =
    story.text.length > client.maxAnalysisLen
      ? `${story.text.substring(0, client.maxAnalysisLen)}...[truncated]`
      : story.text;

  const prompt = `Analyze this news article and provide insights in JSON format.

Title: ${story.title || "No title"}
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
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      { maxRetries: 3 },
    );

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error("Empty response from OpenAI");
    }

    type LLMAnalysisJSON = {
      why_it_matters?: unknown;
      chili?: unknown;
      confidence?: unknown;
      citations?: unknown;
    };

    const parsed = cleanAndParseJSON(responseText) as LLMAnalysisJSON;

    const toNumber = (value: unknown): number | null => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      }
      return null;
    };

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    const why =
      typeof parsed.why_it_matters === "string" && parsed.why_it_matters.trim()
        ? parsed.why_it_matters
        : "• Analysis not available";

    const chiliVal = clamp(
      Math.round(toNumber(parsed.chili) ?? CHILI_DEFAULT),
      CHILI_MIN,
      CHILI_MAX,
    );
    const confidenceVal = clamp(
      toNumber(parsed.confidence) ?? CONFIDENCE_DEFAULT,
      CONFIDENCE_MIN,
      CONFIDENCE_MAX,
    );

    const citationsVal =
      typeof parsed.citations === "object" &&
      parsed.citations !== null &&
      !Array.isArray(parsed.citations)
        ? (parsed.citations as Record<string, unknown>)
        : {};

    return {
      why_it_matters: String(why),
      chili: chiliVal,
      confidence: confidenceVal,
      citations: citationsVal,
    };
  } catch (error) {
    logger.error("openai_analysis_error", {
      error,
      storyTitle: story.title,
    });
    throw error;
  }
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}
