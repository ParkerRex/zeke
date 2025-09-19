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

/**
 * Fetch stories with overlay + transcript metadata in the format that the
 * dashboard UI expects. This hides the Drizzle plumbing so server components
 * just call a single helper.
 */
export async function fetchStoriesForDashboard(
  params: ListStoryClustersParams = {},
) {
  const db = await connectDb();
  return listStoriesForDisplay(db, params);
}

/**
 * Fetch a single story + cluster context for the dashboard detail views.
 */
export async function fetchStoryForDashboard(storyId: string) {
  const db = await connectDb();
  return getStoryForDisplay(db, storyId);
}
