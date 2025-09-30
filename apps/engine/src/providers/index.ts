import type { Bindings } from "@engine/common/bindings";
import { ApplePodcastsProvider } from "./apple-podcasts/apple-podcasts-provider";
import { ArxivProvider } from "./arxiv/arxiv-provider";
import type { ProviderInterface } from "./interface";
import { RSSProvider } from "./rss/rss-provider";
import { SemanticScholarProvider } from "./semantic-scholar/semantic-scholar-provider";
import type {
  ContentItem,
  ContentSource,
  HealthStatus,
  Providers,
} from "./types";
import { YouTubeProvider } from "./youtube/youtube-provider";

export class ProviderFacade {
  private providers: Map<Providers, ProviderInterface>;

  constructor(envs: Bindings) {
    this.providers = new Map();

    // Initialize available providers
    try {
      this.providers.set("youtube", new YouTubeProvider(envs));
    } catch (error) {
      console.warn("Failed to initialize YouTube provider:", error);
    }

    try {
      this.providers.set("rss", new RSSProvider(envs));
    } catch (error) {
      console.warn("Failed to initialize RSS provider:", error);
    }

    try {
      this.providers.set("arxiv", new ArxivProvider(envs));
    } catch (error) {
      console.warn("Failed to initialize arXiv provider:", error);
    }

    try {
      this.providers.set("podcast", new ApplePodcastsProvider(envs));
    } catch (error) {
      console.warn("Failed to initialize Apple Podcasts provider:", error);
    }

    try {
      this.providers.set(
        "semantic-scholar",
        new SemanticScholarProvider(envs),
      );
    } catch (error) {
      console.warn("Failed to initialize Semantic Scholar provider:", error);
    }
  }

  async getContent(url: string): Promise<ContentItem> {
    const provider = this.findProviderForUrl(url);
    if (!provider) {
      throw new Error(`No provider found for URL: ${url}`);
    }

    return provider.getContent(url);
  }

  async getSource(url: string): Promise<ContentSource> {
    const provider = this.findProviderForUrl(url);
    if (!provider) {
      throw new Error(`No provider found for URL: ${url}`);
    }

    return provider.getSource(url);
  }

  async getHealthCheck(): Promise<Record<Providers, HealthStatus>> {
    const results: Record<string, HealthStatus> = {};

    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.getHealthCheck();
      } catch (error) {
        results[name] = {
          status: "unhealthy",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return results as Record<Providers, HealthStatus>;
  }

  private findProviderForUrl(url: string): ProviderInterface | null {
    for (const provider of this.providers.values()) {
      if (provider.supportsUrl(url)) {
        return provider;
      }
    }
    return null;
  }

  getSupportedProviders(): Providers[] {
    return Array.from(this.providers.keys());
  }
}

// Factory function for creating provider instances
export function createProvider(envs: Bindings): ProviderFacade {
  return new ProviderFacade(envs);
}
