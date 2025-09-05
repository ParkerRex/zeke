import { log } from '../log.js';
import { YouTubeAPIClient } from '../clients/youtube-api.js';
import { QuotaTracker } from '../utils/quota-tracker.js';
/**
 * YouTube content fetcher with quota management
 */
export class YouTubeFetcher {
    apiClient;
    quotaTracker;
    constructor() {
        this.apiClient = new YouTubeAPIClient();
        this.quotaTracker = new QuotaTracker();
    }
    /**
     * Fetch videos from a YouTube channel using uploads playlist ID
     */
    async fetchChannelVideos(uploadsPlaylistId, options = {}) {
        const { maxResults = 50, publishedAfter } = options;
        try {
            log('youtube_fetch_channel_videos_start', {
                uploadsPlaylistId,
                maxResults,
                publishedAfter,
            });
            // Check quota before making request
            const estimatedCost = 1 + Math.ceil(maxResults / 50); // Playlist items + video details
            if (!this.quotaTracker.reserveQuota('channel_videos', estimatedCost)) {
                const status = this.quotaTracker.checkQuotaStatus();
                throw new Error(`Insufficient quota. Need ${estimatedCost}, have ${status.remaining}`);
            }
            // Fetch videos from uploads playlist
            const videos = await this.apiClient.getChannelUploads(uploadsPlaylistId, maxResults, publishedAfter);
            // Get detailed video information
            const videoIds = videos.map(video => video.videoId);
            const detailedVideos = await this.apiClient.getVideoDetails(videoIds);
            // Track quota usage
            const actualCost = 1 + Math.ceil(videoIds.length / 50);
            this.quotaTracker.consumeQuota('channel_videos', actualCost);
            log('youtube_fetch_channel_videos_complete', {
                uploadsPlaylistId,
                videosFound: detailedVideos.length,
                quotaUsed: actualCost,
                remainingQuota: this.quotaTracker.checkQuotaStatus().remaining,
            });
            return detailedVideos;
        }
        catch (error) {
            log('youtube_fetch_channel_videos_error', {
                uploadsPlaylistId,
                error: String(error),
            }, 'error');
            throw error;
        }
    }
    /**
     * Search for YouTube videos
     */
    async searchVideos(query, options = {}) {
        const { maxResults = 25, publishedAfter, order = 'relevance', duration = 'any' } = options;
        try {
            log('youtube_search_videos_start', {
                query,
                maxResults,
                publishedAfter,
                order,
                duration,
            });
            // Check quota before making request
            const estimatedCost = 100; // Search costs 100 units
            if (!this.quotaTracker.reserveQuota('search_videos', estimatedCost)) {
                const status = this.quotaTracker.checkQuotaStatus();
                throw new Error(`Insufficient quota. Need ${estimatedCost}, have ${status.remaining}`);
            }
            // Perform search
            const searchResults = await this.apiClient.searchVideos(query, maxResults, publishedAfter, order, duration);
            // Track quota usage
            this.quotaTracker.consumeQuota('search_videos', estimatedCost);
            log('youtube_search_videos_complete', {
                query,
                resultsFound: searchResults.length,
                quotaUsed: estimatedCost,
                remainingQuota: this.quotaTracker.checkQuotaStatus().remaining,
            });
            return searchResults;
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
     * Get detailed information about specific videos
     */
    async getVideoDetails(videoIds) {
        try {
            log('youtube_get_video_details_start', {
                videoCount: videoIds.length,
                videoIds: videoIds.slice(0, 5),
            });
            // Check quota before making request
            const estimatedCost = Math.ceil(videoIds.length / 50);
            if (!this.quotaTracker.reserveQuota('video_details', estimatedCost)) {
                const status = this.quotaTracker.checkQuotaStatus();
                throw new Error(`Insufficient quota. Need ${estimatedCost}, have ${status.remaining}`);
            }
            const videos = await this.apiClient.getVideoDetails(videoIds);
            // Track quota usage
            this.quotaTracker.consumeQuota('video_details', estimatedCost);
            log('youtube_get_video_details_complete', {
                requestedCount: videoIds.length,
                returnedCount: videos.length,
                quotaUsed: estimatedCost,
                remainingQuota: this.quotaTracker.checkQuotaStatus().remaining,
            });
            return videos;
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
     * Get quota status
     */
    getQuotaStatus() {
        const status = this.quotaTracker.checkQuotaStatus();
        return {
            remaining: status.remaining,
            used: status.used,
            limit: status.limit,
            resetTime: new Date(status.resetAt),
        };
    }
}
