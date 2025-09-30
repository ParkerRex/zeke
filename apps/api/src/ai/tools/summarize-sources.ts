import { createClient } from "@zeke/db/client";
import * as schema from "@zeke/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { ToolResult } from "./research-registry";

const inputSchema = z.object({
  sourceIds: z.array(z.string()).optional(),
  topic: z.string().optional(),
  maxSources: z.number().min(1).max(20).default(5),
  style: z.enum(["brief", "detailed", "executive"]).default("brief"),
});

const summarySchema = z.object({
  mainThemes: z.array(z.string()),
  keyInsights: z.array(
    z.object({
      insight: z.string(),
      confidence: z.number().min(0).max(1),
      sources: z.array(z.string()),
    }),
  ),
  consensus: z.string().optional(),
  conflicts: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});

/**
 * Summarize sources tool - Generates comprehensive summaries from multiple sources
 */
export async function summarizeSources(
  input: z.infer<typeof inputSchema>,
  context: { teamId: string; userId: string },
): Promise<ToolResult> {
  try {
    const db = createClient();
    const { sourceIds, topic, maxSources, style } = input;

    // Fetch sources based on criteria
    let sources;
    if (sourceIds && sourceIds.length > 0) {
      // Get specific sources
      sources = await db.query.sources.findMany({
        where: and(
          eq(schema.sources.teamId, context.teamId),
          inArray(schema.sources.id, sourceIds),
        ),
        with: {
          stories: {
            with: {
              highlights: true,
              overlays: true,
            },
            limit: 10,
            orderBy: desc(schema.stories.publishedAt),
          },
        },
        limit: maxSources,
      });
    } else if (topic) {
      // Search for sources by topic
      sources = await db.query.stories
        .findMany({
          where: and(
            eq(schema.stories.teamId, context.teamId),
            sql`${schema.stories.title} ILIKE ${"%" + topic + "%"} OR ${schema.stories.summary} ILIKE ${"%" + topic + "%"}`,
          ),
          with: {
            primarySource: true,
            highlights: true,
            overlays: true,
          },
          limit: maxSources,
          orderBy: desc(schema.stories.relevanceScore),
        })
        .then((stories) => {
          // Group by source
          const sourceMap = new Map();
          stories.forEach((story) => {
            if (story.primarySource) {
              if (!sourceMap.has(story.primarySource.id)) {
                sourceMap.set(story.primarySource.id, {
                  ...story.primarySource,
                  stories: [],
                });
              }
              sourceMap.get(story.primarySource.id).stories.push(story);
            }
          });
          return Array.from(sourceMap.values());
        });
    } else {
      // Get recent high-value sources
      sources = await db.query.sources.findMany({
        where: eq(schema.sources.teamId, context.teamId),
        with: {
          stories: {
            with: {
              highlights: true,
              overlays: true,
            },
            limit: 5,
            orderBy: desc(schema.stories.relevanceScore),
          },
        },
        limit: maxSources,
        orderBy: desc(schema.sources.createdAt),
      });
    }

    if (sources.length === 0) {
      return {
        success: false,
        error: "No sources found matching criteria",
        metadata: {
          toolName: "summarizeSources",
          executionTime: Date.now(),
        },
      };
    }

    // Prepare content for summarization
    const sourceContent = sources.map((source) => ({
      sourceName: source.name || "Unknown Source",
      sourceId: source.id,
      stories: source.stories.map((story) => ({
        title: story.title,
        summary: story.summary,
        highlights: story.highlights.map((h) => h.summary).filter(Boolean),
        sentiment: story.overlays?.find((o) => o.kind === "sentiment")
          ?.metadata,
      })),
    }));

    // Generate AI summary based on style
    const systemPrompt =
      style === "brief"
        ? "Create a concise summary focusing on key points and actionable insights."
        : style === "detailed"
          ? "Create a comprehensive analysis with detailed explanations and evidence."
          : "Create an executive summary suitable for leadership, focusing on strategic implications.";

    const { object: summary } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: summarySchema,
      prompt: `${systemPrompt}

Sources to analyze:
${JSON.stringify(sourceContent, null, 2)}

${topic ? `Focus on topic: ${topic}` : ""}

Identify main themes, extract key insights with confidence scores, note any consensus or conflicts between sources, and provide actionable recommendations.`,
    });

    // Calculate metadata
    const totalStories = sources.reduce((acc, s) => acc + s.stories.length, 0);
    const totalHighlights = sources.reduce(
      (acc, s) =>
        acc + s.stories.reduce((a, st) => a + st.highlights.length, 0),
      0,
    );

    return {
      success: true,
      data: {
        summary,
        sources: sources.map((s) => ({
          id: s.id,
          name: s.name,
          storyCount: s.stories.length,
        })),
        metadata: {
          totalSources: sources.length,
          totalStories,
          totalHighlights,
          style,
          topic,
        },
      },
      metadata: {
        toolName: "summarizeSources",
        executionTime: Date.now(),
      },
    };
  } catch (error) {
    console.error("Error in summarizeSources:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to summarize sources",
      metadata: {
        toolName: "summarizeSources",
        executionTime: Date.now(),
      },
    };
  }
}
