import type { ContentItem, ContentSource, HealthStatus } from "./types";

export interface ProviderInterface {
  /**
   * Extract content from a URL (video, article, paper, etc.)
   */
  getContent(url: string): Promise<ContentItem>;

  /**
   * Get source information (channel, feed, author, etc.)
   */
  getSource(url: string): Promise<ContentSource>;

  /**
   * Check if the provider is healthy and can fetch content
   */
  getHealthCheck(): Promise<HealthStatus>;

  /**
   * Check if this provider can handle the given URL
   */
  supportsUrl(url: string): boolean;
}

