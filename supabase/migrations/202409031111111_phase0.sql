-- Phase 0 schema bootstrap
-- Extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- sources
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text,
  url text,
  domain text,
  authority_score numeric,
  last_cursor jsonb,
  last_checked timestamptz
);

-- raw_items
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

-- contents
create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  raw_item_id uuid not null references public.raw_items(id) on delete cascade,
  text text,
  html_url text,
  transcript_url text,
  pdf_url text,
  lang text,
  extracted_at timestamptz default now(),
  content_hash text not null
);
create index if not exists contents_content_hash_idx on public.contents(content_hash);

-- stories
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

-- clusters (1:N: cluster -> stories)
create table if not exists public.clusters (
  cluster_key text primary key,
  representative_story_id uuid references public.stories(id),
  created_at timestamptz default now()
);

-- story_overlays
create table if not exists public.story_overlays (
  story_id uuid primary key references public.stories(id) on delete cascade,
  why_it_matters text,
  chili int,
  confidence numeric,
  citations jsonb,
  model_version text,
  analyzed_at timestamptz
);

-- story_embeddings (pgvector)
create table if not exists public.story_embeddings (
  story_id uuid primary key references public.stories(id) on delete cascade,
  embedding vector(1536) not null,
  model_version text
);
-- ivfflat index (adjust lists as needed)
do $$ begin
  execute 'create index if not exists story_embeddings_l2_idx on public.story_embeddings using ivfflat (embedding vector_l2_ops) with (lists = 100)';
exception when others then null; end $$;

-- highlights (annotations)
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

