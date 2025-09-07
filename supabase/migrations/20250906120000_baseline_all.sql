-- Baseline schema (squashed pre-launch)
-- Includes: auth-linked users/customers/billing, content pipeline (sources/raw_items/contents/stories), YouTube fields, RLS, indexes, and pg-boss setup.

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- USERS (linked to auth.users)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  billing_address jsonb,
  payment_method jsonb,
  is_admin boolean not null default false
);
alter table public.users enable row level security;
do $$ begin
  begin
    create policy "Can view own user data." on public.users for select using (auth.uid() = id);
  exception when duplicate_object then null; end;
  begin
    create policy "Can update own user data." on public.users for update using (auth.uid() = id);
  exception when duplicate_object then null; end;
end $$;

-- Auto-provision user row on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- CUSTOMERS (Stripe mapping)
create table if not exists public.customers (
  id uuid references auth.users not null primary key,
  stripe_customer_id text
);
alter table public.customers enable row level security;

-- PRODUCTS
create table if not exists public.products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);
alter table public.products enable row level security;
do $$ begin
  begin
    create policy "Allow public read-only access." on public.products for select using (true);
  exception when duplicate_object then null; end;
end $$;

-- PRICES
do $$ begin
  begin
    create type public.pricing_type as enum ('one_time', 'recurring');
  exception when duplicate_object then null; end;
  begin
    create type public.pricing_plan_interval as enum ('day', 'week', 'month', 'year');
  exception when duplicate_object then null; end;
end $$;
create table if not exists public.prices (
  id text primary key,
  product_id text references public.products,
  active boolean,
  description text,
  unit_amount bigint,
  currency text check (char_length(currency) = 3),
  type public.pricing_type,
  interval public.pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);
alter table public.prices enable row level security;
do $$ begin
  begin
    create policy "Allow public read-only access." on public.prices for select using (true);
  exception when duplicate_object then null; end;
end $$;

-- SUBSCRIPTIONS
do $$ begin
  begin
    create type public.subscription_status as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
  exception when duplicate_object then null; end;
end $$;
create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid references auth.users not null,
  status public.subscription_status,
  metadata jsonb,
  price_id text references public.prices,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamptz not null default timezone('utc'::text, now()),
  current_period_start timestamptz not null default timezone('utc'::text, now()),
  current_period_end timestamptz not null default timezone('utc'::text, now()),
  ended_at timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz
);
alter table public.subscriptions enable row level security;
do $$ begin
  begin
    create policy "Can only view own subs data." on public.subscriptions for select using (auth.uid() = user_id);
  exception when duplicate_object then null; end;
end $$;

-- Realtime publications (public tables only)
drop publication if exists supabase_realtime;
create publication supabase_realtime for table public.products, public.prices;

-- CONTENT PIPELINE TABLES
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text,
  url text,
  domain text,
  authority_score numeric,
  last_cursor jsonb,
  last_checked timestamptz,
  metadata jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sources enable row level security;

create table if not exists public.raw_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  external_id text not null,
  url text not null,
  kind text,
  title text,
  metadata jsonb,
  discovered_at timestamptz default now(),
  status text,
  error text,
  attempts int default 0
);
create unique index if not exists raw_items_source_external_unique on public.raw_items(source_id, external_id);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  raw_item_id uuid not null references public.raw_items(id) on delete cascade,
  text text,
  html_url text,
  transcript_url text,
  pdf_url text,
  audio_url text,
  duration_seconds integer,
  view_count bigint,
  transcript_vtt text,
  lang text,
  extracted_at timestamptz default now(),
  content_hash text not null
);
create index if not exists contents_content_hash_idx on public.contents(content_hash);
create index if not exists idx_contents_audio_url on public.contents(audio_url) where audio_url is not null;
create index if not exists idx_contents_transcript_url on public.contents(transcript_url) where transcript_url is not null;
create index if not exists idx_contents_transcript_vtt on public.contents(id) where transcript_vtt is not null;
create index if not exists idx_raw_items_youtube on public.raw_items(kind, external_id) where kind = 'youtube';

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null unique references public.contents(id) on delete restrict,
  canonical_url text,
  kind text,
  title text,
  primary_url text,
  published_at timestamptz,
  cluster_key text,
  created_at timestamptz default now()
);
create index if not exists stories_cluster_key_idx on public.stories(cluster_key);

