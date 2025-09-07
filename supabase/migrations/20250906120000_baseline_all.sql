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
create policy "Can view own user data." on users for select using (auth.uid() = id);
create policy "Can update own user data." on users for update using (auth.uid() = id);

/**
* This trigger automatically creates a user entry when a new user signs up via Supabase Auth.
*/
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
* CUSTOMERS
* Note: this is a private table that contains a mapping of user IDs to Stripe customer IDs.
*/
create table customers (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  -- The user's customer ID in Stripe. User must not be able to update this.
  stripe_customer_id text
);
alter table customers enable row level security;
-- No policies as this is a private table that the user must not have access to.

/**
* PRODUCTS
* Note: products are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create table products (
  -- Product ID from Stripe, e.g. prod_1234.
  id text primary key,
  -- Whether the product is currently available for purchase.
  active boolean,
  -- The product's name, meant to be displayable to the customer. Whenever this product is sold via a subscription, name will show up on associated invoice line item descriptions.
  name text,
  -- The product's description, meant to be displayable to the customer. Use this field to optionally store a long form explanation of the product being sold for your own rendering purposes.
  description text,
  -- A URL of the product image in Stripe, meant to be displayable to the customer.
  image text,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);
alter table products enable row level security;
create policy "Allow public read-only access." on products for select using (true);

/**
* PRICES
* Note: prices are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type pricing_type as enum ('one_time', 'recurring');
create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');
create table prices (
  -- Price ID from Stripe, e.g. price_1234.
  id text primary key,
  -- The ID of the prduct that this price belongs to.
  product_id text references products,
  -- Whether the price can be used for new purchases.
  active boolean,
  -- A brief description of the price.
  description text,
  -- The unit amount as a positive integer in the smallest currency unit (e.g., 100 cents for US$1.00 or 100 for ¥100, a zero-decimal currency).
  unit_amount bigint,
  -- Three-letter ISO currency code, in lowercase.
  currency text check (char_length(currency) = 3),
  -- One of `one_time` or `recurring` depending on whether the price is for a one-time purchase or a recurring (subscription) purchase.
  type pricing_type,
  -- The frequency at which a subscription is billed. One of `day`, `week`, `month` or `year`.
  interval pricing_plan_interval,
  -- The number of intervals (specified in the `interval` attribute) between subscription billings. For example, `interval=month` and `interval_count=3` bills every 3 months.
  interval_count integer,
  -- Default number of trial days when subscribing a customer to this price using [`trial_from_plan=true`](https://stripe.com/docs/api#create_subscription-trial_from_plan).
  trial_period_days integer,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);
alter table prices enable row level security;
create policy "Allow public read-only access." on prices for select using (true);

/**
* SUBSCRIPTIONS
* Note: subscriptions are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type subscription_status as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
create table subscriptions (
  -- Subscription ID from Stripe, e.g. sub_1234.
  id text primary key,
  user_id uuid references auth.users not null,
  -- The status of the subscription object, one of subscription_status type above.
  status subscription_status,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb,
  -- ID of the price that created this subscription.
  price_id text references prices,
  -- Quantity multiplied by the unit amount of the price creates the amount of the subscription. Can be used to charge multiple seats.
  quantity integer,
  -- If true the subscription has been canceled by the user and will be deleted at the end of the billing period.
  cancel_at_period_end boolean,
  -- Time at which the subscription was created.
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Start of the current period that the subscription has been invoiced for.
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  -- End of the current period that the subscription has been invoiced for. At the end of this period, a new invoice will be created.
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  -- If the subscription has ended, the timestamp of the date the subscription ended.
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  -- A date in the future at which the subscription will automatically get canceled.
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has been canceled, the date of that cancellation. If the subscription was canceled with `cancel_at_period_end`, `canceled_at` will still reflect the date of the initial cancellation request, not the end of the subscription period when the subscription is automatically moved to a canceled state.
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has a trial, the beginning of that trial.
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has a trial, the end of that trial.
  trial_end timestamp with time zone default timezone('utc'::text, now())
);
alter table subscriptions enable row level security;
create policy "Can only view own subs data." on subscriptions for select using (auth.uid() = user_id);

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */
drop publication if exists supabase_realtime;
create publication supabase_realtime for table products, prices;

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
