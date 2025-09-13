import { getChannelUploads } from "../lib/youtube/get-channel-uploads.js";
import { getVideoDetails } from "../lib/youtube/get-video-details.js";
import type { YouTubeVideo } from "../lib/youtube/types.js";
import { createYouTubeClient } from "../lib/youtube/youtube-client.js";
import { log } from "../log.js";
import { quotaTracker } from "../utils/quota-tracker.js";

const QUOTA_COST_PER_PLAYLIST_PAGE = 1;
const MAX_ITEMS_PER_PAGE = 50;

export async function fetchYouTubeChannelVideos(input: {
  uploadsPlaylistId: string;
  maxResults?: number;
  publishedAfter?: string;
}): Promise<YouTubeVideo[]> {
  const { uploadsPlaylistId, maxResults = 50, publishedAfter } = input;
  const client = createYouTubeClient();

  log("youtube_fetch_channel_videos_start", {
    uploadsPlaylistId,
    maxResults,
    publishedAfter,
  });

  const estimatedCost =
    QUOTA_COST_PER_PLAYLIST_PAGE + Math.ceil(maxResults / MAX_ITEMS_PER_PAGE);
  if (!quotaTracker.reserveQuota("channel_videos", estimatedCost)) {
    const status = quotaTracker.checkQuotaStatus();
    throw new Error(
      `Insufficient quota. Need ${estimatedCost}, have ${status.remaining}`
    );
  }

  const videos = await getChannelUploads(
    client,
    uploadsPlaylistId,
    maxResults,
    publishedAfter
  );
  const videoIds = videos.map((v) => v.videoId);
  const detailedVideos = await getVideoDetails(client, videoIds);

  const actualCost =
    QUOTA_COST_PER_PLAYLIST_PAGE +
    Math.ceil(videoIds.length / MAX_ITEMS_PER_PAGE);
  quotaTracker.consumeQuota("channel_videos", actualCost);

  log("youtube_fetch_channel_videos_complete", {
    uploadsPlaylistId,
    videosFound: detailedVideos.length,
    quotaUsed: actualCost,
    quotaStatus: quotaTracker.checkQuotaStatus(),
  });

  return detailedVideos;
}
