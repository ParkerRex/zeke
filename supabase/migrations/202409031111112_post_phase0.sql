-- Additional indexes and RLS after Phase 0

-- Helpful indexes for common queries
create index if not exists raw_items_source_discovered_idx on public.raw_items(source_id, discovered_at desc);
create index if not exists stories_created_idx on public.stories(created_at desc);
create index if not exists stories_published_idx on public.stories(published_at);
create index if not exists clusters_rep_story_idx on public.clusters(representative_story_id);
create index if not exists sources_domain_idx on public.sources(domain);

-- Highlights RLS (per-user)
alter table public.highlights enable row level security;
drop policy if exists highlights_owner_all on public.highlights;
create policy highlights_owner_all on public.highlights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

