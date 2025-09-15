-- Add missing SELECT policy for worker on source_metrics table
-- This is required for ON CONFLICT DO UPDATE operations in refresh_source_metrics function

BEGIN;

-- Add SELECT policy for worker on source_metrics
-- This allows the worker to read existing rows for ON CONFLICT DO UPDATE operations
DO $$ BEGIN
  BEGIN
    CREATE POLICY "source_metrics_worker_select" ON public.source_metrics
      FOR SELECT TO worker
      USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

COMMIT;
