// Import shared database types for consistency
export type { Database, Tables } from '@zeke/supabase/types';

export type SourceKind =
  | 'rss'
  | 'podcast'
  | 'youtube_channel'
  | 'youtube_search';

// Use shared database types where possible
export type SourceRow = Tables<'sources'>;
export type RawItemRow = Tables<'raw_items'>;
export type ContentRow = Tables<'contents'>;
export type StoryRow = Tables<'stories'>;

export type SourceBase = {
  id: string;
  kind: SourceKind | string;
  name?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
};

// Legacy compatibility - gradually migrate to SourceRow
export type SourceRowLegacy = SourceBase;
