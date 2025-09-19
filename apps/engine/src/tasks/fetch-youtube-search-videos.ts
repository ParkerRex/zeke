import type { YouTubeVideo } from '../types/youtube.js';
import { log } from '../log.js';

export async function fetchYouTubeSearchVideos(input: {
  query: string;
  maxResults?: number;
  publishedAfter?: string;
  order?: 'date' | 'relevance' | 'viewCount';
  duration?: 'short' | 'medium' | 'long' | 'any';
}): Promise<YouTubeVideo[]> {
  log(
    'youtube_search_videos_disabled',
    {
      query: input.query,
      maxResults: input.maxResults,
      publishedAfter: input.publishedAfter,
      order: input.order,
      duration: input.duration,
      reason: 'google_cloud_integration_removed',
    },
    'warn'
  );

  return [];
}
