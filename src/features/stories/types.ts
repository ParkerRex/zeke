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

export type EmbedKind = "youtube" | "article" | "reddit" | "hn";

export type Cluster = {
  id: string;
  title: string;
  primaryUrl: string;
  embedKind: EmbedKind;
  embedUrl: string;
  overlays: Overlays;
};

