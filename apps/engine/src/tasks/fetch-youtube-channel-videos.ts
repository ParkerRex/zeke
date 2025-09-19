import type { YouTubeVideo } from '../types/youtube.js';
import { log } from '../log.js';

export async function fetchYouTubeChannelVideos(input: {
  uploadsPlaylistId: string;
  maxResults?: number;
  publishedAfter?: string;
}): Promise<YouTubeVideo[]> {
  log(
    'youtube_fetch_channel_videos_disabled',
    {
      uploadsPlaylistId: input.uploadsPlaylistId,
      maxResults: input.maxResults,
      publishedAfter: input.publishedAfter,
      reason: 'google_cloud_integration_removed',
    },
    'warn'
  );

  return [];
}
