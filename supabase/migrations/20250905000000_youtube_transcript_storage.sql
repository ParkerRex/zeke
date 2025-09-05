-- Add VTT transcript storage to contents table
-- Store VTT content directly in database for YouTube transcripts

ALTER TABLE public.contents
ADD COLUMN IF NOT EXISTS transcript_vtt text;

-- Add index for VTT content queries
CREATE INDEX IF NOT EXISTS idx_contents_transcript_vtt ON public.contents(id) WHERE transcript_vtt IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.contents.transcript_vtt IS 'WebVTT format transcript content for YouTube videos with timestamps';
