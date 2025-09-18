import { connectDb } from "@zeke/db/src/client";
import {
  getStoryForDisplay,
  listStoriesForDisplay,
  type StoryClusterView,
} from "@zeke/db/src/queries/story-display";
import type { ListStoryClustersParams } from "@zeke/db/src/queries/story-clusters";

export type { StoryClusterView };

export async function fetchStoriesForWebsite(
  params: ListStoryClustersParams = {},
) {
  const db = await connectDb();
  return listStoriesForDisplay(db, params);
}

export async function fetchStoryForWebsite(storyId: string) {
  const db = await connectDb();
  return getStoryForDisplay(db, storyId);
}
