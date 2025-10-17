import type { Database } from "@db/client";
import {
  contents,
  stories,
  storyClusters,
  type storyKind,
  storyOverlays,
} from "@db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { type StoryMetricsRow, getStoryMetrics } from "./story-analytics";

export type StoryKind = (typeof storyKind.enumValues)[number];

export type StoryClusterOverlay = {
  whyItMatters: string | null;
  confidence: number | null;
  citations: Record<string, unknown> | null;
  analysisState: string | null;
  analyzedAt: string | null;
};

export type StoryClusterTranscript = {
  url: string | null;
  vtt: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
};

export type StoryClusterStory = {
  id: string;
  clusterId: string | null;
  contentId: string;
  title: string | null;
  summary: string | null;
  kind: StoryKind;
  primaryUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  overlay: StoryClusterOverlay | null;
  transcript: StoryClusterTranscript | null;
};

export type StoryClusterRecord = {
  id: string;
  clusterKey: string;
  label: string | null;
  metrics: Record<string, unknown> | null;
  primaryStoryId: string | null;
  stories: StoryClusterStory[];
};

export type StoryClusterDashboardPayload = {
  cluster: StoryClusterRecord;
  metricsByStory: Record<string, StoryMetricsRow>;
};

export type StoryDetailForApplyPayload = {
  story: StoryClusterStory;
  cluster: StoryClusterRecord;
  metrics: StoryMetricsRow | null;
};

const STORIES_LIMIT_DEFAULT = 50;

type StoryRow = {
  id: string;
  clusterId: string | null;
  contentId: string;
  title: string | null;
  summary: string | null;
  kind: StoryKind;
  primaryUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  overlayWhy: string | null;
  overlayConfidence: string | null;
  overlayCitations: unknown;
  overlayState: string | null;
  overlayAnalyzedAt: string | null;
  transcriptUrl: string | null;
  transcriptVtt: string | null;
  transcriptDuration: number | null;
  transcriptViewCount: number | null;
};

function mapStory(row: StoryRow): StoryClusterStory {
  const confidence = row.overlayConfidence
    ? Number.parseFloat(row.overlayConfidence)
    : null;

  const overlay: StoryClusterOverlay | null =
    row.overlayWhy ||
    row.overlayConfidence ||
    row.overlayCitations ||
    row.overlayState
      ? {
          whyItMatters: row.overlayWhy,
          confidence,
          citations: (row.overlayCitations ?? null) as Record<
            string,
            unknown
          > | null,
          analysisState: row.overlayState,
          analyzedAt: row.overlayAnalyzedAt,
        }
      : null;

  const hasTranscript =
    row.transcriptUrl !== null ||
    row.transcriptVtt !== null ||
    row.transcriptDuration !== null ||
    row.transcriptViewCount !== null;

  const transcript: StoryClusterTranscript | null = hasTranscript
    ? {
        url: row.transcriptUrl,
        vtt: row.transcriptVtt,
        durationSeconds: row.transcriptDuration,
        viewCount: row.transcriptViewCount,
      }
    : null;

  return {
    id: row.id,
    clusterId: row.clusterId,
    contentId: row.contentId,
    title: row.title,
    summary: row.summary,
    kind: row.kind,
    primaryUrl: row.primaryUrl,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    overlay,
    transcript,
  } satisfies StoryClusterStory;
}

async function fetchStoryRows(
  db: Database,
  filter: SQL | null | undefined,
  options: { limit?: number; offset?: number } = {},
): Promise<StoryRow[]> {
  const { limit, offset } = options;

  let queryBuilder = db
    .select({
      id: stories.id,
      clusterId: stories.cluster_id,
      contentId: stories.content_id,
      title: stories.title,
      summary: stories.summary,
      kind: stories.kind,
      primaryUrl: stories.primary_url,
      publishedAt: stories.published_at,
      createdAt: stories.created_at,
      overlayWhy: storyOverlays.why_it_matters,
      overlayConfidence: storyOverlays.confidence,
      overlayCitations: storyOverlays.citations,
      overlayState: storyOverlays.analysis_state,
      overlayAnalyzedAt: storyOverlays.analyzed_at,
      transcriptUrl: contents.transcript_url,
      transcriptVtt: contents.transcript_vtt,
      transcriptDuration: contents.duration_seconds,
      transcriptViewCount: contents.view_count,
    })
    .from(stories)
    .innerJoin(contents, eq(contents.id, stories.content_id))
    .leftJoin(storyOverlays, eq(storyOverlays.story_id, stories.id))
    .$dynamic();

  if (filter) {
    queryBuilder = queryBuilder.where(filter);
  }

  queryBuilder = queryBuilder.orderBy(
    desc(stories.published_at),
    desc(stories.created_at),
    stories.id,
  );

  if (typeof limit === "number") {
    queryBuilder = queryBuilder.limit(limit);
  }

  if (typeof offset === "number" && offset > 0) {
    queryBuilder = queryBuilder.offset(offset);
  }

  return queryBuilder as unknown as Promise<StoryRow[]>;
}

