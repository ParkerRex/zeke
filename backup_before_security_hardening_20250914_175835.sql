
\restrict mroETOeD5sQ6dgd5TawoML4ODfEoeTWO1bRId3Oj08rSVpbEaGvXplXuWLppowj


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "pgboss";


ALTER SCHEMA "pgboss" OWNER TO "worker";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "pgboss"."job_state" AS ENUM (
    'created',
    'retry',
    'active',
    'completed',
    'cancelled',
    'failed'
);


ALTER TYPE "pgboss"."job_state" OWNER TO "worker";


CREATE TYPE "public"."health_status" AS ENUM (
    'ok',
    'warn',
    'error'
);


ALTER TYPE "public"."health_status" OWNER TO "postgres";


CREATE TYPE "public"."pricing_plan_interval" AS ENUM (
    'day',
    'week',
    'month',
    'year'
);


ALTER TYPE "public"."pricing_plan_interval" OWNER TO "postgres";


CREATE TYPE "public"."pricing_type" AS ENUM (
    'one_time',
    'recurring'
);


ALTER TYPE "public"."pricing_type" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid',
    'paused'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgboss"."create_queue"("queue_name" "text", "options" json) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $_$
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
$_$;


ALTER FUNCTION "pgboss"."create_queue"("queue_name" "text", "options" json) OWNER TO "worker";


CREATE OR REPLACE FUNCTION "pgboss"."delete_queue"("queue_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  table_name varchar;
begin
  select partition_name into table_name from pgboss.queue where name = queue_name;
  if table_name is not null then execute format('drop table pgboss.%I', table_name); end if;
  delete from pgboss.queue where name = queue_name;
end;
$$;


ALTER FUNCTION "pgboss"."delete_queue"("queue_name" "text") OWNER TO "worker";


CREATE OR REPLACE FUNCTION "public"."get_youtube_sources"() RETURNS TABLE("id" "uuid", "kind" "text", "name" "text", "url" "text", "domain" "text", "metadata" "jsonb", "last_cursor" "jsonb")
    LANGUAGE "sql"
    AS $$
  select id, kind, name, url, domain, metadata, last_cursor
  from public.sources
  where kind in ('youtube_channel','youtube_search') and metadata is not null
$$;


ALTER FUNCTION "public"."get_youtube_sources"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = (SELECT auth.uid())),
    false
  );
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_worker_role"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT current_user = 'worker';
$$;


ALTER FUNCTION "public"."is_worker_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_source_metrics"("_source_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."refresh_source_metrics"("_source_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_refresh_metrics_on_contents"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare _sid uuid; begin
  select r.source_id into _sid from public.raw_items r where r.id = NEW.raw_item_id;
  if _sid is not null then perform public.refresh_source_metrics(_sid); end if;
  return null; end;$$;


ALTER FUNCTION "public"."tg_refresh_metrics_on_contents"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_refresh_metrics_on_raw_items"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  perform public.refresh_source_metrics(NEW.source_id);
  return null;
end;$$;


ALTER FUNCTION "public"."tg_refresh_metrics_on_raw_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_refresh_metrics_on_stories"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare _sid uuid; begin
  select r.source_id into _sid from public.raw_items r join public.contents c on c.id = NEW.content_id and c.raw_item_id = r.id;
  if _sid is not null then perform public.refresh_source_metrics(_sid); end if;
  return null; end;$$;


ALTER FUNCTION "public"."tg_refresh_metrics_on_stories"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "pgboss"."archive" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "priority" integer NOT NULL,
    "data" "jsonb",
    "state" "pgboss"."job_state" NOT NULL,
    "retry_limit" integer NOT NULL,
    "retry_count" integer NOT NULL,
    "retry_delay" integer NOT NULL,
    "retry_backoff" boolean NOT NULL,
    "start_after" timestamp with time zone NOT NULL,
    "started_on" timestamp with time zone,
    "singleton_key" "text",
    "singleton_on" timestamp without time zone,
    "expire_in" interval NOT NULL,
    "created_on" timestamp with time zone NOT NULL,
    "completed_on" timestamp with time zone,
    "keep_until" timestamp with time zone NOT NULL,
    "output" "jsonb",
    "dead_letter" "text",
    "policy" "text",
    "archived_on" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "pgboss"."archive" OWNER TO "worker";


CREATE TABLE IF NOT EXISTS "pgboss"."job" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "data" "jsonb",
    "state" "pgboss"."job_state" DEFAULT 'created'::"pgboss"."job_state" NOT NULL,
    "retry_limit" integer DEFAULT 2 NOT NULL,
    "retry_count" integer DEFAULT 0 NOT NULL,
    "retry_delay" integer DEFAULT 0 NOT NULL,
    "retry_backoff" boolean DEFAULT false NOT NULL,
    "start_after" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_on" timestamp with time zone,
    "singleton_key" "text",
    "singleton_on" timestamp without time zone,
    "expire_in" interval DEFAULT '00:15:00'::interval NOT NULL,
    "created_on" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_on" timestamp with time zone,
    "keep_until" timestamp with time zone DEFAULT ("now"() + '14 days'::interval) NOT NULL,
    "output" "jsonb",
    "dead_letter" "text",
    "policy" "text"
)
PARTITION BY LIST ("name");


