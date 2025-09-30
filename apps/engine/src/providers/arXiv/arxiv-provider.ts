import type { Bindings } from "@engine/common/bindings";
import type { ProviderInterface } from "../interface";
import type { ContentItem, ContentSource, HealthStatus } from "../types";
import { ArxivAPI } from "./arxiv-api";
import { transformArxivToSource, transformPaperToContent } from "./transform";

/**
 * arXiv provider implementation
 * Handles academic paper ingestion from arXiv.org
 * No API key required - arXiv is open access
 */
export class ArxivProvider implements ProviderInterface {
  private api: ArxivAPI;

  constructor(envs: Bindings) {
    // arXiv is open access, no API key needed
    this.api = new ArxivAPI();
  }

  /**
   * Extract content from an arXiv paper URL
   */
  async getContent(url: string): Promise<ContentItem> {
    try {
      const arxivId = this.api.extractArxivId(url);
      if (!arxivId) {
        throw new Error(`Invalid arXiv URL: ${url}`);
      }

      const entry = await this.api.getPaper(arxivId);
      return transformPaperToContent(entry, url);
    } catch (error) {
      throw new Error(
        `Failed to fetch arXiv paper: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get source information (arXiv.org itself)
   */
  async getSource(url: string): Promise<ContentSource> {
    return transformArxivToSource();
  }

  /**
   * Check if arXiv API is accessible
   */
  async getHealthCheck(): Promise<HealthStatus> {
    const result = await this.api.healthCheck();

    if (result.healthy) {
      return {
        status: "healthy",
        message: result.message || "arXiv API is accessible",
      };
    }

    return {
      status: "unhealthy",
      message: result.message || "arXiv API is not accessible",
    };
  }

  /**
   * Check if this provider can handle the given URL
   */
  supportsUrl(url: string): boolean {
    return this.api.isValidArxivUrl(url);
  }
}
