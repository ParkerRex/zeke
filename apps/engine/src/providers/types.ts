export type SourceType =
  | "youtube"
  | "arxiv"
  | "rss"
  | "twitter"
  | "blog"
  | "podcast"
  | "paper"
  | "semantic-scholar";
export type ContentType =
  | "video"
  | "audio"
  | "text"
  | "paper"
  | "article"
  | "post";

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  sourceType: SourceType;
  contentType: ContentType;
  publishedAt: Date;
  duration?: number; // in seconds
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
  sourceType: SourceType;
  metadata: Record<string, any>;
  isActive: boolean;
  lastChecked: Date;
}

export interface HealthStatus {
  status: "healthy" | "unhealthy";
  message?: string;
}

export type Providers =
  | "youtube"
  | "arxiv"
  | "rss"
  | "podcast"
  | "semantic-scholar";
