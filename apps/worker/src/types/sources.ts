// Local database types for worker (self-contained for Docker builds)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SourceKind =
  | 'rss'
  | 'podcast'
  | 'youtube_channel'
  | 'youtube_search';

// Essential database table types (subset needed by worker)
export type SourceRow = {
  id: string;
  kind: string;
  name: string | null;
  url: string | null;
  active: boolean;
  domain: string | null;
  authority_score: number | null;
  created_at: string;
  updated_at: string;
  last_checked: string | null;
  last_cursor: Json | null;
  metadata: Json | null;
};

export type DiscoveryRow = {
  id: string;
  source_id: string;
  external_id: string | null;
  url: string | null;
  title: string | null;
  description: string | null;
  published_at: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

export type ContentRow = {
  id: string;
  discovery_id: string;
  content_hash: string;
  text: string | null;
  html_url: string | null;
  pdf_url: string | null;
  audio_url: string | null;
  transcript_url: string | null;
  transcript_vtt: string | null;
  duration_seconds: number | null;
  view_count: number | null;
  lang: string | null;
  extracted_at: string | null;
};

export type StoryRow = {
  id: string;
  content_id: string;
  canonical_url: string | null;
  kind: string | null;
  title: string | null;
  primary_url: string | null;
  published_at: string | null;
  cluster_key: string | null;
  created_at: string;
};

export type SourceBase = {
  id: string;
  kind: SourceKind | string;
  name?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
};

// Legacy compatibility - gradually migrate to SourceRow
export type SourceRowLegacy = SourceBase;
