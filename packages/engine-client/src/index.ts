// Engine Client - Interface to Zeke's content ingestion engine

export interface EngineClient {
  ingestContent(url: string): Promise<ContentItem>;
  getSourceInfo(url: string): Promise<ContentSource>;
  healthCheck(): Promise<EngineHealth>;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  sourceType:
    | "youtube"
    | "arxiv"
    | "rss"
    | "twitter"
    | "blog"
    | "podcast"
    | "paper";
  contentType: "video" | "audio" | "text" | "paper" | "article" | "post";
  publishedAt: Date;
  duration?: number;
  metadata: Record<string, any>;
  author?: {
    id: string;
    name: string;
    url: string;
  };
}

export interface ContentSource {
  id: string;
  name: string;
  description: string;
  url: string;
  sourceType: string;
  metadata: Record<string, any>;
  isActive: boolean;
  lastChecked: Date;
}

export interface EngineHealth {
  status: "healthy" | "degraded" | "unhealthy";
  providers: Record<string, { status: string; message?: string }>;
  timestamp: string;
}

export class ZekeEngineClient implements EngineClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
  }

  async ingestContent(url: string): Promise<ContentItem> {
    const response = await this.request("/ingest", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Engine error: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getSourceInfo(url: string): Promise<ContentSource> {
    const response = await this.request("/source", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Engine error: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  async healthCheck(): Promise<EngineHealth> {
    const response = await this.request("/health");

    if (!response.ok) {
      return {
        status: "unhealthy",
        providers: {},
        timestamp: new Date().toISOString(),
      };
    }

    return response.json();
  }

  private async request(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });
  }
}

// Factory function for creating engine client
export function createEngineClient(
  baseUrl?: string,
  apiKey?: string,
): EngineClient {
  const url = baseUrl || process.env.ENGINE_API_URL || "http://localhost:8787";
  const key = apiKey || process.env.ENGINE_API_KEY;

  return new ZekeEngineClient(url, key);
}
