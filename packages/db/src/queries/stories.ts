import type { Database } from "@db/client";
import {
  contents,
  rawItems,
  sourceConnections,
  stories,
  storyEmbeddings,
  storyKind,
  storyOverlays,
  teamStoryStates,
} from "@db/schema";
import { desc, eq, sql } from "drizzle-orm";

export type StoryKindValue = (typeof storyKind.enumValues)[number];

export type InsertStoryParams = {
  content_id: string;
  title?: string | null;
  summary?: string | null;
  primary_url?: string | null;
  kind?: string | null;
  published_at?: Date | string | null;
  primary_source_id?: string | null;
};

export type UpsertStoryOverlayParams = {
  story_id: string;
  why_it_matters?: string | null;
  confidence?: number | null;
  citations?: Record<string, unknown> | null;
  analysis_state?: string | null;
};

export type UpsertStoryEmbeddingParams = {
  story_id: string;
  embedding: number[];
  model_version?: string | null;
};

const DEFAULT_STORY_KIND: StoryKindValue = "article";

function normalizeStoryKind(kind?: string | null): StoryKindValue {
  if (!kind) {
    return DEFAULT_STORY_KIND;
  }

  const maybeKind = kind as StoryKindValue;
  return storyKind.enumValues.includes(maybeKind)
    ? maybeKind
    : DEFAULT_STORY_KIND;
}

export function createStoryQueries(db: Database) {
  return {
    /**
     * Insert a new story record linked to existing content.
     */
    async insertStory(params: InsertStoryParams): Promise<string> {
      const {
        content_id,
        title,
        summary,
        primary_url,
        kind,
        published_at,
        primary_source_id,
      } = params;

      const [row] = await db
        .insert(stories)
        .values({
          content_id,
          title: title ?? undefined,
          summary: summary ?? undefined,
          primary_url: primary_url ?? undefined,
          kind: normalizeStoryKind(kind),
          published_at: published_at
            ? new Date(published_at).toISOString()
            : undefined,
          primary_source_id: primary_source_id ?? undefined,
        })
        .returning({ id: stories.id });

      if (!row) {
        throw new Error("Failed to insert story: no row returned");
      }

      return row.id;
    },

    /**
     * Find story ID by content hash (via join with contents table)
     */
    async findStoryIdByContentHash(hash: string): Promise<string | null> {
      const result = await db
        .select({ id: stories.id })
        .from(stories)
        .innerJoin(contents, eq(contents.id, stories.content_id))
        .where(eq(contents.content_hash, hash))
        .limit(1);

      return result[0]?.id ?? null;
    },

    /**
     * Get story with its content
     */
    async getStoryWithContent(storyId: string) {
      const result = await db
        .select({
          id: stories.id,
          title: stories.title,
          summary: stories.summary,
          primary_url: stories.primary_url,
          content_id: stories.content_id,
          text_body: contents.text_body,
          content_type: contents.content_type,
          content_hash: contents.content_hash,
        })
        .from(stories)
        .innerJoin(contents, eq(contents.id, stories.content_id))
        .where(eq(stories.id, storyId))
        .limit(1);

      return result[0] ?? null;
    },

    /**
     * Upsert overlay metadata captured during analysis.
     */
    async upsertStoryOverlay(params: UpsertStoryOverlayParams): Promise<void> {
      const {
        story_id,
        why_it_matters,
        confidence,
        citations,
        analysis_state,
      } = params;

      await db
        .insert(storyOverlays)
        .values({
          story_id,
          why_it_matters: why_it_matters ?? undefined,
          confidence: confidence != null ? confidence.toString() : undefined,
          citations: citations ?? undefined,
          analysis_state: analysis_state ?? "pending",
          analyzed_at: sql`now()`,
        })
        .onConflictDoUpdate({
          target: storyOverlays.story_id,
          set: {
            why_it_matters: why_it_matters ?? undefined,
            confidence: confidence != null ? confidence.toString() : undefined,
            citations: citations ?? undefined,
            analysis_state: analysis_state ?? undefined,
            analyzed_at: sql`now()`,
          },
        });
    },

    /**
     * Upsert vector embedding metadata for semantic search.
     */
    async upsertStoryEmbedding(
      params: UpsertStoryEmbeddingParams,
    ): Promise<void> {
      const { story_id, embedding, model_version } = params;

      await db
        .insert(storyEmbeddings)
        .values({
          story_id,
          embedding: sql`${JSON.stringify(embedding)}::vector`,
          model_version: model_version ?? undefined,
          updated_at: sql`now()`,
        })
        .onConflictDoUpdate({
          target: storyEmbeddings.story_id,
          set: {
            embedding: sql`${JSON.stringify(embedding)}::vector`,
            model_version: model_version ?? undefined,
            updated_at: sql`now()`,
          },
        });
    },

    /**
     * Get recent stories
     */
    async getRecentStories(limit = 10) {
      return await db
        .select()
        .from(stories)
        .orderBy(desc(stories.created_at))
        .limit(limit);
    },

    /**
     * Fetch the analysis overlay for a story if it exists.
     */
    async getStoryOverlay(storyId: string) {
      const [row] = await db
        .select()
        .from(storyOverlays)
        .where(eq(storyOverlays.story_id, storyId))
        .limit(1);

      return row ?? null;
    },

    /**
     * Update a story summary and timestamp.
     */
    async updateStorySummary(storyId: string, summary: string | null) {
      await db
        .update(stories)
        .set({
          summary: summary ?? undefined,
          updated_at: sql`now()`,
        })
        .where(eq(stories.id, storyId));
    },

    /**
     * Attach a story to a primary source.
     */
    async attachPrimarySource(
      storyId: string,
      sourceId: string,
    ): Promise<void> {
      await db
        .update(stories)
        .set({
          primary_source_id: sourceId,
          updated_at: sql`now()`,
        })
        .where(eq(stories.id, storyId));
    },

    /**
     * Resolve team IDs connected to the story via source connections.
     */
    async getTeamsForStory(storyId: string): Promise<string[]> {
      const rows = await db
        .select({ teamId: sourceConnections.team_id })
        .from(stories)
        .innerJoin(contents, eq(contents.id, stories.content_id))
        .innerJoin(rawItems, eq(rawItems.id, contents.raw_item_id))
        .innerJoin(
          sourceConnections,
          eq(sourceConnections.source_id, rawItems.source_id),
        )
        .where(eq(stories.id, storyId))
        .groupBy(sourceConnections.team_id);

      return rows
        .map((row) => row.teamId)
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        );
    },

    /**
     * Upsert the team story state for a given story.
     */
    async upsertTeamStoryState(params: {
      storyId: string;
      teamId: string;
      state: string;
    }): Promise<void> {
      const { storyId, teamId, state } = params;

      await db
        .insert(teamStoryStates)
        .values({
          story_id: storyId,
          team_id: teamId,
          state,
          last_viewed_at: state === "read" ? sql`now()` : undefined,
        })
        .onConflictDoUpdate({
          target: [teamStoryStates.team_id, teamStoryStates.story_id],
          set: {
            state,
            last_viewed_at:
              state === "read"
                ? sql`now()`
                : sql`${teamStoryStates.last_viewed_at}`,
          },
        });
    },
  };
}
