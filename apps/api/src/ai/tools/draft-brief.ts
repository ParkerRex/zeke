import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { ToolResult } from "./research-registry";
import { getStoryHighlights } from "./get-story-highlights";
import { summarizeSources } from "./summarize-sources";

const inputSchema = z.object({
  topic: z.string(),
  audience: z.enum(["technical", "executive", "general"]).default("general"),
  format: z.enum(["brief", "report", "presentation", "blog"]).default("brief"),
  includeRecommendations: z.boolean().default(true),
});

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

/**
 * Draft brief tool - Creates research briefs based on collected insights
 */
export async function draftBrief(
  input: z.infer<typeof inputSchema>,
  context: { teamId: string; userId: string },
): Promise<ToolResult> {
  try {
    const { topic, audience, format, includeRecommendations } = input;

    // Gather relevant data
    const [highlightsResult, summaryResult] = await Promise.all([
      getStoryHighlights({ limit: 20, timeframe: "month" }, context),
      summarizeSources({ topic, maxSources: 10, style: "detailed" }, context),
    ]);

    if (!highlightsResult.success || !summaryResult.success) {
      return {
        success: false,
        error: "Failed to gather research data",
        metadata: {
          toolName: "draftBrief",
          executionTime: Date.now(),
        },
      };
    }

    // Generate the brief
    const audienceInstructions = {
      technical:
        "Use technical language, include implementation details, and focus on technical implications.",
      executive:
        "Focus on business impact, strategic implications, and high-level decisions.",
      general:
        "Use accessible language, explain technical concepts simply, and focus on practical outcomes.",
    };

    const formatInstructions = {
      brief: "Create a concise 1-2 page brief with key points.",
      report: "Create a comprehensive report with detailed analysis.",
      presentation:
        "Structure as presentation talking points with clear sections.",
      blog: "Write in an engaging blog post style with narrative flow.",
    };

    const { object: brief } = await generateObject({
      model: openai("gpt-4o"),
      schema: briefSchema,
      prompt: `Create a ${format} about: ${topic}

Audience: ${audience}
${audienceInstructions[audience]}

Format: ${format}
${formatInstructions[format]}

Include Recommendations: ${includeRecommendations}

Research Data:
Highlights: ${JSON.stringify(highlightsResult.data, null, 2)}
Summary: ${JSON.stringify(summaryResult.data, null, 2)}

Generate a comprehensive brief that synthesizes this research into actionable insights.`,
    });

    return {
      success: true,
      data: {
        brief,
        metadata: {
          topic,
          audience,
          format,
          sourcesAnalyzed: summaryResult.data?.metadata?.totalSources || 0,
          insightsIncluded: highlightsResult.data?.highlights?.length || 0,
          generatedAt: new Date().toISOString(),
        },
      },
      metadata: {
        toolName: "draftBrief",
        executionTime: Date.now(),
      },
    };
  } catch (error) {
    console.error("Error in draftBrief:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to draft brief",
      metadata: {
        toolName: "draftBrief",
        executionTime: Date.now(),
      },
    };
  }
}