function buildFilters(
  params: Partial<{
    kind: StoryKind | "all";
    storyIds: string[];
    clusterId: string;
    search: string | null;
  }> = {},
): SQL | null | undefined {
  const conditions: SQL[] = [];

  if (params.clusterId) {
    conditions.push(eq(stories.cluster_id, params.clusterId));
  }

  if (params.storyIds?.length) {
    conditions.push(inArray(stories.id, params.storyIds));
  }

  if (params.kind && params.kind !== "all") {
    conditions.push(eq(stories.kind, params.kind));
  }

  if (params.search?.trim()) {
    const term = params.search.trim();
    conditions.push(
      sql`(${stories.title} ILIKE '%' || ${term} || '%' OR ${stories.primary_url} ILIKE '%' || ${term} || '%')`,
    );
  }

  if (conditions.length === 0) {
    return null;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}

/**
 * Retrieve a story cluster with all associated stories, overlays, and transcripts.
 */
export async function getStoryClusterById(
  db: Database,
  clusterId: string,
): Promise<StoryClusterRecord | null> {
  const [cluster] = await db
    .select({
      id: storyClusters.id,
      clusterKey: storyClusters.cluster_key,
      label: storyClusters.label,
      metrics: storyClusters.metrics,
      primaryStoryId: storyClusters.primary_story_id,
    })
    .from(storyClusters)
    .where(eq(storyClusters.id, clusterId))
    .limit(1);

  if (!cluster) {
    return null;
  }

  const rows = await fetchStoryRows(db, buildFilters({ clusterId }));

  return {
    id: cluster.id,
    clusterKey: cluster.clusterKey,
    label: cluster.label,
    metrics: (cluster.metrics ?? null) as Record<string, unknown> | null,
    primaryStoryId: cluster.primaryStoryId,
    stories: rows.map(mapStory),
  } satisfies StoryClusterRecord;
}

/**
 * Retrieve the cluster for a specific story. If the story is not part of a cluster,
 * a synthetic cluster containing only that story is returned.
 */
export async function getStoryClusterForStory(
  db: Database,
  storyId: string,
): Promise<StoryClusterRecord | null> {
  const [story] = await db
    .select({
      id: stories.id,
      title: stories.title,
      clusterId: stories.cluster_id,
    })
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);

  if (!story) {
    return null;
  }

  if (story.clusterId) {
    return getStoryClusterById(db, story.clusterId);
  }

  const rows = await fetchStoryRows(db, buildFilters({ storyIds: [story.id] }));

  return {
    id: story.id,
    clusterKey: story.id,
    label: story.title,
    metrics: null,
    primaryStoryId: story.id,
    stories: rows.map(mapStory),
  } satisfies StoryClusterRecord;
}

export type ListStoryClustersParams = {
  limit?: number;
  offset?: number;
  kind?: StoryKind | "all";
  search?: string | null;
  storyIds?: string[];
  teamId?: string;
};

export type ListStoryClustersResult = {
  stories: StoryClusterStory[];
  totalCount: number;
  hasMore: boolean;
};

/**
 * List stories with their overlay and transcript metadata, preserving pagination metadata.
 */
export async function listStoriesWithOverlays(
  db: Database,
  params: ListStoryClustersParams = {},
): Promise<ListStoryClustersResult> {
  const {
    limit = STORIES_LIMIT_DEFAULT,
    offset = 0,
    kind = "all",
    search = null,
    storyIds,
  } = params;

  const filter = buildFilters({ kind, search, storyIds });
  const [rows, countRow] = await Promise.all([
    fetchStoryRows(db, filter, { limit, offset }),
    (async () => {
      let countQuery = db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(stories)
        .$dynamic();

      if (filter) {
        countQuery = countQuery.where(filter);
      }

      const [result] = await countQuery;
      return result?.count ?? 0;
    })(),
  ]);

  const totalCount = countRow;
  const hasMore = offset + rows.length < totalCount;

  return {
    stories: rows.map(mapStory),
    totalCount,
    hasMore,
  } satisfies ListStoryClustersResult;
}

/**
 * Retrieve a story cluster plus dashboard metrics for each story.
 */
export async function getStoryClusterForDashboard(
  db: Database,
  params: { clusterId: string; teamId?: string },
): Promise<StoryClusterDashboardPayload | null> {
  const { clusterId, teamId } = params;

  const cluster = await getStoryClusterById(db, clusterId);
  if (!cluster) {
    return null;
  }

  const storyIds = cluster.stories.map((story) => story.id);
  const metricsList = storyIds.length
    ? await getStoryMetrics(db, {
        teamId,
        storyIds,
      })
    : [];

  const metricsByStory = Object.fromEntries(
    metricsList.map((row) => [row.storyId, row] as const),
  );

  return {
    cluster,
    metricsByStory,
  } satisfies StoryClusterDashboardPayload;
}

/**
 * Retrieve a single story with cluster context for the Apply experience.
 */
export async function getStoryDetailForApply(
  db: Database,
  params: { storyId: string; teamId?: string },
): Promise<StoryDetailForApplyPayload | null> {
  const { storyId, teamId } = params;

  const cluster = await getStoryClusterForStory(db, storyId);
  if (!cluster) {
    return null;
  }

  const story = cluster.stories.find((item) => item.id === storyId);
  if (!story) {
    return null;
  }

  const [metrics] = await getStoryMetrics(db, {
    teamId,
    storyIds: [storyId],
  });

  return {
    story,
    cluster,
    metrics: metrics ?? null,
  } satisfies StoryDetailForApplyPayload;
}
