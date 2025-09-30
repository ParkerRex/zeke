import { logger } from "@trigger.dev/sdk";
import { withRetry } from "../async/withRetry";
import {
  CHILI_MAX,
  CHILI_MIN,
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
    type LLMAnalysisJSON = {
      why_it_matters: string;
      chili: number;
      confidence: number;
      citations?: Record<string, unknown>;
    };

    const response = await withRetry(
      () =>
        client.openai.responses.parse({
          model: client.chatModel,
          input: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "story_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  why_it_matters: {
                    type: "string",
                    description: "2-3 bullet points explaining why this story matters",
                  },
                  chili: {
                    type: "number",
                    description: "Hotness score from 0-5",
                    minimum: 0,
                    maximum: 5,
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 0-1",
                    minimum: 0,
                    maximum: 1,
                  },
                  citations: {
                    type: "object",
                    description: "Optional citations object",
                    additionalProperties: true,
                  },
                },
                required: ["why_it_matters", "chili", "confidence"],
                additionalProperties: false,
              },
            },
          },
        }),
      { maxRetries: 3 },
    );

    const parsed = response.output_parsed as LLMAnalysisJSON | null;
    if (!parsed) {
      throw new Error("Failed to parse structured output from OpenAI");
    }

    // Structured output is already validated by OpenAI's schema
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    return {
      why_it_matters: parsed.why_it_matters || "• Analysis not available",
      chili: clamp(Math.round(parsed.chili), CHILI_MIN, CHILI_MAX),
      confidence: clamp(parsed.confidence, CONFIDENCE_MIN, CONFIDENCE_MAX),
      citations: parsed.citations || {},
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
