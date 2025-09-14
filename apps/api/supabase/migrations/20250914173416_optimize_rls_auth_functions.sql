-- Optimize RLS policies to fix auth function re-evaluation performance issues
-- This addresses Supabase Performance Advisor warnings about auth.<function>() calls
-- being re-evaluated for each row instead of once per query
--
-- Performance Issue: RLS policies using auth.uid() directly cause the function
-- to be called for every row being evaluated, which is inefficient for large result sets.
-- 
-- Solution: Replace auth.<function>() with (select auth.<function>()) to ensure
-- the function is evaluated once per query and cached for all rows.
--
-- Security Impact: NONE - This is a performance optimization that maintains
-- identical security behavior and access control.

-- =============================================================================
-- USERS TABLE OPTIMIZATION
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Can view own user data." ON public.users;
DROP POLICY IF EXISTS "Can update own user data." ON public.users;

-- Recreate with optimized auth function calls
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- =============================================================================
-- SUBSCRIPTIONS TABLE OPTIMIZATION
-- =============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Can only view own subs data." ON public.subscriptions;

-- Recreate with optimized auth function call
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- HIGHLIGHTS TABLE OPTIMIZATION
-- =============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "highlights_owner_all" ON public.highlights;

-- Recreate with optimized auth function calls
CREATE POLICY "highlights_select_own" ON public.highlights
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "highlights_insert_own" ON public.highlights
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "highlights_update_own" ON public.highlights
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "highlights_delete_own" ON public.highlights
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- ADMIN TABLES OPTIMIZATION (source_metrics, platform_quota, source_health, job_metrics)
-- =============================================================================

-- Update is_admin_user function to use cached auth.uid()
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = (SELECT auth.uid())),
    false
  );
$$;

-- Drop existing admin policies for source_metrics
DROP POLICY IF EXISTS "source_metrics_admin_select" ON public.source_metrics;

-- Recreate with direct function call (function is now optimized internally)
CREATE POLICY "source_metrics_admin_select" ON public.source_metrics
  FOR SELECT TO authenticated
  USING (public.is_admin_user());

-- Drop existing admin policies for platform_quota
DROP POLICY IF EXISTS "platform_quota_admin_select" ON public.platform_quota;

-- Recreate with direct function call
CREATE POLICY "platform_quota_admin_select" ON public.platform_quota
  FOR SELECT TO authenticated
  USING (public.is_admin_user());

-- Drop existing admin policies for source_health
DROP POLICY IF EXISTS "source_health_admin_select" ON public.source_health;

-- Recreate with direct function call
CREATE POLICY "source_health_admin_select" ON public.source_health
  FOR SELECT TO authenticated
  USING (public.is_admin_user());

-- Drop existing admin policies for job_metrics
DROP POLICY IF EXISTS "job_metrics_admin_select" ON public.job_metrics;

-- Recreate with direct function call
CREATE POLICY "job_metrics_admin_select" ON public.job_metrics
  FOR SELECT TO authenticated
  USING (public.is_admin_user());

-- =============================================================================
-- PERFORMANCE NOTES
-- =============================================================================

-- The optimizations in this migration:
-- 1. Replace direct auth.uid() calls with (SELECT auth.uid()) in RLS policies
-- 2. Update is_admin_user() function to cache auth.uid() result internally
-- 3. Split combined policies into granular SELECT/INSERT/UPDATE/DELETE policies
--
-- Expected performance improvements:
-- - Reduced function call overhead for large result sets
-- - Better query plan optimization due to stable function evaluation
-- - Improved cache utilization for auth context
--
-- Security verification:
-- - All policies maintain identical access control logic
-- - No changes to who can access what data
-- - Function security context preserved (SECURITY DEFINER)
