-- ROLLBACK MIGRATION: Revert RLS optimizations to original state
-- This migration reverts the RLS policy optimizations back to the original
-- implementation if issues are discovered after applying the optimizations.
--
-- WARNING: Only apply this rollback if the optimizations cause issues.
-- The optimizations should maintain identical security behavior.
--
-- This rollback restores:
-- 1. Original auth function usage patterns in RLS policies
-- 2. Original multiple permissive policies structure
-- 3. Original is_admin_user function implementation

-- =============================================================================
-- ROLLBACK HELPER FUNCTIONS
-- =============================================================================

-- Restore original is_admin_user function (without optimization)
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

-- Remove optimized helper function
DROP FUNCTION IF EXISTS public.is_worker_role();

-- =============================================================================
-- ROLLBACK USERS TABLE POLICIES
-- =============================================================================

-- Drop optimized policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- Restore original policies
CREATE POLICY "Can view own user data." ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Can update own user data." ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- =============================================================================
-- ROLLBACK SUBSCRIPTIONS TABLE POLICIES
-- =============================================================================

-- Drop optimized policy
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;

-- Restore original policy
CREATE POLICY "Can only view own subs data." ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- ROLLBACK HIGHLIGHTS TABLE POLICIES
-- =============================================================================

-- Drop optimized policies
DROP POLICY IF EXISTS "highlights_select_own" ON public.highlights;
DROP POLICY IF EXISTS "highlights_insert_own" ON public.highlights;
DROP POLICY IF EXISTS "highlights_update_own" ON public.highlights;
DROP POLICY IF EXISTS "highlights_delete_own" ON public.highlights;

-- Restore original combined policy
CREATE POLICY "highlights_owner_all" ON public.highlights
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- ROLLBACK ADMIN TABLES POLICIES
-- =============================================================================

-- Rollback source_metrics
DROP POLICY IF EXISTS "source_metrics_admin_select" ON public.source_metrics;
CREATE POLICY "source_metrics_admin_select" ON public.source_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

-- Rollback platform_quota
DROP POLICY IF EXISTS "platform_quota_admin_select" ON public.platform_quota;
DROP POLICY IF EXISTS "platform_quota_worker_all" ON public.platform_quota;

CREATE POLICY "platform_quota_admin_select" ON public.platform_quota
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

-- Restore original worker policies for platform_quota
CREATE POLICY "platform_quota_worker_insert" ON public.platform_quota
  FOR INSERT TO worker
  WITH CHECK (true);

CREATE POLICY "platform_quota_worker_update" ON public.platform_quota
  FOR UPDATE TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "platform_quota_worker_select" ON public.platform_quota
  FOR SELECT TO worker
  USING (true);

-- Rollback source_health
DROP POLICY IF EXISTS "source_health_admin_select" ON public.source_health;
DROP POLICY IF EXISTS "source_health_worker_all" ON public.source_health;

CREATE POLICY "source_health_admin_select" ON public.source_health
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

-- Restore original worker policies for source_health
CREATE POLICY "source_health_worker_insert" ON public.source_health
  FOR INSERT TO worker
  WITH CHECK (true);

CREATE POLICY "source_health_worker_update" ON public.source_health
  FOR UPDATE TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "source_health_worker_select" ON public.source_health
  FOR SELECT TO worker
  USING (true);

-- Rollback job_metrics
DROP POLICY IF EXISTS "job_metrics_admin_select" ON public.job_metrics;
DROP POLICY IF EXISTS "job_metrics_worker_all" ON public.job_metrics;

CREATE POLICY "job_metrics_admin_select" ON public.job_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

-- Restore original worker policies for job_metrics
CREATE POLICY "job_metrics_worker_insert" ON public.job_metrics
  FOR INSERT TO worker
  WITH CHECK (true);

CREATE POLICY "job_metrics_worker_update" ON public.job_metrics
  FOR UPDATE TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "job_metrics_worker_select" ON public.job_metrics
  FOR SELECT TO worker
  USING (true);

-- =============================================================================
-- ROLLBACK CONTENT PIPELINE TABLES POLICIES
-- =============================================================================

