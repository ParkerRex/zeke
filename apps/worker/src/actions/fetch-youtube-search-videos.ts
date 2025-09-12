import { searchVideos as ytSearchVideos } from "../lib/youtube/search-videos.js";
import type { YouTubeVideo } from "../lib/youtube/types.js";
import { createYouTubeClient } from "../lib/youtube/youtube-client.js";
import { log } from "../log.js";
import { quotaTracker } from "../utils/quota-tracker.js";

const QUOTA_COST_SEARCH = 100;

export async function fetchYouTubeSearchVideos(input: {
  query: string;
  maxResults?: number;
  publishedAfter?: string;
  order?: "date" | "relevance" | "viewCount";
  duration?: "short" | "medium" | "long" | "any";
}): Promise<YouTubeVideo[]> {
  const {
    query,
    maxResults = 25,
    publishedAfter,
    order = "relevance",
    duration = "any",
  } = input;
  const client = createYouTubeClient();

  log("youtube_search_videos_start", {
    query,
    maxResults,
    publishedAfter,
    order,
    duration,
  });

  if (!quotaTracker.reserveQuota("search_videos", QUOTA_COST_SEARCH)) {
    const status = quotaTracker.checkQuotaStatus();
    throw new Error(
      `Insufficient quota. Need ${QUOTA_COST_SEARCH}, have ${status.remaining}`
    );
  }

  const results: YouTubeVideo[] = await ytSearchVideos(client, {
    query,
    maxResults,
    publishedAfter,
    order,
    duration,
  });

  quotaTracker.consumeQuota("search_videos", QUOTA_COST_SEARCH);

  log("youtube_search_videos_complete", {
    query,
    resultsFound: results.length,
    quotaUsed: QUOTA_COST_SEARCH,
    quotaStatus: quotaTracker.checkQuotaStatus(),
  });

  return results;
}
