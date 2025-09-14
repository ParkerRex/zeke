-- Fix Function Search Path Security Vulnerabilities
-- This migration addresses critical Supabase Security Advisor warnings about
-- functions lacking explicit search_path settings, which can lead to privilege
-- escalation and security bypass attacks.
--
-- Security Issue: Functions with SECURITY DEFINER context that don't set
-- search_path = '' are vulnerable to search path manipulation attacks where
-- malicious users can create objects in schemas earlier in the search path
-- to hijack function calls.
--
-- Solution: Set search_path = '' and fully qualify all object names in
-- SECURITY DEFINER functions to prevent search path manipulation attacks.
--
-- Security Impact: CRITICAL - Prevents privilege escalation and ensures
-- functions operate with predictable object resolution.

-- =============================================================================
-- CRITICAL RLS SECURITY FUNCTIONS
-- =============================================================================

-- Fix is_admin_user function - CRITICAL for RLS policies
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = (SELECT auth.uid())),
    false
  );
$$;

-- Fix is_worker_role function - CRITICAL for RLS policies  
CREATE OR REPLACE FUNCTION public.is_worker_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT current_user = 'worker';
$$;

-- =============================================================================
-- AUTH TRIGGER FUNCTION SECURITY
-- =============================================================================

-- Fix handle_new_user function - CRITICAL for user registration security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );
  RETURN NEW;
END;
$$;

-- =============================================================================
-- DATA ACCESS FUNCTION SECURITY
-- =============================================================================

-- Fix get_youtube_sources function - Data access security
CREATE OR REPLACE FUNCTION public.get_youtube_sources()
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
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  SELECT 
    s.id, 
    s.kind, 
    s.name, 
    s.url, 
    s.domain, 
    s.metadata, 
    s.last_cursor
  FROM public.sources s
  WHERE s.kind IN ('youtube_channel', 'youtube_search') 
    AND s.metadata IS NOT NULL;
$$;

-- =============================================================================
-- METRICS FUNCTION SECURITY
-- =============================================================================

