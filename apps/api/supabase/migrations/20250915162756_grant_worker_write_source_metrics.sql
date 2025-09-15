  -- Allow worker to insert/update source_metrics under RLS
  -- File: apps/api/supabase/migrations/_grant_worker_write_source_metrics.sql

  BEGIN;

  -- Ensure RLS is enabled (no-op if already enabled)
  ALTER TABLE public.source_metrics ENABLE ROW LEVEL SECURITY;

  -- Grant only the privileges the worker needs (no SELECT/DELETE)
  GRANT INSERT, UPDATE ON public.source_metrics TO worker;

  -- Clean up any previous worker policiepnpm db:migrates to avoid duplicates
  DROP POLICY IF EXISTS "source_metrics_worker_insert" ON public.source_metrics;
  DROP POLICY IF EXISTS "source_metrics_worker_update" ON public.source_metrics;

  -- Permit worker inserts (row check always true; table privileges still control access)
  CREATE POLICY "source_metrics_worker_insert"
  ON public.source_metrics
  FOR INSERT
  TO worker
  WITH CHECK (true);

  -- Permit worker updates
  CREATE POLICY "source_metrics_worker_update"
  ON public.source_metrics
  FOR UPDATE
  TO worker
  USING (true)
  WITH CHECK (true);

  COMMIT;