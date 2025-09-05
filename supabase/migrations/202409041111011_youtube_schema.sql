-- YouTube Pipeline Schema Updates
-- Add metadata column to sources table and YouTube-specific fields to contents table

-- Add metadata column to sources table for YouTube channel configuration
ALTER TABLE public.sources
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Add YouTube-specific fields to contents table
ALTER TABLE public.contents
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS transcript_url text,
ADD COLUMN IF NOT EXISTS duration_seconds integer,
ADD COLUMN IF NOT EXISTS view_count bigint;

-- Add indexes for YouTube content queries
CREATE INDEX IF NOT EXISTS idx_contents_audio_url ON public.contents(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contents_transcript_url ON public.contents(transcript_url) WHERE transcript_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_raw_items_youtube ON public.raw_items(kind, external_id) WHERE kind = 'youtube';

-- Add YouTube source validation constraint
ALTER TABLE public.sources
ADD CONSTRAINT check_youtube_metadata
CHECK (
  (kind NOT IN ('youtube_channel', 'youtube_search')) OR
  (metadata IS NOT NULL AND metadata != '{}')
);

-- Function to get YouTube sources with metadata
CREATE OR REPLACE FUNCTION get_youtube_sources()
RETURNS TABLE(
  id uuid,
  kind text,
  name text,
  url text,
  domain text,
  metadata jsonb,
  last_cursor jsonb
)
LANGUAGE sql
AS $$
  SELECT id, kind, name, url, domain, metadata, last_cursor
  FROM public.sources
  WHERE kind IN ('youtube_channel', 'youtube_search')
  AND (metadata IS NOT NULL);
$$;
