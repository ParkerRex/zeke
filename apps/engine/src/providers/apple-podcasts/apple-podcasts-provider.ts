import type { Bindings } from "@engine/common/bindings";
import type { ProviderInterface } from "../interface";
import type { ContentItem, ContentSource, HealthStatus } from "../types";
import { ApplePodcastsAPI } from "./apple-podcasts-api";
import {
  transformEpisodeToContent,
  transformPodcastToSource,
} from "./transform";

/**
 * Apple Podcasts provider implementation
 * Handles podcast episode ingestion via iTunes Search API
 */
export class ApplePodcastsProvider implements ProviderInterface {
  private api: ApplePodcastsAPI;

  constructor(envs: Bindings) {
    this.api = new ApplePodcastsAPI();
  }

  /**
   * Extract content from an Apple Podcasts URL
   * Returns the latest episode from the podcast
   */
  async getContent(url: string): Promise<ContentItem> {
    try {
      const podcastId = this.api.extractPodcastId(url);

      if (!podcastId) {
        throw new Error("Could not extract podcast ID from URL");
      }

      const { podcast, episode } = await this.api.getLatestEpisode(podcastId);

      return transformEpisodeToContent(episode, podcast.id, url);
    } catch (error) {
      throw new Error(
        `Failed to fetch Apple Podcasts content: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get source information for a podcast
   */
  async getSource(url: string): Promise<ContentSource> {
    try {
      const podcastId = this.api.extractPodcastId(url);

      if (!podcastId) {
        throw new Error("Could not extract podcast ID from URL");
      }

      const podcast = await this.api.lookupPodcast(podcastId);
      return transformPodcastToSource(podcast);
    } catch (error) {
      throw new Error(
        `Failed to fetch Apple Podcasts source: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if iTunes Search API is accessible
   */
  async getHealthCheck(): Promise<HealthStatus> {
    const result = await this.api.healthCheck();

    if (result.healthy) {
      return {
        status: "healthy",
        message: "Apple Podcasts API is accessible",
      };
    }

    return {
      status: "unhealthy",
      message: result.message || "Apple Podcasts API is not accessible",
    };
  }

  /**
   * Check if this provider can handle the given URL
   */
  supportsUrl(url: string): boolean {
    return this.api.isApplePodcastsUrl(url);
  }
}