-- Rollback clusters table
DROP POLICY IF EXISTS "clusters_select_consolidated" ON public.clusters;
DROP POLICY IF EXISTS "clusters_insert_consolidated" ON public.clusters;
DROP POLICY IF EXISTS "clusters_update_consolidated" ON public.clusters;
DROP POLICY IF EXISTS "clusters_delete_consolidated" ON public.clusters;

-- Restore original separate policies for clusters
CREATE POLICY "clusters_admin_all" ON public.clusters
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "clusters_worker_all" ON public.clusters
  FOR ALL TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clusters_authenticated_read" ON public.clusters
  FOR SELECT TO authenticated
  USING (true);

-- Rollback contents table
DROP POLICY IF EXISTS "contents_select_consolidated" ON public.contents;
DROP POLICY IF EXISTS "contents_insert_consolidated" ON public.contents;
DROP POLICY IF EXISTS "contents_update_consolidated" ON public.contents;
DROP POLICY IF EXISTS "contents_delete_consolidated" ON public.contents;

-- Restore original separate policies for contents
CREATE POLICY "contents_admin_all" ON public.contents
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "contents_worker_all" ON public.contents
  FOR ALL TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "contents_authenticated_read" ON public.contents
  FOR SELECT TO authenticated
  USING (true);

-- Rollback sources table
DROP POLICY IF EXISTS "sources_select_consolidated" ON public.sources;
DROP POLICY IF EXISTS "sources_insert_consolidated" ON public.sources;
DROP POLICY IF EXISTS "sources_update_consolidated" ON public.sources;
DROP POLICY IF EXISTS "sources_delete_consolidated" ON public.sources;

-- Restore original separate policies for sources
CREATE POLICY "sources_admin_all" ON public.sources
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "sources_worker_all" ON public.sources
  FOR ALL TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "sources_authenticated_read" ON public.sources
  FOR SELECT TO authenticated
  USING (active = true);

-- Rollback stories table
DROP POLICY IF EXISTS "stories_select_consolidated" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_consolidated" ON public.stories;
DROP POLICY IF EXISTS "stories_update_consolidated" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_consolidated" ON public.stories;

-- Restore original separate policies for stories
CREATE POLICY "stories_admin_all" ON public.stories
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "stories_worker_all" ON public.stories
  FOR ALL TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "stories_authenticated_read" ON public.stories
  FOR SELECT TO authenticated
  USING (true);

-- Rollback story_embeddings table
DROP POLICY IF EXISTS "story_embeddings_select_consolidated" ON public.story_embeddings;
DROP POLICY IF EXISTS "story_embeddings_insert_consolidated" ON public.story_embeddings;
DROP POLICY IF EXISTS "story_embeddings_update_consolidated" ON public.story_embeddings;
DROP POLICY IF EXISTS "story_embeddings_delete_consolidated" ON public.story_embeddings;

-- Restore original separate policies for story_embeddings
CREATE POLICY "story_embeddings_admin_all" ON public.story_embeddings
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "story_embeddings_worker_all" ON public.story_embeddings
  FOR ALL TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "story_embeddings_authenticated_read" ON public.story_embeddings
  FOR SELECT TO authenticated
  USING (true);

-- Rollback story_overlays table
DROP POLICY IF EXISTS "story_overlays_select_consolidated" ON public.story_overlays;
DROP POLICY IF EXISTS "story_overlays_insert_consolidated" ON public.story_overlays;
DROP POLICY IF EXISTS "story_overlays_update_consolidated" ON public.story_overlays;
DROP POLICY IF EXISTS "story_overlays_delete_consolidated" ON public.story_overlays;

-- Restore original separate policies for story_overlays
CREATE POLICY "story_overlays_admin_all" ON public.story_overlays
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "story_overlays_worker_all" ON public.story_overlays
  FOR ALL TO worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY "story_overlays_authenticated_read" ON public.story_overlays
  FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- ROLLBACK COMPLETE
-- =============================================================================

-- This rollback migration restores the original RLS policy structure
-- with the following characteristics:
-- 1. Direct auth.uid() calls in policies (less optimized but original behavior)
-- 2. Multiple separate permissive policies per table (original structure)
-- 3. Original is_admin_user function without optimization
--
-- Apply this migration only if the optimizations cause issues.
-- The original structure should work identically but with potentially
-- lower performance for large result sets.
