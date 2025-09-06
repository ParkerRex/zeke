-- Remove YouTube channel sources with missing or clearly invalid uploads playlist IDs
-- Safe heuristic: uploads playlist ids start with 'UU'. Anything else is likely invalid.

BEGIN;

DELETE FROM public.sources s
WHERE s.kind = 'youtube_channel'
  AND (
    (s.metadata->>'upload_playlist_id') IS NULL OR
    (s.metadata->>'upload_playlist_id') !~ '^UU'
  );

COMMIT;