create table if not exists public.clusters (
  cluster_key text primary key,
  representative_story_id uuid references public.stories(id),
  created_at timestamptz default now()
);

create table if not exists public.story_overlays (
  story_id uuid primary key references public.stories(id) on delete cascade,
  why_it_matters text,
  chili int,
  confidence numeric,
  citations jsonb,
  model_version text,
  analyzed_at timestamptz
);

create table if not exists public.story_embeddings (
  story_id uuid primary key references public.stories(id) on delete cascade,
  embedding vector(1536) not null,
  model_version text
);
do $$ begin
  begin
    execute 'create index if not exists story_embeddings_l2_idx on public.story_embeddings using ivfflat (embedding vector_l2_ops) with (lists = 100)';
  exception when others then null; end;
end $$;

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  story_id uuid not null references public.stories(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  span jsonb not null,
  created_at timestamptz default now()
);
create index if not exists highlights_user_idx on public.highlights(user_id);
create index if not exists highlights_story_idx on public.highlights(story_id);
alter table public.highlights enable row level security;
do $$ begin
  begin
    drop policy if exists highlights_owner_all on public.highlights;
    create policy highlights_owner_all on public.highlights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  exception when others then null; end;
end $$;

-- Helpful indexes
create index if not exists raw_items_source_discovered_idx on public.raw_items(source_id, discovered_at desc);
create index if not exists stories_created_idx on public.stories(created_at desc);
create index if not exists stories_published_idx on public.stories(published_at);
create index if not exists clusters_rep_story_idx on public.clusters(representative_story_id);
create index if not exists sources_domain_idx on public.sources(domain);
create index if not exists contents_raw_item_idx on public.contents(raw_item_id);
create index if not exists contents_extracted_idx on public.contents(extracted_at desc);
create index if not exists sources_last_checked_idx on public.sources(last_checked);

-- YouTube-specific metadata constraint and helper
do $$ begin
  begin
    alter table public.sources add constraint check_youtube_metadata
      check ((kind not in ('youtube_channel','youtube_search')) or (metadata is not null and metadata <> '{}'::jsonb));
  exception when duplicate_object then null; end;
end $$;

create or replace function public.get_youtube_sources()
returns table (
  id uuid,
  kind text,
  name text,
  url text,
  domain text,
  metadata jsonb,
  last_cursor jsonb
) language sql as $$
  select id, kind, name, url, domain, metadata, last_cursor
  from public.sources
  where kind in ('youtube_channel','youtube_search') and metadata is not null
$$;

-- pg-boss setup (schema + permissions). Avoid hardcoded passwords.
do $$
begin
  if not exists (select from pg_catalog.pg_roles where rolname = 'worker') then
    create role worker with login;
  end if;
end
$$;

create schema if not exists pgboss;

do $$ begin
  begin
    create type pgboss.job_state as enum ('created','retry','active','completed','cancelled','failed');
  exception when duplicate_object then null; end;
end $$;

create table if not exists pgboss.version (
  version int primary key,
  maintained_on timestamptz,
  cron_on timestamptz,
  monitored_on timestamptz
);

create table if not exists pgboss.queue (
  name text,
  policy text,
  retry_limit int,
  retry_delay int,
  retry_backoff bool,
  expire_seconds int,
  retention_minutes int,
  dead_letter text references pgboss.queue (name),
  partition_name text,
  created_on timestamptz not null default now(),
  updated_on timestamptz not null default now(),
  primary key (name)
);

create table if not exists pgboss.schedule (
  name text references pgboss.queue on delete cascade,
  cron text not null,
  timezone text,
  data jsonb,
  options jsonb,
  created_on timestamptz not null default now(),
  updated_on timestamptz not null default now(),
  primary key (name)
);

create table if not exists pgboss.subscription (
  event text not null,
  name text not null references pgboss.queue on delete cascade,
  created_on timestamptz not null default now(),
  updated_on timestamptz not null default now(),
  primary key(event, name)
);

