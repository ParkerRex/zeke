import type { Bindings } from "@engine/common/bindings";
import type {
  YouTubeChannelResponse,
  YouTubeError,
  YouTubeTranscriptResponse,
  YouTubeVideoResponse,
} from "./types";

/**
 * Simplified data structure for video content
 */
export interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount?: string;
  thumbnail: string;
  transcript?: string;
}

/**
 * Simplified data structure for channel information
 */
export interface YouTubeChannelData {
  id: string;
  title: string;
  description: string;
  subscriberCount: string;
  videoCount: string;
  thumbnail: string;
}

/**
 * YouTube Data API v3 client
 */
export class YouTubeAPI {
  private apiKey: string;
  private baseUrl = "https://www.googleapis.com/youtube/v3";
  private quotaLimit: number;
  private rateLimitBuffer: number;

  constructor(envs: Bindings) {
    this.apiKey = envs.YOUTUBE_API_KEY;
    if (!this.apiKey) {
      throw new Error("YOUTUBE_API_KEY is required");
    }

    // Optional quota management
    this.quotaLimit = Number.parseInt(envs.YOUTUBE_QUOTA_LIMIT || "10000", 10);
    this.rateLimitBuffer = Number.parseInt(
      envs.YOUTUBE_RATE_LIMIT_BUFFER || "1000",
      10,
    );
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
      /(?:youtube\.com\/v\/)([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    throw new Error(`Invalid YouTube URL: ${url}`);
  }

  /**
   * Extract channel ID from YouTube URL
   */
  extractChannelId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/channel\/)([^/?]+)/,
      /(?:youtube\.com\/c\/)([^/?]+)/,
      /(?:youtube\.com\/@)([^/?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Check if URL is a valid YouTube video URL
   */
  isVideoUrl(url: string): boolean {
    return /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)/.test(url);
  }

  /**
   * Fetch video details from YouTube API
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideoData> {
    const url = new URL(`${this.baseUrl}/videos`);
    url.searchParams.set("id", videoId);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("part", "snippet,contentDetails,statistics");

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = (await response.json()) as YouTubeError;
      throw new Error(
        `YouTube API error: ${error.error.message} (${error.error.code})`,
      );
    }

    const data = (await response.json()) as YouTubeVideoResponse;

    if (!data.items || data.items.length === 0) {
      throw new Error(`Video not found: ${videoId}`);
    }

    const video = data.items[0];

    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      thumbnail: this.getBestThumbnail(video.snippet.thumbnails),
    };
  }

  /**
   * Fetch channel details from YouTube API
   */
  async getChannelDetails(channelId: string): Promise<YouTubeChannelData> {
    const url = new URL(`${this.baseUrl}/channels`);
    url.searchParams.set("id", channelId);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("part", "snippet,statistics");

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = (await response.json()) as YouTubeError;
      throw new Error(
        `YouTube API error: ${error.error.message} (${error.error.code})`,
      );
    }

    const data = (await response.json()) as YouTubeChannelResponse;

    if (!data.items || data.items.length === 0) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const channel = data.items[0];

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      thumbnail: this.getBestThumbnail(channel.snippet.thumbnails),
    };
  }

  /**
   * Fetch video transcript/captions
   * Note: YouTube API v3 doesn't directly provide transcripts
   * This is a placeholder for integration with youtube-transcript-api or similar
   */
  async getTranscript(videoId: string): Promise<string | undefined> {
    // TODO: Integrate with a transcript service
    // Options:
    // 1. Use youtube-transcript-api via proxy
    // 2. Parse YouTube's timedtext API directly
    // 3. Use a third-party service
    //
    // For now, return undefined and rely on content description
    return undefined;
  }

  /**
   * Get the highest quality thumbnail available
   */
  private getBestThumbnail(
    thumbnails: YouTubeVideoResponse["items"][0]["snippet"]["thumbnails"],
  ): string {
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.standard) return thumbnails.standard.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    return thumbnails.default.url;
  }

  /**
   * Health check - verify API key works
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Use a known video for health check (Rick Astley - Never Gonna Give You Up)
      const testVideoId = "dQw4w9WgXcQ";
      await this.getVideoDetails(testVideoId);
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
