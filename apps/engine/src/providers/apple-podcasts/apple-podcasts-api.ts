import type {
  ApplePodcastsResult,
  ApplePodcastsSearchResponse,
  PodcastEpisode,
  PodcastRSSFeed,
} from "./types";

export interface PodcastData {
  id: string;
  name: string;
  author: string;
  description: string;
  feedUrl: string;
  artworkUrl: string;
  genres: string[];
  episodeCount?: number;
}

export interface EpisodeData {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  duration?: number;
  episodeUrl?: string;
  podcastName: string;
  podcastAuthor: string;
  artworkUrl?: string;
}

/**
 * Apple Podcasts API client
 * Uses iTunes Search API for podcast discovery
 */
export class ApplePodcastsAPI {
  private baseUrl = "https://itunes.apple.com";

  /**
   * Extract podcast ID from Apple Podcasts URL
   * Supports formats:
   * - https://podcasts.apple.com/us/podcast/podcast-name/id123456789
   * - https://podcasts.apple.com/podcast/id123456789
   */
  extractPodcastId(url: string): string | null {
    const match = url.match(/\/id(\d+)/);
    return match?.[1] || null;
  }

  /**
   * Check if URL is an Apple Podcasts URL
   */
  isApplePodcastsUrl(url: string): boolean {
    return url.includes("podcasts.apple.com");
  }

  /**
   * Lookup podcast by ID
   */
  async lookupPodcast(podcastId: string): Promise<PodcastData> {
    const url = new URL(`${this.baseUrl}/lookup`);
    url.searchParams.set("id", podcastId);
    url.searchParams.set("entity", "podcast");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `Apple Podcasts API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as ApplePodcastsSearchResponse;

    if (!data.results || data.results.length === 0) {
      throw new Error(`Podcast not found: ${podcastId}`);
    }

    const podcast = data.results[0];

    return {
      id: String(podcast.collectionId),
      name: podcast.collectionName,
      author: podcast.artistName,
      description: podcast.description || "",
      feedUrl: podcast.feedUrl || "",
      artworkUrl: this.getBestArtwork(podcast),
      genres: podcast.genres || [podcast.primaryGenreName],
      episodeCount: podcast.trackCount,
    };
  }

  /**
   * Get podcast episodes from RSS feed
   */
  async getEpisodes(feedUrl: string): Promise<PodcastEpisode[]> {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Zeke Research Engine/1.0 (+https://zekehq.com)",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Feed fetch failed: ${response.status} ${response.statusText}`,
      );
    }

    const xmlText = await response.text();
    return this.parseRSSEpisodes(xmlText);
  }

  /**
   * Get the latest episode from a podcast
   */
  async getLatestEpisode(
    podcastId: string,
  ): Promise<{ podcast: PodcastData; episode: EpisodeData }> {
    const podcast = await this.lookupPodcast(podcastId);

    if (!podcast.feedUrl) {
      throw new Error("Podcast RSS feed URL not available");
    }

    const episodes = await this.getEpisodes(podcast.feedUrl);

    if (episodes.length === 0) {
      throw new Error("No episodes found in podcast feed");
    }

    const latestEpisode = episodes[0];

    return {
      podcast,
      episode: {
        id: latestEpisode.guid,
        title: latestEpisode.title,
        description: latestEpisode.description,
        publishedAt: latestEpisode.pubDate,
        duration: this.parseDuration(latestEpisode.duration),
        episodeUrl: latestEpisode.episodeUrl,
        podcastName: podcast.name,
        podcastAuthor: podcast.author,
        artworkUrl: podcast.artworkUrl,
      },
    };
  }

  /**
   * Parse RSS feed to extract episodes
   */
  private parseRSSEpisodes(xmlText: string): PodcastEpisode[] {
    const episodes: PodcastEpisode[] = [];
    const itemsRegex = /<item>([\s\S]*?)<\/item>/g;

    for (const match of xmlText.matchAll(itemsRegex)) {
      const itemXml = match[1];

      const title = this.extractValue(itemXml, "title");
      const description =
        this.extractValue(itemXml, "description") ||
        this.extractValue(itemXml, "itunes:summary");
      const pubDate = this.extractValue(itemXml, "pubDate");
      const link = this.extractValue(itemXml, "link");
      const guid = this.extractValue(itemXml, "guid") || link;
      const duration = this.extractValue(itemXml, "itunes:duration");
      const episodeUrlMatch = itemXml.match(
        /<enclosure[^>]+url="([^"]+)"[^>]*>/,
      );

      episodes.push({
        title,
        description,
        pubDate,
        link,
        guid,
        duration,
        episodeUrl: episodeUrlMatch?.[1],
      });
    }

    return episodes;
  }

  private extractValue(xml: string, tag: string): string {
    // Try CDATA first
    const cdataMatch = xml.match(
      new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, "s"),
    );
    if (cdataMatch) return this.cleanHtml(cdataMatch[1]);

    // Try normal tag
    const normalMatch = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "s"));
    if (normalMatch) return this.cleanHtml(normalMatch[1]);

    return "";
  }

  private cleanHtml(text: string): string {
    return text
      .replace(/<[^>]*>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .trim();
  }

  /**
   * Parse duration from various formats (HH:MM:SS, MM:SS, seconds)
   */
  private parseDuration(duration?: string): number | undefined {
    if (!duration) return undefined;

    // If it's just a number, assume seconds
    if (/^\d+$/.test(duration)) {
      return Number.parseInt(duration, 10);
    }

    // Parse HH:MM:SS or MM:SS format
    const parts = duration.split(":").map((p) => Number.parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    return undefined;
  }

  private getBestArtwork(podcast: ApplePodcastsResult): string {
    return (
      podcast.artworkUrl600 ||
      podcast.artworkUrl100 ||
      podcast.artworkUrl60 ||
      podcast.artworkUrl30 ||
      ""
    );
  }

  /**
   * Health check - verify API is accessible
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Test with a known podcast (The Daily by NYT - id1200361736)
      await this.lookupPodcast("1200361736");
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}