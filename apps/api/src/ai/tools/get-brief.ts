import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { getHighlights } from "./get-highlights";
import { getSummaries } from "./get-summaries";
import type { GetBriefInput } from "./schema";
import type {
  HighlightDetail,
  SummaryToolData,
  ToolResult,
} from "./types";

const briefSchema = z.object({
  title: z.string(),
  executive_summary: z.string(),
  background: z.string(),
  key_findings: z.array(
    z.object({
      finding: z.string(),
      evidence: z.array(z.string()),
      impact: z.enum(["high", "medium", "low"]),
    }),
  ),
  analysis: z.string(),
  recommendations: z
    .array(
      z.object({
        action: z.string(),
        priority: z.enum(["immediate", "short-term", "long-term"]),
        rationale: z.string(),
      }),
    )
    .optional(),
  next_steps: z.array(z.string()),
  appendix: z.object({
    sources_reviewed: z.number(),
    confidence_level: z.number().min(0).max(1),
    limitations: z.array(z.string()).optional(),
  }),
});

type BriefToolData = {
  brief: z.infer<typeof briefSchema>;
  metadata: {
    topic: string;
    audience: string;
    format: string;
    sourcesAnalyzed: number;
    insightsIncluded: number;
    generatedAt: string;
  };
};

type BriefToolResult = ToolResult<BriefToolData, "getBrief">;

function formatHighlightsForPrompt(highlights: HighlightDetail[]) {
  return highlights.slice(0, 10).map((highlight) => ({
    id: highlight.id,
    title: highlight.title,
    summary: highlight.summary,
    kind: highlight.kind,
    confidence: highlight.metrics.confidence,
    tags: highlight.tags,
    story: highlight.story,
  }));
}

function formatSourcesForPrompt(summaryData: SummaryToolData | undefined) {
  if (!summaryData) {
    return [];
  }

  return summaryData.sources.map((source) => ({
    id: source.id,
    name: source.name,
    storyCount: source.storyCount,
  }));
}

export async function getBrief(
  input: GetBriefInput,
  context: { teamId: string; userId: string },
): Promise<BriefToolResult> {
  try {
    const { topic, audience, format, includeRecommendations } = input;

    const [highlightsResult, summaryResult] = await Promise.all([
      getHighlights({ limit: 20, timeframe: "month" }, context),
      getSummaries({ topic, maxSources: 10, style: "detailed" }, context),
    ]);

    if (!highlightsResult.success || !summaryResult.success) {
      return {
        success: false,
        error: "Failed to gather research data",
        metadata: {
          toolName: "getBrief",
          executionTime: Date.now(),
        },
      };
    }

    const highlightData = highlightsResult.data?.highlights ?? [];
    const summaryData = summaryResult.data;

    const promptHighlights = formatHighlightsForPrompt(highlightData);
    const promptSources = formatSourcesForPrompt(summaryData);

    const audienceInstructions = {
      technical:
        "Use technical language, include implementation details, and focus on technical implications.",
      executive:
        "Focus on business impact, strategic implications, and high-level decisions.",
      general:
        "Use accessible language, explain technical concepts simply, and focus on practical outcomes.",
    } as const;

    const formatInstructions = {
      brief: "Create a concise 1-2 page brief with key points.",
      report: "Create a comprehensive report with detailed analysis.",
      presentation:
        "Structure as presentation talking points with clear sections.",
      blog: "Write in an engaging blog post style with narrative flow.",
    } as const;

    const { object: brief } = await generateObject({
      model: openai("gpt-4o"),
      schema: briefSchema,
      prompt: `Create a ${format} about: ${topic}

Audience: ${audience}
${audienceInstructions[audience]}

Format: ${format}
${formatInstructions[format]}

Include Recommendations: ${includeRecommendations}

Highlights:
${JSON.stringify(promptHighlights, null, 2)}

Source Summary Metadata:
${JSON.stringify(summaryData, null, 2)}

Focus on synthesizing the research into an actionable brief that reflects the highlights and summary context provided.`,
    });

    const data: BriefToolData = {
      brief,
      metadata: {
        topic,
        audience,
        format,
        sourcesAnalyzed: summaryData?.metadata.totalSources ?? 0,
        insightsIncluded: highlightData.length,
        generatedAt: new Date().toISOString(),
      },
    };

    return {
      success: true,
      data,
      metadata: {
        toolName: "getBrief",
        executionTime: Date.now(),
      },
    };
  } catch (error) {
    console.error("Error in getBrief:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to draft brief",
      metadata: {
        toolName: "getBrief",
        executionTime: Date.now(),
      },
    };
  }
}
