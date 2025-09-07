-- Source metrics aggregation + realtime

create table if not exists public.source_metrics (
  source_id uuid primary key references public.sources(id) on delete cascade,
  raw_total int default 0,
  contents_total int default 0,
  stories_total int default 0,
  raw_24h int default 0,
  contents_24h int default 0,
  stories_24h int default 0,
  last_raw_at timestamptz,
  last_content_at timestamptz,
  last_story_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.source_metrics enable row level security;

-- Admins only can select metrics
do $$ begin
  begin
    create policy source_metrics_admin_select on public.source_metrics
      for select using (
        exists (
          select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true
        )
      );
  exception when duplicate_object then null; end;
end $$;

-- Function to refresh metrics for one/all sources
create or replace function public.refresh_source_metrics(_source_id uuid default null)
returns void
language plpgsql as $$
begin
  if _source_id is null then
    -- Recompute for all sources
    insert into public.source_metrics as m (
      source_id,
      raw_total,
      contents_total,
      stories_total,
      raw_24h,
      contents_24h,
      stories_24h,
      last_raw_at,
      last_content_at,
      last_story_at,
      updated_at
    )
    select s.id,
      coalesce((select count(*) from public.raw_items r where r.source_id = s.id), 0) as raw_total,
      coalesce((select count(*) from public.contents c join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id), 0) as contents_total,
      coalesce((select count(*) from public.stories st join public.contents c on c.id = st.content_id join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id), 0) as stories_total,
      coalesce((select count(*) from public.raw_items r where r.source_id = s.id and r.discovered_at > now() - interval '24 hours'), 0) as raw_24h,
      coalesce((select count(*) from public.contents c join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id and c.extracted_at > now() - interval '24 hours'), 0) as contents_24h,
      coalesce((select count(*) from public.stories st join public.contents c on c.id = st.content_id join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id and st.created_at > now() - interval '24 hours'), 0) as stories_24h,
      (select max(discovered_at) from public.raw_items r where r.source_id = s.id) as last_raw_at,
      (select max(extracted_at) from public.contents c join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id) as last_content_at,
      (select max(st.created_at) from public.stories st join public.contents c on c.id = st.content_id join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id) as last_story_at,
      now()
    from public.sources s
    on conflict (source_id) do update set
      raw_total = excluded.raw_total,
      contents_total = excluded.contents_total,
      stories_total = excluded.stories_total,
      raw_24h = excluded.raw_24h,
      contents_24h = excluded.contents_24h,
      stories_24h = excluded.stories_24h,
      last_raw_at = excluded.last_raw_at,
      last_content_at = excluded.last_content_at,
      last_story_at = excluded.last_story_at,
      updated_at = excluded.updated_at;
  else
    -- Recompute for one source
    insert into public.source_metrics as m (
      source_id, raw_total, contents_total, stories_total, raw_24h, contents_24h, stories_24h, last_raw_at, last_content_at, last_story_at, updated_at
    )
    select s.id,
      coalesce((select count(*) from public.raw_items r where r.source_id = s.id), 0),
      coalesce((select count(*) from public.contents c join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id), 0),
      coalesce((select count(*) from public.stories st join public.contents c on c.id = st.content_id join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id), 0),
      coalesce((select count(*) from public.raw_items r where r.source_id = s.id and r.discovered_at > now() - interval '24 hours'), 0),
      coalesce((select count(*) from public.contents c join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id and c.extracted_at > now() - interval '24 hours'), 0),
      coalesce((select count(*) from public.stories st join public.contents c on c.id = st.content_id join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id and st.created_at > now() - interval '24 hours'), 0),
      (select max(discovered_at) from public.raw_items r where r.source_id = s.id),
      (select max(extracted_at) from public.contents c join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id),
      (select max(st.created_at) from public.stories st join public.contents c on c.id = st.content_id join public.raw_items r on r.id = c.raw_item_id where r.source_id = s.id),
      now()
    from public.sources s where s.id = _source_id
    on conflict (source_id) do update set
      raw_total = excluded.raw_total,
      contents_total = excluded.contents_total,
      stories_total = excluded.stories_total,
      raw_24h = excluded.raw_24h,
      contents_24h = excluded.contents_24h,
      stories_24h = excluded.stories_24h,
      last_raw_at = excluded.last_raw_at,
      last_content_at = excluded.last_content_at,
      last_story_at = excluded.last_story_at,
      updated_at = excluded.updated_at;
  end if;
end;
$$;

-- Trigger functions to refresh per source slice
create or replace function public.tg_refresh_metrics_on_raw_items()
returns trigger language plpgsql as $$
begin
  perform public.refresh_source_metrics(NEW.source_id);
  return null;
end;$$;

create or replace function public.tg_refresh_metrics_on_contents()
returns trigger language plpgsql as $$
declare _sid uuid; begin
  select r.source_id into _sid from public.raw_items r where r.id = NEW.raw_item_id;
  if _sid is not null then perform public.refresh_source_metrics(_sid); end if;
  return null; end;$$;

create or replace function public.tg_refresh_metrics_on_stories()
returns trigger language plpgsql as $$
declare _sid uuid; begin
  select r.source_id into _sid from public.raw_items r join public.contents c on c.id = NEW.content_id and c.raw_item_id = r.id;
  if _sid is not null then perform public.refresh_source_metrics(_sid); end if;
  return null; end;$$;

drop trigger if exists tr_refresh_metrics_raw_items on public.raw_items;
create trigger tr_refresh_metrics_raw_items after insert on public.raw_items for each row execute procedure public.tg_refresh_metrics_on_raw_items();

drop trigger if exists tr_refresh_metrics_contents on public.contents;
create trigger tr_refresh_metrics_contents after insert on public.contents for each row execute procedure public.tg_refresh_metrics_on_contents();

drop trigger if exists tr_refresh_metrics_stories on public.stories;
create trigger tr_refresh_metrics_stories after insert on public.stories for each row execute procedure public.tg_refresh_metrics_on_stories();

-- Add table to realtime publication
do $$ begin
  begin
    alter publication supabase_realtime add table public.source_metrics;
  exception when undefined_object then null; end;
end $$;

