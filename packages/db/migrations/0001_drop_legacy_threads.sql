-- Drop legacy thread tables to make way for new chat tables
DROP TABLE IF EXISTS public.assistant_thread_sources CASCADE;
DROP TABLE IF EXISTS public.assistant_threads CASCADE;
DROP TABLE IF EXISTS public.message_source_links CASCADE;
DROP TABLE IF EXISTS public.assistant_messages CASCADE;

-- Also drop any foreign key references that might exist
ALTER TABLE public.highlights DROP CONSTRAINT IF EXISTS highlights_assistant_thread_id_fkey;