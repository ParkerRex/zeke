-- Workspace schema for clusters, sources, items, and overlays
create extension if not exists vector;

-- Sources of news/content
create table if not exists public.source (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  authority_score numeric,
  rss_url text,
  domain text
);

-- Individual items/articles/videos
create table if not exists public.item (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.source(id) on delete set null,
  url text not null,
  title text,
  author text,
  published_at timestamptz,
  raw_text text,
  emb_vector vector(1536),
  hash_sim bigint,
  engagement_json jsonb
);

create index if not exists item_hash_sim_idx on public.item(hash_sim);
-- Optional ANN index; requires vector extension
create index if not exists item_emb_vector_ivfflat on public.item using ivfflat (emb_vector vector_l2_ops);

-- Topic clusters
create table if not exists public.cluster (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  primary_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Many-to-many between clusters and items
create table if not exists public.cluster_item (
  cluster_id uuid references public.cluster(id) on delete cascade,
  item_id uuid references public.item(id) on delete cascade,
  primary key (cluster_id, item_id)
);

-- Metrics per cluster
create table if not exists public.cluster_metrics (
  cluster_id uuid primary key references public.cluster(id) on delete cascade,
  corroboration_count integer,
  novelty_score numeric,
  recency_score numeric,
  engagement_score numeric,
  hype_chili integer,
  confidence numeric
);

create index if not exists cluster_metrics_hype_conf_idx on public.cluster_metrics(hype_chili, confidence);

-- Reuse existing public.users for app users (created by auth trigger in prior migration)

-- Bookmarks
create table if not exists public.bookmark (
  user_id uuid references public.users(id) on delete cascade,
  cluster_id uuid references public.cluster(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, cluster_id)
);

-- Highlights
create table if not exists public.highlight (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  cluster_id uuid references public.cluster(id) on delete cascade,
  item_id uuid references public.item(id) on delete cascade,
  quote text,
  note text,
  ranges_json jsonb,
  created_at timestamptz default now()
);

-- Watchlists
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  entities_json jsonb
);

-- Share snapshots
create table if not exists public.share (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  cluster_id uuid references public.cluster(id) on delete cascade,
  overlay_snapshot_json jsonb,
  created_at timestamptz default now()
);

-- Digest subscriptions
create table if not exists public.digest_subscription (
  user_id uuid references public.users(id) on delete cascade,
  cadence text check (cadence in ('daily')),
  watchlist_id uuid references public.watchlist(id) on delete set null,
  primary key (user_id)
);

-- RLS policies
alter table public.bookmark enable row level security;
alter table public.highlight enable row level security;
alter table public.watchlist enable row level security;
alter table public.share enable row level security;
alter table public.digest_subscription enable row level security;

create policy if not exists "own bookmarks" on public.bookmark
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own highlights" on public.highlight
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own watchlists" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow public read of share snapshots; only owner can insert/delete
create policy if not exists "read shares" on public.share for select using (true);
create policy if not exists "own shares write" on public.share for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own digest sub" on public.digest_subscription
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