create table if not exists pgboss.job (
  id uuid not null default gen_random_uuid(),
  name text not null,
  priority integer not null default(0),
  data jsonb,
  state pgboss.job_state not null default('created'),
  retry_limit integer not null default(2),
  retry_count integer not null default(0),
  retry_delay integer not null default(0),
  retry_backoff boolean not null default false,
  start_after timestamptz not null default now(),
  started_on timestamptz,
  singleton_key text,
  singleton_on timestamp without time zone,
  expire_in interval not null default interval '15 minutes',
  created_on timestamptz not null default now(),
  completed_on timestamptz,
  keep_until timestamptz not null default now() + interval '14 days',
  output jsonb,
  dead_letter text,
  policy text,
  primary key (name, id)
) partition by list (name);

create table if not exists pgboss.archive (like pgboss.job);
alter table pgboss.archive add column if not exists archived_on timestamptz not null default now();
alter table pgboss.archive drop constraint if exists archive_pkey;
alter table pgboss.archive add primary key (name, id);
create index if not exists archive_i1 on pgboss.archive(archived_on);

create or replace function pgboss.create_queue(queue_name text, options json)
returns void as $$
declare
  table_name varchar := 'j' || encode(sha224(queue_name::bytea), 'hex');
  queue_created_on timestamptz;
begin
  with q as (
    insert into pgboss.queue (name, policy, retry_limit, retry_delay, retry_backoff, expire_seconds, retention_minutes, dead_letter, partition_name)
    values (
      queue_name,
      options->>'policy',
      (options->>'retryLimit')::int,
      (options->>'retryDelay')::int,
      (options->>'retryBackoff')::bool,
      (options->>'expireInSeconds')::int,
      (options->>'retentionMinutes')::int,
      options->>'deadLetter',
      table_name
    ) on conflict do nothing returning created_on)
  select created_on into queue_created_on from q;

  if queue_created_on is null then return; end if;

  execute format('create table pgboss.%I (like pgboss.job including defaults)', table_name);
  execute format('alter table pgboss.%1$I add primary key (name, id)', table_name);
  execute format('alter table pgboss.%1$I add constraint q_fkey foreign key (name) references pgboss.queue (name) on delete restrict deferrable initially deferred', table_name);
  execute format('alter table pgboss.%1$I add constraint dlq_fkey foreign key (dead_letter) references pgboss.queue (name) on delete restrict deferrable initially deferred', table_name);
  execute format('create unique index %1$s_i1 on pgboss.%1$I (name, coalesce(singleton_key, '''')) where state = ''created'' and policy = ''short''', table_name);
  execute format('create index %1$s_i2 on pgboss.%1$I (name, start_after) include (priority, created_on, id) where state < ''active''', table_name);
  execute format('create index %1$s_i3 on pgboss.%1$I (name) include (priority, created_on, id) where state = ''created'' and policy = ''singleton''', table_name);
  execute format('alter table pgboss.%I add constraint cjc check (name=%L)', table_name, queue_name);
  execute format('alter table pgboss.job attach partition pgboss.%I for values in (%L)', table_name, queue_name);
end;
$$ language plpgsql;

create or replace function pgboss.delete_queue(queue_name text)
returns void as $$
declare
  table_name varchar;
begin
  select partition_name into table_name from pgboss.queue where name = queue_name;
  if table_name is not null then execute format('drop table pgboss.%I', table_name); end if;
  delete from pgboss.queue where name = queue_name;
end;
$$ language plpgsql;

insert into pgboss.version (version) values (24) on conflict do nothing;

-- Grant ownership and permissions to worker
do $$ begin
  begin execute 'grant worker to postgres'; exception when others then null; end;
end $$;
alter schema pgboss owner to worker;
alter type pgboss.job_state owner to worker;
alter table pgboss.version owner to worker;
alter table pgboss.queue owner to worker;
alter table pgboss.schedule owner to worker;
alter table pgboss.subscription owner to worker;
alter table pgboss.job owner to worker;
alter table pgboss.archive owner to worker;
alter function pgboss.create_queue(text, json) owner to worker;
alter function pgboss.delete_queue(text) owner to worker;
do $$ begin
  begin execute 'revoke worker from postgres'; exception when others then null; end;
end $$;

grant usage, create on schema pgboss to worker;
grant all privileges on all tables in schema pgboss to worker;
grant all privileges on all sequences in schema pgboss to worker;
grant all privileges on all functions in schema pgboss to worker;
grant usage on type pgboss.job_state to worker;
