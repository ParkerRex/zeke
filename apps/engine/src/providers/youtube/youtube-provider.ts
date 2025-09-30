import type { Bindings } from "@engine/common/bindings";
import type { ProviderInterface } from "../interface";
import type { ContentItem, ContentSource, HealthStatus } from "../types";
import { transformChannelToSource, transformVideoToContent } from "./transform";
import { YouTubeAPI } from "./youtube-api";

/**
 * YouTube provider implementation
 * Handles YouTube video ingestion via YouTube Data API v3
 */
export class YouTubeProvider implements ProviderInterface {
  private api: YouTubeAPI;

  constructor(envs: Bindings) {
    this.api = new YouTubeAPI(envs);
  }

  /**
   * Extract content from a YouTube video URL
   */
  async getContent(url: string): Promise<ContentItem> {
    try {
      const videoId = this.api.extractVideoId(url);

      // Fetch video details and transcript in parallel
      const [videoData, transcript] = await Promise.all([
        this.api.getVideoDetails(videoId),
        this.api.getTranscript(videoId).catch(() => undefined),
      ]);

      // Attach transcript if available
      if (transcript) {
        videoData.transcript = transcript;
      }

      // Transform to common ContentItem format
      return transformVideoToContent(videoData, url);
    } catch (error) {
      throw new Error(
        `Failed to fetch YouTube content: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get source information for a YouTube channel
   */
  async getSource(url: string): Promise<ContentSource> {
    try {
      let channelId: string | null = this.api.extractChannelId(url);

      // If it's a video URL, extract channel from video details
      if (!channelId && this.api.isVideoUrl(url)) {
        const videoId = this.api.extractVideoId(url);
        const videoData = await this.api.getVideoDetails(videoId);
        channelId = videoData.channelId;
      }

      if (!channelId) {
        throw new Error("Could not extract channel ID from URL");
      }

      const channelData = await this.api.getChannelDetails(channelId);
      return transformChannelToSource(channelData);
    } catch (error) {
      throw new Error(
        `Failed to fetch YouTube source: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if YouTube API is accessible
   */
  async getHealthCheck(): Promise<HealthStatus> {
    const result = await this.api.healthCheck();

    if (result.healthy) {
      return {
        status: "healthy",
        message: "YouTube Data API is accessible",
      };
    }

    return {
      status: "unhealthy",
      message: result.message || "YouTube Data API is not accessible",
    };
  }

  /**
   * Check if this provider can handle the given URL
   */
  supportsUrl(url: string): boolean {
    return (
      this.api.isVideoUrl(url) ||
      /(?:youtube\.com\/(?:channel\/|c\/|@)|youtu\.be\/)/.test(url)
    );
  }
}
