-- Enable Row Level Security (RLS) for content pipeline tables
-- This addresses Supabase security advisor warnings while maintaining functionality
--
-- Security Strategy:
-- 1. Stories/Content: Public read access for authenticated users (news platform)
-- 2. Raw pipeline data: Admin and worker access only (sensitive ingestion data)
-- 3. Admin users: Full access to all tables
-- 4. Worker role: Pipeline access for ingestion processes

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- =============================================================================
-- ENABLE RLS ON ALL CONTENT PIPELINE TABLES
-- =============================================================================

-- Enable RLS on sources table
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- Enable RLS on raw_items table
ALTER TABLE public.raw_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contents table
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on stories table
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on clusters table
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;

-- Enable RLS on story_overlays table
ALTER TABLE public.story_overlays ENABLE ROW LEVEL SECURITY;

-- Enable RLS on story_embeddings table
ALTER TABLE public.story_embeddings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SOURCES TABLE POLICIES
-- =============================================================================

-- Admin users can do everything with sources
DO $$ BEGIN
  BEGIN
    CREATE POLICY "sources_admin_all" ON public.sources
      FOR ALL TO authenticated
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user());
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Worker role can read/write sources for pipeline operations
DO $$ BEGIN
  BEGIN
    CREATE POLICY "sources_worker_all" ON public.sources
      FOR ALL TO worker
      USING (true)
      WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Authenticated users can read active sources (for UI dropdowns, etc.)
DO $$ BEGIN
  BEGIN
    CREATE POLICY "sources_authenticated_read" ON public.sources
      FOR SELECT TO authenticated
      USING (active = true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================================================
-- RAW_ITEMS TABLE POLICIES (Sensitive pipeline data - restricted access)
-- =============================================================================

-- Admin users can do everything with raw_items
DO $$ BEGIN
  BEGIN
    CREATE POLICY "raw_items_admin_all" ON public.raw_items
      FOR ALL TO authenticated
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user());
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Worker role can read/write raw_items for pipeline operations
DO $$ BEGIN
  BEGIN
    CREATE POLICY "raw_items_worker_all" ON public.raw_items
      FOR ALL TO worker
      USING (true)
      WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================================================
-- CONTENTS TABLE POLICIES (Processed content - authenticated read access)
-- =============================================================================

-- Admin users can do everything with contents
DO $$ BEGIN
  BEGIN
    CREATE POLICY "contents_admin_all" ON public.contents
      FOR ALL TO authenticated
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user());
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Worker role can read/write contents for pipeline operations
DO $$ BEGIN
  BEGIN
    CREATE POLICY "contents_worker_all" ON public.contents
      FOR ALL TO worker
      USING (true)
      WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Authenticated users can read contents (needed for story display)
DO $$ BEGIN
  BEGIN
    CREATE POLICY "contents_authenticated_read" ON public.contents
      FOR SELECT TO authenticated
      USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================================================
-- STORIES TABLE POLICIES (Public content - authenticated read access)
-- =============================================================================

-- Admin users can do everything with stories
DO $$ BEGIN
  BEGIN
    CREATE POLICY "stories_admin_all" ON public.stories
      FOR ALL TO authenticated
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user());
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Worker role can read/write stories for pipeline operations
DO $$ BEGIN
  BEGIN
    CREATE POLICY "stories_worker_all" ON public.stories
      FOR ALL TO worker
      USING (true)
      WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Authenticated users can read stories (core app functionality)
DO $$ BEGIN
  BEGIN
    CREATE POLICY "stories_authenticated_read" ON public.stories
      FOR SELECT TO authenticated
      USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================================================
-- CLUSTERS TABLE POLICIES (Story grouping - authenticated read access)
-- =============================================================================

-- Admin users can do everything with clusters
DO $$ BEGIN
  BEGIN
    CREATE POLICY "clusters_admin_all" ON public.clusters
      FOR ALL TO authenticated
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user());
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Worker role can read/write clusters for pipeline operations
DO $$ BEGIN
  BEGIN
    CREATE POLICY "clusters_worker_all" ON public.clusters
      FOR ALL TO worker
      USING (true)
      WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Authenticated users can read clusters (for story grouping UI)
DO $$ BEGIN
  BEGIN
    CREATE POLICY "clusters_authenticated_read" ON public.clusters
      FOR SELECT TO authenticated
      USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================================================
-- STORY_OVERLAYS TABLE POLICIES (AI analysis - authenticated read access)
-- =============================================================================

-- Admin users can do everything with story_overlays
DO $$ BEGIN
  BEGIN
    CREATE POLICY "story_overlays_admin_all" ON public.story_overlays
      FOR ALL TO authenticated
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user());
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Worker role can read/write story_overlays for AI analysis
DO $$ BEGIN
  BEGIN
    CREATE POLICY "story_overlays_worker_all" ON public.story_overlays
      FOR ALL TO worker
      USING (true)
      WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Authenticated users can read story_overlays (for AI insights display)
DO $$ BEGIN
  BEGIN
    CREATE POLICY "story_overlays_authenticated_read" ON public.story_overlays
      FOR SELECT TO authenticated
      USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================================================
-- STORY_EMBEDDINGS TABLE POLICIES (Vector data - restricted access)
-- =============================================================================

-- Admin users can do everything with story_embeddings
DO $$ BEGIN
  BEGIN
    CREATE POLICY "story_embeddings_admin_all" ON public.story_embeddings
      FOR ALL TO authenticated
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user());
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Worker role can read/write story_embeddings for AI processing
DO $$ BEGIN
  BEGIN
    CREATE POLICY "story_embeddings_worker_all" ON public.story_embeddings
      FOR ALL TO worker
      USING (true)
      WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Authenticated users can read story_embeddings (for similarity search)
DO $$ BEGIN
  BEGIN
    CREATE POLICY "story_embeddings_authenticated_read" ON public.story_embeddings
      FOR SELECT TO authenticated
      USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================================================
-- SECURITY DOCUMENTATION
-- =============================================================================

-- This migration implements a balanced RLS strategy:
--
-- 1. **Admin Access**: Users with is_admin=true have full access to all tables
-- 2. **Worker Access**: The 'worker' role has full pipeline access for ingestion
-- 3. **User Access Levels**:
--    - Stories/Content/Overlays: Full read access (public news content)
--    - Sources: Read active sources only (for UI functionality)
--    - Raw Items: No access (sensitive pipeline data)
--    - Embeddings: Read access (for search functionality)
--    - Clusters: Read access (for story grouping)
--
-- 4. **Security Benefits**:
--    - Prevents unauthorized external access via PostgREST
--    - Maintains application functionality for authenticated users
--    - Protects sensitive pipeline data (raw_items)
--    - Allows admin oversight and worker automation
--
-- 5. **Application Impact**:
--    - Existing queries using supabaseAdminClient will continue to work
--    - New user-scoped queries will respect these policies
--    - Worker processes maintain full pipeline access
--    - Admin users retain full system access