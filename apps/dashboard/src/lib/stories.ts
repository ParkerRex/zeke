import { connectDb } from "@zeke/db/src/client";
import type { ListStoryClustersParams } from "@zeke/db/src/queries/story-clusters";
import {
  type StoryClusterView,
  type StoryEmbedKind,
  type StoryOverlaySummary,
  getStoryForDisplay,
  listStoriesForDisplay,
} from "@zeke/db/src/queries/story-display";

export type { StoryClusterView, StoryEmbedKind, StoryOverlaySummary };

export async function fetchStoriesForDashboard(
  params: ListStoryClustersParams = {},
) {
  const db = await connectDb();
  return listStoriesForDisplay(db, params);
}

export async function fetchStoryForDashboard(storyId: string) {
  const db = await connectDb();
  return getStoryForDisplay(db, storyId);
}
