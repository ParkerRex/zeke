import type { Bindings } from "@engine/common/bindings";
import type { ProviderInterface } from "../interface";
import type { ContentItem, ContentSource } from "../types";
import { RSSAPI } from "./rss-api";
import { transformFeedToSource, transformItemToContent } from "./transform";

export class RSSProvider implements ProviderInterface {
  private api: RSSAPI;

  constructor(envs: Bindings) {
    this.api = new RSSAPI();
  }

  async getContent(url: string): Promise<ContentItem> {
    // For RSS, we need to get the feed and find the specific item
    // If URL is a direct article link, we'll extract the article
    if (this.api.isValidRSSUrl(url)) {
      const feed = await this.api.getFeed(url);
      if (feed.items.length === 0) {
        throw new Error("No items found in RSS feed");
      }
      // Return the latest item
      return transformItemToContent(feed.items[0], feed);
    }

    // If it's a direct article URL, try to extract content
    return this.extractArticleContent(url);
  }

  async getSource(url: string): Promise<ContentSource> {
    const feed = await this.api.getFeed(url);
    return transformFeedToSource(feed, url);
  }

  async getHealthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    message?: string;
  }> {
    try {
      // Test with a known reliable RSS feed (Hacker News)
      const feed = await this.api.getFeed(
        "https://hnrss.org/newest?points=100",
      );
      if (feed.items.length === 0) {
        throw new Error("RSS feed returned no items");
      }
      return { status: "healthy", message: "RSS parsing operational" };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  supportsUrl(url: string): boolean {
    return (
      this.api.isValidRSSUrl(url) ||
      url.includes("blog") ||
      url.includes("news") ||
      url.includes("medium.com") ||
      url.includes("substack.com")
    );
  }

  private async extractArticleContent(url: string): Promise<ContentItem> {
    // Simple article extraction - in production you'd use a proper extractor
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Zeke Research Engine/1.0 (+https://zekehq.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`Article fetch failed: ${response.status}`);
    }

    const html = await response.text();

    // Extract basic metadata
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descMatch =
      html.match(/<meta name="description" content="(.*?)"/i) ||
      html.match(/<meta property="og:description" content="(.*?)"/i);

    return {
      id: this.generateId(url),
      title: titleMatch?.[1] || "Unknown Article",
      description: descMatch?.[1] || "",
      url,
      sourceType: "rss",
      contentType: "article",
      publishedAt: new Date(),
      metadata: {
        originalUrl: url,
        extractedAt: new Date().toISOString(),
      },
    };
  }

  private generateId(url: string): string {
    // Simple ID generation - in production use a proper hash
    return `rss_${
      url
        .split("/")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "_") || "unknown"
    }`;
  }
}
