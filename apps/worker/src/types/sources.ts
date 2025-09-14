export type SourceKind =
  | 'rss'
  | 'podcast'
  | 'youtube_channel'
  | 'youtube_search';

export type SourceBase = {
  id: string;
  kind: SourceKind | string;
  name?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
};
