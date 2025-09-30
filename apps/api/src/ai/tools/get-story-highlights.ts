import { createClient } from "@zeke/db/client";
import * as schema from "@zeke/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import type { ToolResult } from "./research-registry";

const inputSchema = z.object({
  timeframe: z.enum(["day", "week", "month", "all"]).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(10),
});

/**
 * Get story highlights tool - Retrieves trending stories and insights
 */
export async function getStoryHighlights(
  input: z.infer<typeof inputSchema>,
  context: { teamId: string; userId: string },
): Promise<ToolResult> {
  try {
    const db = createClient();
    const { timeframe = "week", tags, limit } = input;

    // Calculate date filter
    const timeframeMap = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      all: Number.MAX_SAFE_INTEGER,
    };

    const since =
      timeframe === "all"
        ? new Date(0)
        : new Date(Date.now() - timeframeMap[timeframe]);

    // Fetch highlights
    const highlights = await db.query.highlights.findMany({
      where: and(
        eq(schema.highlights.team_id, context.teamId),
        gte(schema.highlights.created_at, since),
      ),
      with: {
        story: {
          with: {
            overlays: true,
            primarySource: true,
          },
        },
        tags: tags
          ? {
              where: (highlightTags, { inArray }) =>
                inArray(highlightTags.tag, tags),
            }
          : true,
      },
      orderBy: [
        desc(schema.highlights.confidence),
        desc(schema.highlights.created_at),
      ],
      limit,
    });

    // Process and format highlights
    const formattedHighlights = highlights.map((h) => ({
      id: h.id,
      title: h.title || h.summary?.substring(0, 50) || "Untitled",
      summary: h.summary,
      quote: h.quote,
      kind: h.kind,
      confidence: h.confidence,
      story: {
        id: h.story?.id,
        title: h.story?.title,
        source: h.story?.primarySource?.name,
        publishedAt: h.story?.publishedAt,
      },
      tags: h.tags?.map((t) => t.tag) || [],
      createdAt: h.created_at,
      metrics: {
        chiliScore:
          h.story?.overlays?.find((o) => o.kind === "sentiment")?.metadata
            ?.chiliScore || 0,
        relevance: h.confidence,
      },
    }));

    // Calculate summary statistics
    const stats = {
      total: formattedHighlights.length,
      byKind: {
        insight: formattedHighlights.filter((h) => h.kind === "insight").length,
        quote: formattedHighlights.filter((h) => h.kind === "quote").length,
        action: formattedHighlights.filter((h) => h.kind === "action").length,
        question: formattedHighlights.filter((h) => h.kind === "question")
          .length,
      },
      averageConfidence:
        formattedHighlights.reduce((acc, h) => acc + h.confidence, 0) /
          formattedHighlights.length || 0,
      topTags: Array.from(
        formattedHighlights.reduce((acc, h) => {
          h.tags.forEach((tag) => {
            acc.set(tag, (acc.get(tag) || 0) + 1);
          });
          return acc;
        }, new Map<string, number>()),
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
    };

    return {
      success: true,
      data: {
        highlights: formattedHighlights,
        stats,
        timeframe,
        filters: {
          tags: tags || [],
        },
      },
      metadata: {
        toolName: "getStoryHighlights",
        executionTime: Date.now(),
      },
    };
  } catch (error) {
    console.error("Error in getStoryHighlights:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve story highlights",
      metadata: {
        toolName: "getStoryHighlights",
        executionTime: Date.now(),
      },
    };
  }
}
