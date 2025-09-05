import { getYouTubeSources, upsertRawItem } from '../db.js';
import { YouTubeFetcher } from '../fetch/youtube.js';
import { log } from '../log.js';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
    log('youtube_api_key_missing', {
        message: 'YOUTUBE_API_KEY environment variable is required for YouTube ingestion',
    }, 'warn');
}
/**
 * Run YouTube content ingestion for all configured YouTube sources
 */
export async function runIngestYouTube(boss) {
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
            let videos = [];
            let seen = 0;
            let newCount = 0;
            if (src.kind === 'youtube_channel') {
                videos = await processChannelSource(src, fetcher);
            }
            else if (src.kind === 'youtube_search') {
                videos = await processSearchSource(src, fetcher);
            }
            else {
                log('youtube_source_unknown_kind', {
                    source_id: src.id,
                    kind: src.kind,
                }, 'warn');
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
        }
        catch (err) {
            log('youtube_ingest_error', {
                comp: 'ingest',
                source_id: src.id,
                kind: src.kind,
                name: src.name,
                url: src.url,
                err: String(err),
            }, 'error');
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
async function processChannelSource(src, fetcher) {
    const metadata = src.metadata || {};
    const uploadsPlaylistId = metadata.upload_playlist_id;
    if (!uploadsPlaylistId) {
        throw new Error(`No upload_playlist_id found in metadata for source ${src.id}`);
    }
    const maxResults = metadata.max_videos_per_run || 10;
    // Get videos from the last 7 days by default
    const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    log('youtube_channel_fetch', {
        source_id: src.id,
        uploadsPlaylistId,
        maxResults,
        publishedAfter,
    });
    const videos = await fetcher.fetchChannelVideos(uploadsPlaylistId, {
        maxResults,
        publishedAfter,
    });
    return videos;
}
/**
 * Process a YouTube search source
 */
async function processSearchSource(src, fetcher) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        log('youtube_api_test_error', {
            testQuery,
            error: String(error),
        }, 'error');
        throw error;
    }
}
