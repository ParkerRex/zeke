import type { Database } from "@db/client";
import {
  type StoryClusterSummary,
  type StoryClusterView,
  type StoryEmbedKind,
  type StoryOverlaySummary,
  mapStoryClusterRecordToSummary,
  mapStoryClusterStoryToView,
} from "../utils/story-view";
import {
  type ListStoryClustersParams,
  getStoryDetailForApply,
  listStoriesWithOverlays,
} from "./story-clusters";

export type {
  StoryClusterSummary,
  StoryClusterView,
  StoryEmbedKind,
  StoryOverlaySummary,
};

export async function listStoriesForDisplay(
  db: Database,
  params: ListStoryClustersParams = {},
): Promise<{
  stories: StoryClusterView[];
  totalCount: number;
  hasMore: boolean;
}> {
  const { stories, totalCount, hasMore } = await listStoriesWithOverlays(
    db,
    params,
  );

  return {
    stories: stories.map(mapStoryClusterStoryToView),
    totalCount,
    hasMore,
  };
}

export async function getStoryForDisplay(
  db: Database,
  storyId: string,
): Promise<{
  story: StoryClusterView;
  cluster: StoryClusterSummary & { stories: StoryClusterView[] };
  metrics: Record<string, unknown> | null;
} | null> {
  const detail = await getStoryDetailForApply(db, { storyId });

  if (!detail) {
    return null;
  }

  return {
    story: mapStoryClusterStoryToView(detail.story),
    cluster: {
      ...mapStoryClusterRecordToSummary(detail.cluster),
      stories: detail.cluster.stories.map(mapStoryClusterStoryToView),
    },
    metrics: detail.metrics ?? null,
  };
}
