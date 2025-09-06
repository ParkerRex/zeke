export type SourceRef = {
  title: string;
  url: string;
  domain: string;
};

export type Overlays = {
  whyItMatters: string;
  chili: number;
  confidence: number;
  sources: SourceRef[];
};

export type EmbedKind =
  | 'youtube'
  | 'article' // blogs/news
  | 'reddit'
  | 'hn'
  | 'podcast'
  | 'arxiv'
  | 'twitter'
  | 'industry'
  | 'company';

export type YouTubeMetadata = {
  transcriptUrl?: string;
  transcriptVtt?: string;
  durationSeconds?: number;
  viewCount?: number;
};

export type Cluster = {
  id: string;
  title: string;
  primaryUrl: string;
  embedKind: EmbedKind;
  embedUrl: string;
  overlays: Overlays;
  youtubeMetadata?: YouTubeMetadata;
};

