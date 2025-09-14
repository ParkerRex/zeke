-- Add missing fields to sources table that exist in baseline but not in remote
-- This corrects schema drift between local and remote databases

-- Add missing columns to sources table
ALTER TABLE public.sources
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Update existing rows to have proper timestamps if they don't already
UPDATE public.sources
SET
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.sources.active IS 'Whether this source is actively being processed';
COMMENT ON COLUMN public.sources.created_at IS 'When this source was first added';
COMMENT ON COLUMN public.sources.updated_at IS 'When this source was last modified';