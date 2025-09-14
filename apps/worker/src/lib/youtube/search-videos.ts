import { log } from '../../log.js';
import { withRetry } from '../../utils/retry.js';
import type { VideoSearchOptions, YouTubeVideo } from './types.js';
import type { YouTubeClient } from './youtube-client.js';

const SEARCH_QUOTA_COST = 100;
const MAX_VIDEOS_PER_REQUEST = 50;

export async function searchVideos(
  client: YouTubeClient,
  options: VideoSearchOptions
): Promise<YouTubeVideo[]> {
  const {
    query,
    maxResults = 10,
    publishedAfter,
    order = 'relevance',
    duration = 'any',
  } = options;

  try {
    log('youtube_search_videos_start', {
      query,
      maxResults,
      publishedAfter,
      order,
      duration,
    });

    const searchResponse = await withRetry(() =>
      client.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults: Math.min(maxResults, MAX_VIDEOS_PER_REQUEST),
        publishedAfter,
        order,
        videoDuration: duration,
      })
    );

    const videos = extractVideosFromSearchResponse(searchResponse);

    log('youtube_search_videos_complete', {
      query,
      videosFound: videos.length,
      quotaUsed: SEARCH_QUOTA_COST,
    });

    return videos;
  } catch (error) {
    log(
      'youtube_search_videos_error',
      {
        query,
        error: String(error),
      },
      'error'
    );
    throw error;
  }
}

function extractVideosFromSearchResponse(searchResponse: {
  data: import('googleapis').youtube_v3.Schema$SearchListResponse;
}): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];
  for (const item of searchResponse.data?.items || []) {
    const videoId = item.id?.videoId;
    const snippet = item.snippet;
    if (videoId && snippet) {
      videos.push({
        videoId,
        title: snippet.title || '',
        description: snippet.description || '',
        publishedAt: snippet.publishedAt || '',
        channelId: snippet.channelId || '',
        channelTitle: snippet.channelTitle || '',
        thumbnailUrl: snippet.thumbnails?.medium?.url || undefined,
      });
    }
  }
  return videos;
}
