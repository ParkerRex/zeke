-- Quota, Source Health, Job Metrics (Realtime)

-- Platform quota snapshot
create table if not exists public.platform_quota (
  provider text primary key,
  quota_limit int,
  used int,
  remaining int,
  reset_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.platform_quota enable row level security;
do $$ begin
  begin
    create policy platform_quota_admin_select on public.platform_quota for select using (
      exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true)
    );
  exception when duplicate_object then null; end;
end $$;

-- Source health snapshot
do $$ begin
  begin
    create type public.health_status as enum ('ok','warn','error');
  exception when duplicate_object then null; end;
end $$;
create table if not exists public.source_health (
  source_id uuid primary key references public.sources(id) on delete cascade,
  status public.health_status not null default 'ok',
  last_success_at timestamptz,
  last_error_at timestamptz,
  error_24h int default 0,
  message text,
  updated_at timestamptz not null default now()
);
alter table public.source_health enable row level security;
do $$ begin
  begin
    create policy source_health_admin_select on public.source_health for select using (
      exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true)
    );
  exception when duplicate_object then null; end;
end $$;

-- Job metrics mirror
create table if not exists public.job_metrics (
  name text not null,
  state text not null,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (name, state)
);
alter table public.job_metrics enable row level security;
do $$ begin
  begin
    create policy job_metrics_admin_select on public.job_metrics for select using (
      exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true)
    );
  exception when duplicate_object then null; end;
end $$;

-- Add to realtime publication
do $$ begin
  begin
    alter publication supabase_realtime add table public.platform_quota, public.source_health, public.job_metrics;
  exception when undefined_object then null; end;
end $$;
