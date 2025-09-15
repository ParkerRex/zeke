-- Fix worker RLS access to contents table
-- The issue is that the worker role needs explicit bypass or the function needs to work correctly

-- Option 1: Create a more permissive policy specifically for the worker role
-- This bypasses the function check and directly allows worker role
DROP POLICY IF EXISTS "contents_insert_consolidated" ON public.contents;
CREATE POLICY "contents_insert_consolidated" ON public.contents
  FOR INSERT TO authenticated, worker
  WITH CHECK (
    public.is_admin_user() OR
    current_user = 'worker'  -- Direct role check instead of function
  );

DROP POLICY IF EXISTS "contents_update_consolidated" ON public.contents;
CREATE POLICY "contents_update_consolidated" ON public.contents
  FOR UPDATE TO authenticated, worker
  USING (
    public.is_admin_user() OR
    current_user = 'worker'
  )
  WITH CHECK (
    public.is_admin_user() OR
    current_user = 'worker'
  );

DROP POLICY IF EXISTS "contents_delete_consolidated" ON public.contents;
CREATE POLICY "contents_delete_consolidated" ON public.contents
  FOR DELETE TO authenticated, worker
  USING (
    public.is_admin_user() OR
    current_user = 'worker'
  );

-- Ensure the is_worker_role function is working correctly
CREATE OR REPLACE FUNCTION public.is_worker_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT current_user = 'worker';
$$;

-- Grant explicit permissions to worker role on contents table (belt and suspenders)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contents TO worker;