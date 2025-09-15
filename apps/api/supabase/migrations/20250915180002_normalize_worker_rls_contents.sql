BEGIN;

-- Ensure RLS is on
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Remove consolidated, current_user-based policies if present
DROP POLICY IF EXISTS "contents_insert_consolidated" ON public.contents;
DROP POLICY IF EXISTS "contents_update_consolidated" ON public.contents;
DROP POLICY IF EXISTS "contents_delete_consolidated" ON public.contents;

-- Recreate a single, unconditional worker policy (role-targeted)
DROP POLICY IF EXISTS "contents_worker_all" ON public.contents;
CREATE POLICY "contents_worker_all"
ON public.contents
FOR ALL
TO worker
USING (true)
WITH CHECK (true);

-- Keep authenticated read (create if missing)
DO $$
BEGIN
BEGIN
CREATE POLICY "contents_authenticated_read"
ON public.contents
FOR SELECT
TO authenticated
USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Keep admin all (create if missing)
DO $$
BEGIN
BEGIN
CREATE POLICY "contents_admin_all"
ON public.contents
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

COMMIT;