-- Fix refresh_source_metrics function - Metrics computation security
CREATE OR REPLACE FUNCTION public.refresh_source_metrics(_source_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF _source_id IS NULL THEN
    -- Recompute for all sources
    INSERT INTO public.source_metrics AS m (
      source_id,
      raw_total,
      contents_total,
      stories_total,
      raw_24h,
      contents_24h,
      stories_24h,
      last_raw_at,
      last_content_at,
      last_story_at,
      updated_at
    )
    SELECT 
      s.id,
      COALESCE((SELECT count(*) FROM public.raw_items r WHERE r.source_id = s.id), 0) AS raw_total,
      COALESCE((SELECT count(*) FROM public.contents c JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id), 0) AS contents_total,
      COALESCE((SELECT count(*) FROM public.stories st JOIN public.contents c ON c.id = st.content_id JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id), 0) AS stories_total,
      COALESCE((SELECT count(*) FROM public.raw_items r WHERE r.source_id = s.id AND r.discovered_at > now() - interval '24 hours'), 0) AS raw_24h,
      COALESCE((SELECT count(*) FROM public.contents c JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id AND c.extracted_at > now() - interval '24 hours'), 0) AS contents_24h,
      COALESCE((SELECT count(*) FROM public.stories st JOIN public.contents c ON c.id = st.content_id JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id AND st.created_at > now() - interval '24 hours'), 0) AS stories_24h,
      (SELECT max(discovered_at) FROM public.raw_items r WHERE r.source_id = s.id) AS last_raw_at,
      (SELECT max(extracted_at) FROM public.contents c JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id) AS last_content_at,
      (SELECT max(st.created_at) FROM public.stories st JOIN public.contents c ON c.id = st.content_id JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id) AS last_story_at,
      now()
    FROM public.sources s
    ON CONFLICT (source_id) DO UPDATE SET
      raw_total = EXCLUDED.raw_total,
      contents_total = EXCLUDED.contents_total,
      stories_total = EXCLUDED.stories_total,
      raw_24h = EXCLUDED.raw_24h,
      contents_24h = EXCLUDED.contents_24h,
      stories_24h = EXCLUDED.stories_24h,
      last_raw_at = EXCLUDED.last_raw_at,
      last_content_at = EXCLUDED.last_content_at,
      last_story_at = EXCLUDED.last_story_at,
      updated_at = EXCLUDED.updated_at;
  ELSE
    -- Recompute for one source
    INSERT INTO public.source_metrics AS m (
      source_id, raw_total, contents_total, stories_total, raw_24h, contents_24h, stories_24h, last_raw_at, last_content_at, last_story_at, updated_at
    )
    SELECT 
      s.id,
      COALESCE((SELECT count(*) FROM public.raw_items r WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM public.contents c JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM public.stories st JOIN public.contents c ON c.id = st.content_id JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM public.raw_items r WHERE r.source_id = s.id AND r.discovered_at > now() - interval '24 hours'), 0),
      COALESCE((SELECT count(*) FROM public.contents c JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id AND c.extracted_at > now() - interval '24 hours'), 0),
      COALESCE((SELECT count(*) FROM public.stories st JOIN public.contents c ON c.id = st.content_id JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id AND st.created_at > now() - interval '24 hours'), 0),
      (SELECT max(discovered_at) FROM public.raw_items r WHERE r.source_id = s.id),
      (SELECT max(extracted_at) FROM public.contents c JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id),
      (SELECT max(st.created_at) FROM public.stories st JOIN public.contents c ON c.id = st.content_id JOIN public.raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id),
      now()
    FROM public.sources s 
    WHERE s.id = _source_id
    ON CONFLICT (source_id) DO UPDATE SET
      raw_total = EXCLUDED.raw_total,
      contents_total = EXCLUDED.contents_total,
      stories_total = EXCLUDED.stories_total,
      raw_24h = EXCLUDED.raw_24h,
      contents_24h = EXCLUDED.contents_24h,
      stories_24h = EXCLUDED.stories_24h,
      last_raw_at = EXCLUDED.last_raw_at,
      last_content_at = EXCLUDED.last_content_at,
      last_story_at = EXCLUDED.last_story_at,
      updated_at = EXCLUDED.updated_at;
  END IF;
END;
$$;

-- =============================================================================
-- TRIGGER FUNCTION SECURITY
-- =============================================================================

-- Fix tg_refresh_metrics_on_raw_items trigger function
CREATE OR REPLACE FUNCTION public.tg_refresh_metrics_on_raw_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.refresh_source_metrics(NEW.source_id);
  RETURN NULL;
END;
$$;

-- Fix tg_refresh_metrics_on_contents trigger function
CREATE OR REPLACE FUNCTION public.tg_refresh_metrics_on_contents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  _sid uuid;
BEGIN
  SELECT r.source_id INTO _sid
  FROM public.raw_items r
  WHERE r.id = NEW.raw_item_id;

  IF _sid IS NOT NULL THEN
    PERFORM public.refresh_source_metrics(_sid);
  END IF;

  RETURN NULL;
END;
$$;

-- Fix tg_refresh_metrics_on_stories trigger function
CREATE OR REPLACE FUNCTION public.tg_refresh_metrics_on_stories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  _sid uuid;
BEGIN
  SELECT r.source_id INTO _sid
  FROM public.raw_items r
  JOIN public.contents c ON c.id = NEW.content_id AND c.raw_item_id = r.id;

  IF _sid IS NOT NULL THEN
    PERFORM public.refresh_source_metrics(_sid);
  END IF;

  RETURN NULL;
END;
$$;

-- =============================================================================
-- SECURITY VERIFICATION
-- =============================================================================

-- Verify all functions now have secure search_path settings
DO $$
DECLARE
    func_record RECORD;
    insecure_count INTEGER := 0;
BEGIN
    -- Check for functions without search_path = ''
    FOR func_record IN
        SELECT proname, prosecdef
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN ('is_admin_user', 'is_worker_role', 'handle_new_user',
                           'get_youtube_sources', 'refresh_source_metrics',
                           'tg_refresh_metrics_on_raw_items', 'tg_refresh_metrics_on_contents',
                           'tg_refresh_metrics_on_stories')
          AND (p.proconfig IS NULL OR NOT ('search_path=""') = ANY(p.proconfig))
    LOOP
        RAISE WARNING 'Function % still has insecure search_path', func_record.proname;
        insecure_count := insecure_count + 1;
    END LOOP;

    IF insecure_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All critical functions now have secure search_path settings';
    ELSE
        RAISE EXCEPTION 'SECURITY ERROR: % functions still have insecure search_path settings', insecure_count;
    END IF;
END;
$$;

-- =============================================================================
-- SECURITY NOTES
-- =============================================================================

-- Security improvements in this migration:
-- 1. Added SET search_path = '' to all SECURITY DEFINER functions
-- 2. Fully qualified all object names (public.table_name)
-- 3. Changed non-critical functions from SECURITY DEFINER to SECURITY INVOKER
-- 4. Maintained identical functionality while improving security posture
--
-- Functions changed to SECURITY INVOKER (safer default):
-- - get_youtube_sources: Data access function, doesn't need elevated privileges
-- - refresh_source_metrics: Metrics function, can run with caller's privileges
-- - All trigger functions: Run in trigger context, don't need DEFINER privileges
--
-- Functions kept as SECURITY DEFINER (required for functionality):
-- - is_admin_user: Needs to access users table for RLS policies
-- - is_worker_role: Needs to check current_user for RLS policies
-- - handle_new_user: Needs to insert into users table from auth trigger
--
-- Expected security improvements:
-- - Prevents search path manipulation attacks
-- - Eliminates privilege escalation vulnerabilities
-- - Ensures predictable object resolution in all functions
-- - Maintains principle of least privilege
