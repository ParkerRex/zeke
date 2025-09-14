import { log } from '../../log.js';
import { withRetry } from '../../utils/retry.js';
import type { YouTubeVideo } from './types.js';
import type { YouTubeClient } from './youtube-client.js';

const PLAYLIST_ITEMS_QUOTA_COST = 1;
const MAX_VIDEOS_PER_REQUEST = 50;

export async function getChannelUploads(
  client: YouTubeClient,
  uploadsPlaylistId: string,
  maxResults = 10,
  publishedAfter?: string
): Promise<YouTubeVideo[]> {
  try {
    log('youtube_get_uploads_start', {
      uploadsPlaylistId,
      maxResults,
      publishedAfter,
    });

    const response = await withRetry(() =>
      client.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId: uploadsPlaylistId,
        maxResults: Math.min(maxResults, MAX_VIDEOS_PER_REQUEST),
      })
    );

    let videos: YouTubeVideo[] = [];

    for (const item of response.data.items || []) {
      const videoId = item.contentDetails?.videoId;
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

    if (publishedAfter) {
      const cutoff = new Date(publishedAfter).toISOString();
      videos = videos.filter((v) => v.publishedAt >= cutoff);
    }

    log('youtube_get_uploads_complete', {
      uploadsPlaylistId,
      videosFound: videos.length,
      quotaUsed: PLAYLIST_ITEMS_QUOTA_COST,
    });

    return videos;
  } catch (error) {
    log(
      'youtube_get_uploads_error',
      {
        uploadsPlaylistId,
        error: String(error),
      },
      'error'
    );
    throw error;
  }
}
