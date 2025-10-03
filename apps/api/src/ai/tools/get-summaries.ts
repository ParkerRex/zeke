import { openai } from "@ai-sdk/openai";
import { createClient } from "@zeke/db/client";
import {
  highlights,
  sources,
  stories,
  storyOverlays,
  teamStoryStates,
} from "@zeke/db/schema";
import { generateObject } from "ai";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { GetSummariesInput } from "./schema";
import type { SummaryToolData, ToolResult } from "./types";

type RawStoryRow = {
  story_id: string;
  story_title: string | null;
  story_summary: string | null;
  story_published_at: string | null;
  primary_source_id: string | null;
  primary_url: string | null;
  overlay_summary: string | null;
  overlay_confidence: string | null;
  source_name: string | null;
};

type RawHighlightRow = {
  story_id: string;
  summary: string | null;
  title: string | null;
  confidence: string | null;
};

type SourceStory = {
  id: string;
  title: string | null;
  summary: string | null;
  publishedAt: string | null;
  primaryUrl: string | null;
  whyItMatters: string | null;
  overlayConfidence: number | null;
  highlights: Array<{
    title: string | null;
    summary: string | null;
    confidence: number | null;
  }>;
};

type SourceAggregation = {
  id: string | null;
  name: string | null;
  stories: SourceStory[];
};

type SummariesToolResult = ToolResult<SummaryToolData, "getSummaries">;

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

function mapHighlightRows(rows: RawHighlightRow[]) {
  return rows.reduce<Map<string, SourceStory["highlights"]>>((acc, row) => {
    const list = acc.get(row.story_id) ?? [];
    list.push({
      title: row.title,
      summary: row.summary,
      confidence: row.confidence != null ? Number(row.confidence) : null,
    });
    acc.set(row.story_id, list);
    return acc;
  }, new Map());
}

function groupStoriesBySource(
  rows: RawStoryRow[],
  highlightMap: Map<string, SourceStory["highlights"]>,
) {
  const grouped = new Map<string, SourceAggregation>();

  for (const row of rows) {
    const key = row.primary_source_id ?? row.source_name ?? "__unattributed";
    const existing = grouped.get(key) ?? {
      id: row.primary_source_id,
      name: row.source_name,
      stories: [],
    };

    existing.stories.push({
      id: row.story_id,
      title: row.story_title,
      summary: row.story_summary,
      publishedAt: row.story_published_at,
      primaryUrl: row.primary_url,
      whyItMatters: row.overlay_summary,
      overlayConfidence:
        row.overlay_confidence != null ? Number(row.overlay_confidence) : null,
      highlights: highlightMap.get(row.story_id) ?? [],
    });

    grouped.set(key, existing);
  }

  return Array.from(grouped.values());
}

function buildSourceContent(sources: SourceAggregation[]) {
  return sources.map((source) => ({
    sourceId: source.id,
    sourceName: source.name ?? "Unattributed Source",
    stories: source.stories.map((story) => ({
      id: story.id,
      title: story.title,
      summary: story.summary,
      publishedAt: story.publishedAt,
      primaryUrl: story.primaryUrl,
      whyItMatters: story.whyItMatters,
      highlights: story.highlights
        .map((highlight) => highlight.summary ?? highlight.title)
        .filter((value): value is string => Boolean(value)),
    })),
  }));
}

export async function getSummaries(
  input: GetSummariesInput,
  context: { teamId: string; userId: string },
): Promise<SummariesToolResult> {
  try {
    const db = createClient();
    const { sourceIds = [], topic, maxSources, style } = input;

    const conditions = [eq(teamStoryStates.team_id, context.teamId)];

    if (sourceIds.length > 0) {
      conditions.push(inArray(stories.primary_source_id, sourceIds));
    }

    if (topic) {
      const like = `%${topic}%`;
      conditions.push(
        sql`${stories.title} ILIKE ${like} OR ${stories.summary} ILIKE ${like}`,
      );
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const storyRows: RawStoryRow[] = await db
      .select({
        story_id: stories.id,
        story_title: stories.title,
        story_summary: stories.summary,
        story_published_at: stories.published_at,
        primary_source_id: stories.primary_source_id,
        primary_url: stories.primary_url,
        overlay_summary: storyOverlays.why_it_matters,
        overlay_confidence: storyOverlays.confidence,
        source_name: sources.name,
      })
      .from(stories)
      .innerJoin(teamStoryStates, eq(teamStoryStates.story_id, stories.id))
      .leftJoin(storyOverlays, eq(storyOverlays.story_id, stories.id))
      .leftJoin(sources, eq(sources.id, stories.primary_source_id))
      .where(whereClause)
      .orderBy(desc(stories.published_at))
      .limit(maxSources * 6);

    if (storyRows.length === 0) {
      return {
        success: false,
        error: "No stories found that match the current filters",
        metadata: {
          toolName: "getSummaries",
          executionTime: Date.now(),
        },
      };
    }

    const storyIds = storyRows.map((row) => row.story_id);

    const highlightRows: RawHighlightRow[] = storyIds.length
      ? await db
          .select({
            story_id: highlights.story_id,
            summary: highlights.summary,
            title: highlights.title,
            confidence: highlights.confidence,
          })
          .from(highlights)
          .where(inArray(highlights.story_id, storyIds))
      : [];

    const highlightMap = mapHighlightRows(highlightRows);

    const groupedSources = groupStoriesBySource(storyRows, highlightMap)
      .sort((a, b) => b.stories.length - a.stories.length)
      .slice(0, maxSources);

    if (groupedSources.length === 0) {
      return {
        success: false,
        error: "Unable to assemble source summaries for the selected filters",
        metadata: {
          toolName: "getSummaries",
          executionTime: Date.now(),
        },
      };
    }

    const sourceContent = buildSourceContent(groupedSources);

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

    const totalStories = groupedSources.reduce(
      (acc, source) => acc + source.stories.length,
      0,
    );

    const totalHighlights = groupedSources.reduce((acc, source) => {
      return (
        acc +
        source.stories.reduce(
          (storyAcc, story) => storyAcc + story.highlights.length,
          0,
        )
      );
    }, 0);

    const data: SummaryToolData = {
      summary,
      sources: groupedSources.map((source) => ({
        id: source.id,
        name: source.name,
        storyCount: source.stories.length,
      })),
      metadata: {
        totalSources: groupedSources.length,
        totalStories,
        totalHighlights,
        style,
        topic,
      },
    };

    return {
      success: true,
      data,
      metadata: {
        toolName: "getSummaries",
        executionTime: Date.now(),
      },
    };
  } catch (error) {
    console.error("Error in getSummaries:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to summarize sources",
      metadata: {
        toolName: "getSummaries",
        executionTime: Date.now(),
      },
    };
  }
}
