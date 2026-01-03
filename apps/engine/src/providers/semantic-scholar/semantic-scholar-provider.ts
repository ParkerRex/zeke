import type { Bindings } from "@engine/common/bindings";
import type { ProviderInterface } from "../interface";
import type { ContentItem, ContentSource, HealthStatus } from "../types";
import { SemanticScholarAPI } from "./semantic-scholar-api";
import {
  transformPaperToContent,
  transformSemanticScholarToSource,
} from "./transform";

/**
 * Semantic Scholar provider implementation
 * Handles academic paper ingestion from Semantic Scholar
 * No API key required - Semantic Scholar is free
 */
export class SemanticScholarProvider implements ProviderInterface {
  private api: SemanticScholarAPI;

  constructor(envs: Bindings) {
    this.api = new SemanticScholarAPI();
  }

  /**
   * Extract content from a Semantic Scholar paper URL
   */
  async getContent(url: string): Promise<ContentItem> {
    try {
      const paperId = this.api.extractPaperId(url);
      const paper = await this.api.getPaper(paperId);
      return transformPaperToContent(paper, url);
    } catch (error) {
      throw new Error(
        `Failed to fetch Semantic Scholar paper: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get source information (Semantic Scholar itself)
   */
  async getSource(url: string): Promise<ContentSource> {
    return transformSemanticScholarToSource();
  }

  /**
   * Check if Semantic Scholar API is accessible
   */
  async getHealthCheck(): Promise<HealthStatus> {
    const result = await this.api.healthCheck();

    if (result.healthy) {
      return {
        status: "healthy",
        message: "Semantic Scholar API is accessible",
      };
    }

    return {
      status: "unhealthy",
      message: result.message || "Semantic Scholar API is not accessible",
    };
  }

  /**
   * Check if this provider can handle the given URL
   */
  supportsUrl(url: string): boolean {
    return this.api.isSemanticScholarUrl(url);
  }
}
