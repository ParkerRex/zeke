import PgBoss from 'pg-boss';
import { getYouTubeSources, upsertRawItem, updateSourceMetadata } from '../db.js';
import { YouTubeFetcher } from '../fetch/youtube.js';
import { log } from '../log.js';
import { YouTubeAPIClient } from '../clients/youtube-api.js';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  log(
    'youtube_api_key_missing',
    {
      message: 'YOUTUBE_API_KEY environment variable is required for YouTube ingestion',
    },
    'warn'
  );
}

/**
 * Run YouTube content ingestion for all configured YouTube sources
 */
export async function runIngestYouTube(boss: PgBoss) {
  if (!YOUTUBE_API_KEY) {
    log('youtube_ingest_skipped', { reason: 'missing_api_key' }, 'warn');
    return;
  }

  const sources = await getYouTubeSources();
  const fetcher = new YouTubeFetcher();

  log('youtube_ingest_start', {
    comp: 'ingest',
    sourceCount: sources.length,
    quotaStatus: fetcher.getQuotaStatus(),
  });

  for (const src of sources) {
    try {
      const t0 = Date.now();
      log('youtube_source_start', {
        comp: 'ingest',
        source_id: src.id,
        kind: src.kind,
        name: src.name,
        url: src.url,
      });

      let videos: any[] = [];
      let seen = 0;
      let newCount = 0;

      if (src.kind === 'youtube_channel') {
        videos = await processChannelSource(src, fetcher);
      } else if (src.kind === 'youtube_search') {
        videos = await processSearchSource(src, fetcher);
      } else {
        log(
          'youtube_source_unknown_kind',
          {
            source_id: src.id,
            kind: src.kind,
          },
          'warn'
        );
        continue;
      }

      // Process each video
      for (const video of videos) {
        seen++;

        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const metadata = {
          videoId: video.videoId,
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          publishedAt: video.publishedAt,
          duration: video.duration,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
          thumbnails: video.thumbnails,
          tags: video.tags,
          categoryId: video.categoryId,
          defaultLanguage: video.defaultLanguage,
          defaultAudioLanguage: video.defaultAudioLanguage,
          src: src.url || `search:${src.metadata?.query}`,
        };

        const rawItemId = await upsertRawItem({
          source_id: src.id,
          external_id: video.videoId,
          url: videoUrl,
          title: video.title,
          kind: 'youtube',
          metadata,
        });

        if (rawItemId) {
          // New video: enqueue YouTube-specific fetch-content job
          await boss.send('ingest:fetch-youtube-content', {
            rawItemIds: [rawItemId],
            videoId: video.videoId,
            sourceKind: src.kind,
          });
          newCount++;
        }
      }

      log('youtube_source_done', {
        comp: 'ingest',
        source_id: src.id,
        kind: src.kind,
        name: src.name,
        videos_seen: seen,
        videos_new: newCount,
        duration_ms: Date.now() - t0,
        quotaStatus: fetcher.getQuotaStatus(),
      });
    } catch (err) {
      log(
        'youtube_ingest_error',
        {
          comp: 'ingest',
          source_id: src.id,
          kind: src.kind,
          name: src.name,
          url: src.url,
          err: String(err),
        },
        'error'
      );
    }
  }

  const finalQuotaStatus = fetcher.getQuotaStatus();
  log('youtube_ingest_complete', {
    comp: 'ingest',
    sourcesProcessed: sources.length,
    quotaUsed: finalQuotaStatus.used,
    quotaRemaining: finalQuotaStatus.remaining,
  });
}

/**
 * Process a YouTube channel source
 */
