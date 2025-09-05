import { google } from 'googleapis';
import { log } from '../log.js';
export class YouTubeAPIClient {
    youtube;
    quotaLimit;
    quotaBuffer;
    quotaResetHour;
    constructor() {
        if (!process.env.YOUTUBE_API_KEY) {
            throw new Error('YOUTUBE_API_KEY environment variable is required');
        }
        this.youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY,
        });
        this.quotaLimit = parseInt(process.env.YOUTUBE_QUOTA_LIMIT || '10000');
        this.quotaBuffer = parseInt(process.env.YOUTUBE_RATE_LIMIT_BUFFER || '500');
        this.quotaResetHour = parseInt(process.env.YOUTUBE_QUOTA_RESET_HOUR || '0');
    }
    /**
     * Check current quota status and remaining capacity
     */
    async checkQuotaStatus(currentUsage = 0) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        // Check if we've passed the reset hour today
        const resetTime = new Date(today + 'T' + String(this.quotaResetHour).padStart(2, '0') + ':00:00.000Z');
        const hasReset = now >= resetTime;
        const used = hasReset ? currentUsage : 0; // Reset usage if past reset hour
        const remaining = this.quotaLimit - used;
        const canProceed = remaining > this.quotaBuffer;
        log('youtube_quota_check', {
            used,
            remaining,
            canProceed,
            quotaLimit: this.quotaLimit,
            quotaBuffer: this.quotaBuffer,
            resetTime: resetTime.toISOString(),
        });
        return { used, remaining, canProceed };
    }
    /**
     * Search for channels by name or topic
     */
    async searchChannels(query, maxResults = 10) {
        try {
            log('youtube_search_channels_start', { query, maxResults });
            const searchResponse = await this.youtube.search.list({
                part: ['snippet'],
                q: query,
                type: 'channel',
                maxResults,
            });
            const channels = [];
            for (const item of searchResponse.data.items || []) {
                if (item.snippet && item.id?.channelId) {
                    // Get channel details to find uploads playlist
                    const channelDetails = await this.youtube.channels.list({
                        part: ['contentDetails'],
                        id: [item.id.channelId],
                    });
                    const uploadsPlaylistId = channelDetails.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
                    if (uploadsPlaylistId) {
                        channels.push({
                            channelId: item.id.channelId,
                            title: item.snippet.title || '',
                            description: item.snippet.description || '',
                            uploadsPlaylistId,
                        });
                    }
                }
            }
            log('youtube_search_channels_complete', {
                query,
                channelsFound: channels.length,
                quotaUsed: 100 + channels.length, // 100 for search + 1 per channel details
            });
            return channels;
        }
        catch (error) {
            log('youtube_search_channels_error', {
                query,
                error: String(error),
            }, 'error');
            throw error;
        }
    }
    /**
     * Get recent videos from a channel's uploads playlist
     */
    async getChannelUploads(uploadsPlaylistId, maxResults = 10, publishedAfter) {
        try {
            log('youtube_get_uploads_start', {
                uploadsPlaylistId,
                maxResults,
                publishedAfter,
            });
            const response = await this.youtube.playlistItems.list({
                part: ['snippet', 'contentDetails'],
                playlistId: uploadsPlaylistId,
                maxResults: Math.min(maxResults, 50), // YouTube API limit
            });
            const videos = [];
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
            log('youtube_get_uploads_complete', {
                uploadsPlaylistId,
                videosFound: videos.length,
                quotaUsed: 1, // 1 unit for playlist items request
            });
            return videos;
        }
        catch (error) {
            log('youtube_get_uploads_error', {
                uploadsPlaylistId,
                error: String(error),
            }, 'error');
            throw error;
        }
    }
    /**
     * Get detailed information about specific videos
     */
    async getVideoDetails(videoIds) {
        if (videoIds.length === 0)
            return [];
        try {
            log('youtube_get_video_details_start', {
                videoCount: videoIds.length,
                videoIds: videoIds.slice(0, 5), // Log first 5 for debugging
            });
            // YouTube API allows up to 50 video IDs per request
            const chunks = [];
            for (let i = 0; i < videoIds.length; i += 50) {
                chunks.push(videoIds.slice(i, i + 50));
            }
            const allVideos = [];
            for (const chunk of chunks) {
                const response = await this.youtube.videos.list({
                    part: ['snippet', 'statistics', 'contentDetails'],
                    id: chunk,
                });
                for (const item of response.data.items || []) {
                    if (item.snippet && item.id) {
                        allVideos.push({
                            videoId: item.id,
                            title: item.snippet.title || '',
                            description: item.snippet.description || '',
                            publishedAt: item.snippet.publishedAt || '',
                            channelId: item.snippet.channelId || '',
                            channelTitle: item.snippet.channelTitle || '',
                            thumbnailUrl: item.snippet.thumbnails?.medium?.url || undefined,
                            duration: item.contentDetails?.duration || undefined,
                            viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount) : undefined,
                            likeCount: item.statistics?.likeCount ? parseInt(item.statistics.likeCount) : undefined,
                        });
                    }
                }
            }
            log('youtube_get_video_details_complete', {
                requestedCount: videoIds.length,
                foundCount: allVideos.length,
                quotaUsed: chunks.length, // 1 unit per request
            });
            return allVideos;
        }
        catch (error) {
            log('youtube_get_video_details_error', {
                videoCount: videoIds.length,
                error: String(error),
            }, 'error');
            throw error;
        }
    }
    /**
     * Search for videos with specific criteria
     */
    async searchVideos(query, maxResults = 10, publishedAfter, order = 'relevance', duration = 'any') {
        try {
            log('youtube_search_videos_start', {
                query,
                maxResults,
                publishedAfter,
                order,
                duration,
            });
            const searchResponse = await this.youtube.search.list({
                part: ['snippet'],
                q: query,
                type: 'video',
                maxResults: Math.min(maxResults, 50),
                publishedAfter,
                order,
                videoDuration: duration,
            });
            const videos = [];
            for (const item of searchResponse.data.items || []) {
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
            log('youtube_search_videos_complete', {
                query,
                videosFound: videos.length,
                quotaUsed: 100, // 100 units for search request
            });
            return videos;
        }
        catch (error) {
            log('youtube_search_videos_error', {
                query,
                error: String(error),
            }, 'error');
            throw error;
        }
    }
    /**
     * Implement exponential backoff for retrying failed requests
     */
    async withRetry(operation, maxRetries = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                const isLastAttempt = attempt === maxRetries;
                const isRetryable = this.isRetryableError(error);
                if (isLastAttempt || !isRetryable) {
                    throw error;
                }
                const delay = baseDelay * Math.pow(2, attempt - 1);
                log('youtube_api_retry', {
                    attempt,
                    maxRetries,
                    delay,
                    error: String(error),
                }, 'warn');
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error('Max retries exceeded');
    }
    /**
     * Determine if an error is retryable
     */
    isRetryableError(error) {
        // Network errors are generally retryable
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            return true;
        }
        // YouTube API quota errors are not retryable
        if (error.message?.includes('quotaExceeded')) {
            return false;
        }
        // Rate limit errors might be retryable with backoff
        if (error.message?.includes('rateLimitExceeded')) {
            return true;
        }
        // Server errors (5xx) are retryable
        if (error.status >= 500 && error.status < 600) {
            return true;
        }
        return false;
    }
}
