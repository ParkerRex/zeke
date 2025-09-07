import { quotaTracker } from "../utils/quota-tracker.js";
import type { SourceBase } from "../types/sources.js";
import { fetchYouTubeChannelVideos } from "./fetch-youtube-channel-videos.js";
import { fetchYouTubeSearchVideos } from "./fetch-youtube-search-videos.js";
import { resolveYouTubeUploadsId } from "./resolve-youtube-uploads-id.js";

const DEFAULT_MAX_VIDEOS = 10;
const DAYS_LOOKBACK = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function previewYouTubeSourceAction(
  src: SourceBase,
  limit = DEFAULT_MAX_VIDEOS
) {
  if (src.kind === "youtube_channel") {
    const metadata = src.metadata || {};
    const maxResults = Math.min(
      metadata.max_videos_per_run || DEFAULT_MAX_VIDEOS,
      limit
    );
    const publishedAfter = new Date(
      Date.now() - DAYS_LOOKBACK * MS_PER_DAY
    ).toISOString();
    const uploadsPlaylistId = await resolveYouTubeUploadsId({
      sourceId: src.id,
      url: src.url || undefined,
      name: src.name || undefined,
      currentUploadsPlaylistId:
        (metadata.upload_playlist_id as string | undefined) || undefined,
    });
    const videos = await fetchYouTubeChannelVideos({
      uploadsPlaylistId,
      maxResults,
      publishedAfter,
    });
    return {
      items: videos.slice(0, limit).map(toPreviewItem),
      quota: quotaTracker.checkQuotaStatus(),
    };
  }
  if (src.kind === "youtube_search") {
    const metadata = src.metadata || {};
    const query = metadata.query as string;
    const maxResults = Math.min(
      metadata.max_results || DEFAULT_MAX_VIDEOS,
      limit
    );
    const publishedAfter =
      metadata.published_after ||
      new Date(Date.now() - DAYS_LOOKBACK * MS_PER_DAY).toISOString();
    const order = (metadata.order as any) || "relevance";
    const duration = (metadata.duration as any) || undefined;
    const videos = await fetchYouTubeSearchVideos({
      query,
      maxResults,
      publishedAfter,
      order,
      duration,
    });
    return {
      items: videos.slice(0, limit).map(toPreviewItem),
      quota: quotaTracker.checkQuotaStatus(),
    };
  }
  throw new Error(`Unsupported kind for preview: ${src.kind}`);
}

function toPreviewItem(v: {
  title: string;
  videoId: string;
  publishedAt: string;
}) {
  return {
    title: v.title,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    external_id: v.videoId,
    published_at: v.publishedAt,
  };
}
