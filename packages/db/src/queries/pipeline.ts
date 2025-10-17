import type { Database } from "@db/client";
import { contents, rawItems, stories } from "@db/schema";
import { desc, sql } from "drizzle-orm";

export type PipelineCounts = {
  rawItems: number;
  contents: number;
  stories: number;
};

export type PipelineRawItem = {
  id: string;
  sourceId: string;
  url: string | null;
  title: string | null;
  kind: string;
  status: string;
  createdAt: string | null;
};

export type PipelineContent = {
  id: string;
  rawItemId: string;
  htmlUrl: string | null;
  contentType: string;
  languageCode: string | null;
  extractedAt: string | null;
};

export type PipelineStory = {
  id: string;
  contentId: string;
  title: string | null;
  primaryUrl: string | null;
  kind: string;
  publishedAt: string | null;
  createdAt: string | null;
};

export type PipelineActivity = {
  rawItems: PipelineRawItem[];
  contents: PipelineContent[];
  stories: PipelineStory[];
};

/**
 * Count objects at each ingestion stage (raw items → contents → stories).
 */
export async function getPipelineCounts(db: Database): Promise<PipelineCounts> {
  const [rawItemsCount, contentsCount, storiesCount] = await Promise.all([
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(rawItems)
      .then(([row]) => row?.count ?? 0),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(contents)
      .then(([row]) => row?.count ?? 0),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(stories)
      .then(([row]) => row?.count ?? 0),
  ]);

  return {
    rawItems: rawItemsCount,
    contents: contentsCount,
    stories: storiesCount,
  } satisfies PipelineCounts;
}

/**
 * Fetch recent inserts at each stage of the ingestion pipeline.
 */
export async function getRecentPipelineActivity(
  db: Database,
  params: { limit?: number } = {},
): Promise<PipelineActivity> {
  const { limit = 25 } = params;

  const [rawItemRows, contentRows, storyRows] = await Promise.all([
    db
      .select({
        id: rawItems.id,
        sourceId: rawItems.source_id,
        url: rawItems.url,
        title: rawItems.title,
        kind: rawItems.kind,
        status: rawItems.status,
        createdAt: rawItems.created_at,
      })
      .from(rawItems)
      .orderBy(desc(rawItems.created_at))
      .limit(limit),
    db
      .select({
        id: contents.id,
        rawItemId: contents.raw_item_id,
        htmlUrl: contents.html_url,
        contentType: contents.content_type,
        languageCode: contents.language_code,
        extractedAt: contents.extracted_at,
      })
      .from(contents)
      .orderBy(desc(contents.extracted_at))
      .limit(limit),
    db
      .select({
        id: stories.id,
        contentId: stories.content_id,
        title: stories.title,
        primaryUrl: stories.primary_url,
        kind: stories.kind,
        publishedAt: stories.published_at,
        createdAt: stories.created_at,
      })
      .from(stories)
      .orderBy(desc(stories.created_at))
      .limit(limit),
  ]);

  return {
    rawItems: rawItemRows.map((row) => ({
      id: row.id,
      sourceId: row.sourceId,
      url: row.url,
      title: row.title,
      kind: row.kind,
      status: row.status,
      createdAt: row.createdAt,
    })),
    contents: contentRows.map((row) => ({
      id: row.id,
      rawItemId: row.rawItemId,
      htmlUrl: row.htmlUrl,
      contentType: row.contentType,
      languageCode: row.languageCode,
      extractedAt: row.extractedAt,
    })),
    stories: storyRows.map((row) => ({
      id: row.id,
      contentId: row.contentId,
      title: row.title,
      primaryUrl: row.primaryUrl,
      kind: row.kind,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
    })),
  } satisfies PipelineActivity;
}
