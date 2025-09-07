-- Allow 'worker' DB role to insert/update admin realtime tables under RLS
-- Safe to reapply: each CREATE POLICY is wrapped to ignore duplicates.

-- platform_quota: permit worker to insert/update
do $$ begin
  begin
    create policy platform_quota_worker_insert on public.platform_quota
      for insert to worker with check (true);
  exception when duplicate_object then null; end;
  begin
    create policy platform_quota_worker_update on public.platform_quota
      for update to worker using (true) with check (true);
  exception when duplicate_object then null; end;
end $$;

-- source_health: permit worker to insert/update
do $$ begin
  begin
    create policy source_health_worker_insert on public.source_health
      for insert to worker with check (true);
  exception when duplicate_object then null; end;
  begin
    create policy source_health_worker_update on public.source_health
      for update to worker using (true) with check (true);
  exception when duplicate_object then null; end;
end $$;

-- job_metrics: permit worker to insert/update
do $$ begin
  begin
    create policy job_metrics_worker_insert on public.job_metrics
      for insert to worker with check (true);
  exception when duplicate_object then null; end;
  begin
    create policy job_metrics_worker_update on public.job_metrics
      for update to worker using (true) with check (true);
  exception when duplicate_object then null; end;
end $$;

