import { tasks } from "@trigger.dev/sdk";
import { createClient } from "@zeke/db/client";
import {
  highlightTags,
  highlights,
  sources,
  stories,
  storyOverlays,
  teamStoryStates,
} from "@zeke/db/schema";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import type { GetHighlightsInput } from "./schema";
import type { HighlightDetail, HighlightToolData, ToolResult } from "./types";

type RawHighlightRow = {
  id: string;
  title: string | null;
  summary: string | null;
  quote: string | null;
  kind: string | null;
  confidence: string | null;
  created_at: string | null;
  story_id: string;
  story_title: string | null;
  story_published_at: string | null;
  source_name: string | null;
  overlay_confidence: string | null;
  time_saved_seconds: number | null;
};

type HighlightToolResult = ToolResult<HighlightToolData, "getHighlights">;

function calculateSinceIso(
  timeframe: NonNullable<GetHighlightsInput["timeframe"]>,
): string | null {
  if (timeframe === "all") {
    return null;
  }

  const durationDays: Record<"day" | "week" | "month", number> = {
    day: 1,
    week: 7,
    month: 30,
  };

  const days = durationDays[timeframe];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return since.toISOString();
}

function buildStats(highlights: HighlightDetail[]) {
  const byKind = highlights.reduce<Record<string, number>>((acc, highlight) => {
    const key = highlight.kind ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const confidenceValues = highlights
    .map((highlight) => highlight.confidence)
    .filter((value): value is number => value != null);

  const averageConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, value) => sum + value, 0) /
        confidenceValues.length
      : 0;

  const tagCounts = new Map<string, number>();
  for (const highlight of highlights) {
    for (const tag of highlight.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    total: highlights.length,
    byKind,
    averageConfidence,
    topTags,
  };
}

export async function getHighlights(
  input: GetHighlightsInput,
  context: { teamId: string; userId: string },
): Promise<HighlightToolResult> {
  try {
    const db = createClient();
    const {
      timeframe = "week",
      tags = [],
      limit = 10,
      refresh,
      storyId,
    } = input;

    if (refresh && storyId) {
      try {
        await tasks.trigger("extract-highlights", {
          storyId,
          userId: context.userId,
          teamId: context.teamId,
        });
      } catch (jobError) {
        console.error("Failed to trigger highlight refresh job", jobError);
      }
    } else if (refresh) {
      console.warn("Highlight refresh requested without a storyId");
    }

    const sinceIso = calculateSinceIso(timeframe);

    const conditions = [eq(teamStoryStates.team_id, context.teamId)];

    if (storyId) {
      conditions.push(eq(highlights.story_id, storyId));
    }

    if (sinceIso) {
      conditions.push(gte(highlights.created_at, sinceIso));
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const rows: RawHighlightRow[] = await db
      .select({
        id: highlights.id,
        title: highlights.title,
        summary: highlights.summary,
        quote: highlights.quote,
        kind: highlights.kind,
        confidence: highlights.confidence,
        created_at: highlights.created_at,
        story_id: highlights.story_id,
        story_title: stories.title,
        story_published_at: stories.published_at,
        source_name: sources.name,
        overlay_confidence: storyOverlays.confidence,
        time_saved_seconds: storyOverlays.time_saved_seconds,
      })
      .from(highlights)
      .innerJoin(stories, eq(highlights.story_id, stories.id))
      .innerJoin(teamStoryStates, eq(teamStoryStates.story_id, stories.id))
      .leftJoin(storyOverlays, eq(storyOverlays.story_id, stories.id))
      .leftJoin(sources, eq(sources.id, stories.primary_source_id))
      .where(whereClause)
      .orderBy(desc(highlights.created_at))
      .limit(limit);

    const highlightIds = rows.map((row) => row.id);

    const tagRows = highlightIds.length
      ? await db
          .select({
            highlight_id: highlightTags.highlight_id,
            tag: highlightTags.tag,
          })
          .from(highlightTags)
          .where(inArray(highlightTags.highlight_id, highlightIds))
      : [];

    const tagMap = tagRows.reduce<Map<string, string[]>>((acc, row) => {
      const existing = acc.get(row.highlight_id) ?? [];
      existing.push(row.tag);
      acc.set(row.highlight_id, existing);
      return acc;
    }, new Map());

    const filteredRows = rows.filter((row) => {
      if (tags.length === 0) {
        return true;
      }

      const highlightTagsForRow = tagMap.get(row.id) ?? [];
      return tags.every((tag) => highlightTagsForRow.includes(tag));
    });

    const slicedRows = filteredRows.slice(0, limit);

    const formattedHighlights: HighlightDetail[] = slicedRows.map((row) => {
      const highlightConfidence = row.confidence
        ? Number(row.confidence)
        : null;
      const overlayConfidence = row.overlay_confidence
        ? Number(row.overlay_confidence)
        : null;

      return {
        id: row.id,
        title:
          row.title ??
          row.summary?.slice(0, 60) ??
          row.id.slice(0, 8).toUpperCase(),
        summary: row.summary,
        quote: row.quote,
        kind: row.kind,
        confidence: highlightConfidence,
        story: {
          id: row.story_id,
          title: row.story_title,
          sourceName: row.source_name,
          publishedAt: row.story_published_at,
        },
        tags: tagMap.get(row.id) ?? [],
        createdAt: row.created_at,
        metrics: {
          confidence: highlightConfidence ?? overlayConfidence ?? null,
          timeSavedSeconds: row.time_saved_seconds ?? null,
        },
      };
    });

    const stats = buildStats(formattedHighlights);

    const data: HighlightToolData = {
      highlights: formattedHighlights,
      stats,
      timeframe,
      filters: {
        tags,
        ...(storyId ? { storyId } : {}),
      },
    };

    return {
      success: true,
      data,
      metadata: {
        toolName: "getHighlights",
        executionTime: Date.now(),
      },
    };
  } catch (error) {
    console.error("Error in getHighlights:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve story highlights",
      metadata: {
        toolName: "getHighlights",
        executionTime: Date.now(),
      },
    };
  }
}
