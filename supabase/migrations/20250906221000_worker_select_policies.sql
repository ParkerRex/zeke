-- Allow 'worker' to SELECT rows from admin realtime tables for upsert flows
-- (ON CONFLICT DO UPDATE requires row visibility under RLS semantics)

do $$ begin
  begin
    create policy platform_quota_worker_select on public.platform_quota
      for select to worker using (true);
  exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin
    create policy source_health_worker_select on public.source_health
      for select to worker using (true);
  exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin
    create policy job_metrics_worker_select on public.job_metrics
      for select to worker using (true);
  exception when duplicate_object then null; end;
end $$;