ALTER TABLE "pgboss"."job" OWNER TO "worker";


CREATE TABLE IF NOT EXISTS "pgboss"."queue" (
    "name" "text" NOT NULL,
    "policy" "text",
    "retry_limit" integer,
    "retry_delay" integer,
    "retry_backoff" boolean,
    "expire_seconds" integer,
    "retention_minutes" integer,
    "dead_letter" "text",
    "partition_name" "text",
    "created_on" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_on" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "pgboss"."queue" OWNER TO "worker";


CREATE TABLE IF NOT EXISTS "pgboss"."schedule" (
    "name" "text" NOT NULL,
    "cron" "text" NOT NULL,
    "timezone" "text",
    "data" "jsonb",
    "options" "jsonb",
    "created_on" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_on" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "pgboss"."schedule" OWNER TO "worker";


CREATE TABLE IF NOT EXISTS "pgboss"."subscription" (
    "event" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_on" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_on" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "pgboss"."subscription" OWNER TO "worker";


CREATE TABLE IF NOT EXISTS "pgboss"."version" (
    "version" integer NOT NULL,
    "maintained_on" timestamp with time zone,
    "cron_on" timestamp with time zone,
    "monitored_on" timestamp with time zone
);


ALTER TABLE "pgboss"."version" OWNER TO "worker";


CREATE TABLE IF NOT EXISTS "public"."clusters" (
    "cluster_key" "text" NOT NULL,
    "representative_story_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clusters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "raw_item_id" "uuid" NOT NULL,
    "text" "text",
    "html_url" "text",
    "transcript_url" "text",
    "pdf_url" "text",
    "audio_url" "text",
    "duration_seconds" integer,
    "view_count" bigint,
    "transcript_vtt" "text",
    "lang" "text",
    "extracted_at" timestamp with time zone DEFAULT "now"(),
    "content_hash" "text" NOT NULL
);


ALTER TABLE "public"."contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" NOT NULL,
    "stripe_customer_id" "text"
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."highlights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "story_id" "uuid" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "span" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."highlights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_metrics" (
    "name" "text" NOT NULL,
    "state" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."job_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_quota" (
    "provider" "text" NOT NULL,
    "quota_limit" integer,
    "used" integer,
    "remaining" integer,
    "reset_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."platform_quota" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prices" (
    "id" "text" NOT NULL,
    "product_id" "text",
    "active" boolean,
    "description" "text",
    "unit_amount" bigint,
    "currency" "text",
    "type" "public"."pricing_type",
    "interval" "public"."pricing_plan_interval",
    "interval_count" integer,
    "trial_period_days" integer,
    "metadata" "jsonb",
    CONSTRAINT "prices_currency_check" CHECK (("char_length"("currency") = 3))
);


ALTER TABLE "public"."prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "text" NOT NULL,
    "active" boolean,
    "name" "text",
    "description" "text",
    "image" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."raw_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "url" "text" NOT NULL,
    "kind" "text",
    "title" "text",
    "metadata" "jsonb",
    "discovered_at" timestamp with time zone DEFAULT "now"(),
    "status" "text",
    "error" "text",
    "attempts" integer DEFAULT 0
);


ALTER TABLE "public"."raw_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."source_health" (
    "source_id" "uuid" NOT NULL,
    "status" "public"."health_status" DEFAULT 'ok'::"public"."health_status" NOT NULL,
    "last_success_at" timestamp with time zone,
    "last_error_at" timestamp with time zone,
    "error_24h" integer DEFAULT 0,
    "message" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."source_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."source_metrics" (
    "source_id" "uuid" NOT NULL,
    "raw_total" integer DEFAULT 0,
    "contents_total" integer DEFAULT 0,
    "stories_total" integer DEFAULT 0,
    "raw_24h" integer DEFAULT 0,
    "contents_24h" integer DEFAULT 0,
    "stories_24h" integer DEFAULT 0,
    "last_raw_at" timestamp with time zone,
    "last_content_at" timestamp with time zone,
    "last_story_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."source_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "text" NOT NULL,
    "name" "text",
    "url" "text",
    "domain" "text",
    "authority_score" numeric,
    "last_cursor" "jsonb",
    "last_checked" timestamp with time zone,
    "metadata" "jsonb",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_youtube_metadata" CHECK ((("kind" <> ALL (ARRAY['youtube_channel'::"text", 'youtube_search'::"text"])) OR (("metadata" IS NOT NULL) AND ("metadata" <> '{}'::"jsonb"))))
);


ALTER TABLE "public"."sources" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sources"."active" IS 'Whether this source is actively being processed';



COMMENT ON COLUMN "public"."sources"."created_at" IS 'When this source was first added';



COMMENT ON COLUMN "public"."sources"."updated_at" IS 'When this source was last modified';



CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "canonical_url" "text",
    "kind" "text",
    "title" "text",
    "primary_url" "text",
    "published_at" timestamp with time zone,
    "cluster_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_embeddings" (
    "story_id" "uuid" NOT NULL,
    "embedding" "public"."vector"(1536) NOT NULL,
    "model_version" "text"
);


ALTER TABLE "public"."story_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_overlays" (
    "story_id" "uuid" NOT NULL,
    "why_it_matters" "text",
    "chili" integer,
    "confidence" numeric,
    "citations" "jsonb",
    "model_version" "text",
    "analyzed_at" timestamp with time zone
);


ALTER TABLE "public"."story_overlays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."subscription_status",
    "metadata" "jsonb",
    "price_id" "text",
    "quantity" integer,
    "cancel_at_period_end" boolean,
    "created" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "current_period_end" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ended_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "cancel_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "canceled_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "trial_start" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "trial_end" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "billing_address" "jsonb",
    "payment_method" "jsonb",
    "is_admin" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "pgboss"."archive"
    ADD CONSTRAINT "archive_pkey" PRIMARY KEY ("name", "id");



ALTER TABLE ONLY "pgboss"."job"
    ADD CONSTRAINT "job_pkey" PRIMARY KEY ("name", "id");



ALTER TABLE ONLY "pgboss"."queue"
    ADD CONSTRAINT "queue_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "pgboss"."schedule"
    ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "pgboss"."subscription"
    ADD CONSTRAINT "subscription_pkey" PRIMARY KEY ("event", "name");



ALTER TABLE ONLY "pgboss"."version"
    ADD CONSTRAINT "version_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."clusters"
    ADD CONSTRAINT "clusters_pkey" PRIMARY KEY ("cluster_key");



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_metrics"
    ADD CONSTRAINT "job_metrics_pkey" PRIMARY KEY ("name", "state");



ALTER TABLE ONLY "public"."platform_quota"
    ADD CONSTRAINT "platform_quota_pkey" PRIMARY KEY ("provider");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."raw_items"
    ADD CONSTRAINT "raw_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."source_health"
    ADD CONSTRAINT "source_health_pkey" PRIMARY KEY ("source_id");



ALTER TABLE ONLY "public"."source_metrics"
    ADD CONSTRAINT "source_metrics_pkey" PRIMARY KEY ("source_id");



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_content_id_key" UNIQUE ("content_id");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_embeddings"
    ADD CONSTRAINT "story_embeddings_pkey" PRIMARY KEY ("story_id");



ALTER TABLE ONLY "public"."story_overlays"
    ADD CONSTRAINT "story_overlays_pkey" PRIMARY KEY ("story_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "archive_i1" ON "pgboss"."archive" USING "btree" ("archived_on");



CREATE INDEX "clusters_rep_story_idx" ON "public"."clusters" USING "btree" ("representative_story_id");



CREATE INDEX "contents_content_hash_idx" ON "public"."contents" USING "btree" ("content_hash");



CREATE INDEX "contents_extracted_idx" ON "public"."contents" USING "btree" ("extracted_at" DESC);



CREATE INDEX "contents_raw_item_idx" ON "public"."contents" USING "btree" ("raw_item_id");



CREATE INDEX "highlights_story_idx" ON "public"."highlights" USING "btree" ("story_id");



CREATE INDEX "highlights_user_idx" ON "public"."highlights" USING "btree" ("user_id");



CREATE INDEX "idx_contents_audio_url" ON "public"."contents" USING "btree" ("audio_url") WHERE ("audio_url" IS NOT NULL);



CREATE INDEX "idx_contents_transcript_url" ON "public"."contents" USING "btree" ("transcript_url") WHERE ("transcript_url" IS NOT NULL);



CREATE INDEX "idx_contents_transcript_vtt" ON "public"."contents" USING "btree" ("id") WHERE ("transcript_vtt" IS NOT NULL);



CREATE INDEX "idx_raw_items_youtube" ON "public"."raw_items" USING "btree" ("kind", "external_id") WHERE ("kind" = 'youtube'::"text");



CREATE INDEX "raw_items_source_discovered_idx" ON "public"."raw_items" USING "btree" ("source_id", "discovered_at" DESC);



CREATE UNIQUE INDEX "raw_items_source_external_unique" ON "public"."raw_items" USING "btree" ("source_id", "external_id");



CREATE INDEX "sources_domain_idx" ON "public"."sources" USING "btree" ("domain");



CREATE INDEX "sources_last_checked_idx" ON "public"."sources" USING "btree" ("last_checked");



CREATE INDEX "stories_cluster_key_idx" ON "public"."stories" USING "btree" ("cluster_key");



CREATE INDEX "stories_created_idx" ON "public"."stories" USING "btree" ("created_at" DESC);



CREATE INDEX "stories_published_idx" ON "public"."stories" USING "btree" ("published_at");



CREATE INDEX "story_embeddings_l2_idx" ON "public"."story_embeddings" USING "ivfflat" ("embedding") WITH ("lists"='100');



CREATE OR REPLACE TRIGGER "tr_refresh_metrics_contents" AFTER INSERT ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."tg_refresh_metrics_on_contents"();



CREATE OR REPLACE TRIGGER "tr_refresh_metrics_raw_items" AFTER INSERT ON "public"."raw_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_refresh_metrics_on_raw_items"();



CREATE OR REPLACE TRIGGER "tr_refresh_metrics_stories" AFTER INSERT ON "public"."stories" FOR EACH ROW EXECUTE FUNCTION "public"."tg_refresh_metrics_on_stories"();



ALTER TABLE ONLY "pgboss"."queue"
    ADD CONSTRAINT "queue_dead_letter_fkey" FOREIGN KEY ("dead_letter") REFERENCES "pgboss"."queue"("name");



ALTER TABLE ONLY "pgboss"."schedule"
    ADD CONSTRAINT "schedule_name_fkey" FOREIGN KEY ("name") REFERENCES "pgboss"."queue"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "pgboss"."subscription"
    ADD CONSTRAINT "subscription_name_fkey" FOREIGN KEY ("name") REFERENCES "pgboss"."queue"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clusters"
    ADD CONSTRAINT "clusters_representative_story_id_fkey" FOREIGN KEY ("representative_story_id") REFERENCES "public"."stories"("id");



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_raw_item_id_fkey" FOREIGN KEY ("raw_item_id") REFERENCES "public"."raw_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."raw_items"
    ADD CONSTRAINT "raw_items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."source_health"
    ADD CONSTRAINT "source_health_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."source_metrics"
    ADD CONSTRAINT "source_metrics_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."story_embeddings"
    ADD CONSTRAINT "story_embeddings_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_overlays"
    ADD CONSTRAINT "story_overlays_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow public read-only access." ON "public"."prices" FOR SELECT USING (true);



CREATE POLICY "Allow public read-only access." ON "public"."products" FOR SELECT USING (true);



ALTER TABLE "public"."clusters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clusters_delete_consolidated" ON "public"."clusters" FOR DELETE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "clusters_insert_consolidated" ON "public"."clusters" FOR INSERT TO "authenticated", "worker" WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "clusters_select_consolidated" ON "public"."clusters" FOR SELECT TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"() OR true));



CREATE POLICY "clusters_update_consolidated" ON "public"."clusters" FOR UPDATE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"())) WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



ALTER TABLE "public"."contents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contents_delete_consolidated" ON "public"."contents" FOR DELETE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "contents_insert_consolidated" ON "public"."contents" FOR INSERT TO "authenticated", "worker" WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "contents_select_consolidated" ON "public"."contents" FOR SELECT TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"() OR true));



CREATE POLICY "contents_update_consolidated" ON "public"."contents" FOR UPDATE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"())) WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."highlights" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "highlights_delete_own" ON "public"."highlights" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "highlights_insert_own" ON "public"."highlights" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "highlights_select_own" ON "public"."highlights" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "highlights_update_own" ON "public"."highlights" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."job_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_metrics_admin_select" ON "public"."job_metrics" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "job_metrics_worker_all" ON "public"."job_metrics" TO "worker" USING (true) WITH CHECK (true);



ALTER TABLE "public"."platform_quota" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "platform_quota_admin_select" ON "public"."platform_quota" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "platform_quota_worker_all" ON "public"."platform_quota" TO "worker" USING (true) WITH CHECK (true);



ALTER TABLE "public"."prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."raw_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "raw_items_admin_all" ON "public"."raw_items" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "raw_items_worker_all" ON "public"."raw_items" TO "worker" USING (true) WITH CHECK (true);



ALTER TABLE "public"."source_health" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "source_health_admin_select" ON "public"."source_health" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "source_health_worker_all" ON "public"."source_health" TO "worker" USING (true) WITH CHECK (true);



ALTER TABLE "public"."source_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "source_metrics_admin_select" ON "public"."source_metrics" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



ALTER TABLE "public"."sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sources_delete_consolidated" ON "public"."sources" FOR DELETE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "sources_insert_consolidated" ON "public"."sources" FOR INSERT TO "authenticated", "worker" WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "sources_select_consolidated" ON "public"."sources" FOR SELECT TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"() OR ("active" = true)));



CREATE POLICY "sources_update_consolidated" ON "public"."sources" FOR UPDATE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"())) WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



ALTER TABLE "public"."stories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stories_delete_consolidated" ON "public"."stories" FOR DELETE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "stories_insert_consolidated" ON "public"."stories" FOR INSERT TO "authenticated", "worker" WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "stories_select_consolidated" ON "public"."stories" FOR SELECT TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"() OR true));



CREATE POLICY "stories_update_consolidated" ON "public"."stories" FOR UPDATE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"())) WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



ALTER TABLE "public"."story_embeddings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_embeddings_delete_consolidated" ON "public"."story_embeddings" FOR DELETE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "story_embeddings_insert_consolidated" ON "public"."story_embeddings" FOR INSERT TO "authenticated", "worker" WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "story_embeddings_select_consolidated" ON "public"."story_embeddings" FOR SELECT TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"() OR true));



CREATE POLICY "story_embeddings_update_consolidated" ON "public"."story_embeddings" FOR UPDATE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"())) WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



ALTER TABLE "public"."story_overlays" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_overlays_delete_consolidated" ON "public"."story_overlays" FOR DELETE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "story_overlays_insert_consolidated" ON "public"."story_overlays" FOR INSERT TO "authenticated", "worker" WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



CREATE POLICY "story_overlays_select_consolidated" ON "public"."story_overlays" FOR SELECT TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"() OR true));



CREATE POLICY "story_overlays_update_consolidated" ON "public"."story_overlays" FOR UPDATE TO "authenticated", "worker" USING (("public"."is_admin_user"() OR "public"."is_worker_role"())) WITH CHECK (("public"."is_admin_user"() OR "public"."is_worker_role"()));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select_own" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_metrics";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."platform_quota";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."prices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."products";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."source_health";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."source_metrics";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_youtube_sources"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_youtube_sources"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_youtube_sources"() TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_worker_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_worker_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_worker_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_source_metrics"("_source_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_source_metrics"("_source_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_source_metrics"("_source_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_contents"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_contents"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_contents"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_raw_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_raw_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_raw_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_stories"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_stories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_refresh_metrics_on_stories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."clusters" TO "anon";
GRANT ALL ON TABLE "public"."clusters" TO "authenticated";
GRANT ALL ON TABLE "public"."clusters" TO "service_role";



GRANT ALL ON TABLE "public"."contents" TO "anon";
GRANT ALL ON TABLE "public"."contents" TO "authenticated";
GRANT ALL ON TABLE "public"."contents" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."highlights" TO "anon";
GRANT ALL ON TABLE "public"."highlights" TO "authenticated";
GRANT ALL ON TABLE "public"."highlights" TO "service_role";



GRANT ALL ON TABLE "public"."job_metrics" TO "anon";
GRANT ALL ON TABLE "public"."job_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."job_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."platform_quota" TO "anon";
GRANT ALL ON TABLE "public"."platform_quota" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_quota" TO "service_role";



GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT ALL ON TABLE "public"."prices" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."raw_items" TO "anon";
GRANT ALL ON TABLE "public"."raw_items" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_items" TO "service_role";



GRANT ALL ON TABLE "public"."source_health" TO "anon";
GRANT ALL ON TABLE "public"."source_health" TO "authenticated";
GRANT ALL ON TABLE "public"."source_health" TO "service_role";



GRANT ALL ON TABLE "public"."source_metrics" TO "anon";
GRANT ALL ON TABLE "public"."source_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."source_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."sources" TO "anon";
GRANT ALL ON TABLE "public"."sources" TO "authenticated";
GRANT ALL ON TABLE "public"."sources" TO "service_role";



GRANT ALL ON TABLE "public"."stories" TO "anon";
GRANT ALL ON TABLE "public"."stories" TO "authenticated";
GRANT ALL ON TABLE "public"."stories" TO "service_role";



GRANT ALL ON TABLE "public"."story_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."story_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."story_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."story_overlays" TO "anon";
GRANT ALL ON TABLE "public"."story_overlays" TO "authenticated";
GRANT ALL ON TABLE "public"."story_overlays" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























\unrestrict mroETOeD5sQ6dgd5TawoML4ODfEoeTWO1bRId3Oj08rSVpbEaGvXplXuWLppowj

RESET ALL;