async function processChannelSource(src: any, fetcher: YouTubeFetcher) {
  const metadata = src.metadata || {};
  let uploadsPlaylistId: string | undefined = metadata.upload_playlist_id || undefined;

  const maxResults = metadata.max_videos_per_run || 10;
  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  async function fetchWithId(id: string) {
    log('youtube_channel_fetch', { source_id: src.id, uploadsPlaylistId: id, maxResults, publishedAfter });
    return await fetcher.fetchChannelVideos(id, { maxResults, publishedAfter });
  }

  // Attempt with configured uploads playlist id first
  if (uploadsPlaylistId) {
    try {
      return await fetchWithId(uploadsPlaylistId);
    } catch (err: any) {
      const msg = String(err || '');
      if (!msg.includes('playlistId') && !msg.toLowerCase().includes('not found')) throw err;
      log('youtube_uploads_id_invalid', { source_id: src.id, uploadsPlaylistId, err: msg }, 'warn');
      // fall through to derive id
    }
  }

  // Derive uploads playlist id from channel handle/name as a fallback
  const client = new YouTubeAPIClient();
  let query = '';
  if (typeof src.url === 'string' && src.url.includes('youtube.com/')) {
    const match = src.url.match(/@([A-Za-z0-9_\-\.]+)/);
    if (match) query = match[1];
  }
  if (!query && typeof src.name === 'string') query = src.name;

  log('youtube_derive_uploads_id_start', { source_id: src.id, query });
  const candidates = await client.searchChannels(query || '');
  const chosen = candidates[0];
  if (!chosen?.uploadsPlaylistId) {
    throw new Error(`Could not derive uploads playlist id for source ${src.id}`);
  }
  uploadsPlaylistId = chosen.uploadsPlaylistId;
  log('youtube_derive_uploads_id_success', { source_id: src.id, uploadsPlaylistId });

  // Persist derived id so future runs don’t need search (saves 100 quota)
  try {
    await updateSourceMetadata(src.id, { upload_playlist_id: uploadsPlaylistId });
  } catch (e) {
    log('youtube_derive_uploads_id_persist_error', { source_id: src.id, err: String(e) }, 'warn');
  }

  return await fetchWithId(uploadsPlaylistId);
}

/**
 * Process a YouTube search source
 */
async function processSearchSource(src: any, fetcher: YouTubeFetcher) {
  const metadata = src.metadata || {};
  const query = metadata.query;

  if (!query) {
    throw new Error(`No query found in metadata for source ${src.id}`);
  }

  const maxResults = metadata.max_results || 10;
  const publishedAfter = metadata.published_after || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  log('youtube_search_fetch', {
    source_id: src.id,
    query,
    maxResults,
    publishedAfter,
    order: metadata.order || 'relevance',
  });

  const searchResults = await fetcher.searchVideos(query, {
    maxResults,
    publishedAfter,
    order: metadata.order || 'relevance',
    duration: metadata.duration,
  });

  // Convert search results to video format (they're already YouTubeVideo objects)
  return searchResults;
}

/**
 * Get YouTube quota status
 */
export async function getYouTubeQuotaStatus() {
  if (!YOUTUBE_API_KEY) {
    return {
      available: false,
      reason: 'missing_api_key',
    };
  }

  try {
    const fetcher = new YouTubeFetcher();
    const status = fetcher.getQuotaStatus();

    return {
      available: true,
      ...status,
    };
  } catch (error) {
    return {
      available: false,
      reason: 'error',
      error: String(error),
    };
  }
}

/**
 * Test YouTube API connectivity
 */
export async function testYouTubeAPI() {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  const fetcher = new YouTubeFetcher();

  // Test with a simple search request (low quota cost)
  const testQuery = 'AI research';

  try {
    const searchResults = await fetcher.searchVideos(testQuery, { maxResults: 1 });

    log('youtube_api_test_success', {
      testQuery,
      resultsFound: searchResults.length,
      quotaStatus: fetcher.getQuotaStatus(),
    });

    return {
      success: true,
      searchResults,
      quotaStatus: fetcher.getQuotaStatus(),
    };
  } catch (error) {
    log(
      'youtube_api_test_error',
      {
        testQuery,
        error: String(error),
      },
      'error'
    );

    throw error;
  }
}
