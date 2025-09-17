-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."health_status" AS ENUM('ok', 'warn', 'error');--> statement-breakpoint
CREATE TYPE "public"."pricing_plan_interval" AS ENUM('day', 'week', 'month', 'year');--> statement-breakpoint
CREATE TYPE "public"."pricing_type" AS ENUM('one_time', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');--> statement-breakpoint
CREATE TABLE "clusters" (
	"cluster_key" text PRIMARY KEY NOT NULL,
	"representative_story_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clusters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"stripe_customer_id" text
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"span" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "highlights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform_quota" (
	"provider" text PRIMARY KEY NOT NULL,
	"quota_limit" integer,
	"used" integer,
	"remaining" integer,
	"reset_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_quota" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prices" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"active" boolean,
	"description" text,
	"unit_amount" bigint,
	"currency" text,
	"type" "pricing_type",
	"interval" "pricing_plan_interval",
	"interval_count" integer,
	"trial_period_days" integer,
	"metadata" jsonb,
	CONSTRAINT "prices_currency_check" CHECK (char_length(currency) = 3)
);
--> statement-breakpoint
ALTER TABLE "prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"active" boolean,
	"name" text,
	"description" text,
	"image" text,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "raw_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"kind" text,
	"title" text,
	"metadata" jsonb,
	"discovered_at" timestamp with time zone DEFAULT now(),
	"status" text,
	"error" text,
	"attempts" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "raw_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_item_id" uuid NOT NULL,
	"text" text,
	"html_url" text,
	"transcript_url" text,
	"pdf_url" text,
	"lang" text,
	"extracted_at" timestamp with time zone DEFAULT now(),
	"content_hash" text NOT NULL,
	"audio_url" text,
	"duration_seconds" integer,
	"view_count" bigint,
	"transcript_vtt" text
);
--> statement-breakpoint
ALTER TABLE "contents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "source_health" (
	"source_id" uuid PRIMARY KEY NOT NULL,
	"status" "health_status" DEFAULT 'ok' NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	"error_24h" integer DEFAULT 0,
	"message" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_health" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "source_metrics" (
	"source_id" uuid PRIMARY KEY NOT NULL,
	"raw_total" integer DEFAULT 0,
	"contents_total" integer DEFAULT 0,
	"stories_total" integer DEFAULT 0,
	"raw_24h" integer DEFAULT 0,
	"contents_24h" integer DEFAULT 0,
	"stories_24h" integer DEFAULT 0,
	"last_raw_at" timestamp with time zone,
	"last_content_at" timestamp with time zone,
	"last_story_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"name" text,
	"url" text,
	"domain" text,
	"authority_score" numeric,
	"last_cursor" jsonb,
	"last_checked" timestamp with time zone,
	"metadata" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_youtube_metadata" CHECK ((kind <> ALL (ARRAY['youtube_channel'::text, 'youtube_search'::text])) OR ((metadata IS NOT NULL) AND (metadata <> '{}'::jsonb)))
);
--> statement-breakpoint
ALTER TABLE "sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"canonical_url" text,
	"kind" text,
	"title" text,
	"primary_url" text,
	"published_at" timestamp with time zone,
	"cluster_key" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "stories_content_id_key" UNIQUE("content_id")
);
--> statement-breakpoint
ALTER TABLE "stories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "story_embeddings" (
	"story_id" uuid PRIMARY KEY NOT NULL,
	"model_version" text,
	"embedding" vector(1536)
);
--> statement-breakpoint
ALTER TABLE "story_embeddings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "story_overlays" (
	"story_id" uuid PRIMARY KEY NOT NULL,
	"why_it_matters" text,
	"chili" integer,
	"confidence" numeric,
	"citations" jsonb,
	"model_version" text,
	"analyzed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "story_overlays" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "subscription_status",
	"metadata" jsonb,
	"price_id" text,
	"quantity" integer,
	"cancel_at_period_end" boolean,
	"created" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"current_period_start" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"current_period_end" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"ended_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"cancel_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"canceled_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"trial_start" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"trial_end" timestamp with time zone DEFAULT timezone('utc'::text, now())
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"billing_address" jsonb,
	"payment_method" jsonb,
	"is_admin" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "job_metrics" (
	"name" text NOT NULL,
	"state" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_metrics_pkey" PRIMARY KEY("name","state")
);
--> statement-breakpoint
ALTER TABLE "job_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clusters" ADD CONSTRAINT "clusters_representative_story_id_fkey" FOREIGN KEY ("representative_story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_items" ADD CONSTRAINT "raw_items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_raw_item_id_fkey" FOREIGN KEY ("raw_item_id") REFERENCES "public"."raw_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_health" ADD CONSTRAINT "source_health_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_metrics" ADD CONSTRAINT "source_metrics_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_embeddings" ADD CONSTRAINT "story_embeddings_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_overlays" ADD CONSTRAINT "story_overlays_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clusters_rep_story_idx" ON "clusters" USING btree ("representative_story_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "highlights_story_idx" ON "highlights" USING btree ("story_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "highlights_user_idx" ON "highlights" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_raw_items_youtube" ON "raw_items" USING btree ("kind" text_ops,"external_id" text_ops) WHERE (kind = 'youtube'::text);--> statement-breakpoint
CREATE INDEX "raw_items_source_discovered_idx" ON "raw_items" USING btree ("source_id" timestamptz_ops,"discovered_at" timestamptz_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "raw_items_source_external_unique" ON "raw_items" USING btree ("source_id" text_ops,"external_id" text_ops);--> statement-breakpoint
CREATE INDEX "contents_content_hash_idx" ON "contents" USING btree ("content_hash" text_ops);--> statement-breakpoint
CREATE INDEX "idx_contents_audio_url" ON "contents" USING btree ("audio_url" text_ops) WHERE (audio_url IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_contents_transcript_url" ON "contents" USING btree ("transcript_url" text_ops) WHERE (transcript_url IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_contents_transcript_vtt" ON "contents" USING btree ("id" uuid_ops) WHERE (transcript_vtt IS NOT NULL);--> statement-breakpoint
CREATE INDEX "sources_domain_idx" ON "sources" USING btree ("domain" text_ops);--> statement-breakpoint
CREATE INDEX "stories_cluster_key_idx" ON "stories" USING btree ("cluster_key" text_ops);--> statement-breakpoint
CREATE INDEX "stories_created_idx" ON "stories" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "stories_published_idx" ON "stories" USING btree ("published_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "story_embeddings_l2_idx" ON "story_embeddings" USING ivfflat ("embedding" vector_l2_ops) WITH (lists=100);--> statement-breakpoint
CREATE POLICY "clusters_delete_consolidated" ON "clusters" AS PERMISSIVE FOR DELETE TO "authenticated", "worker" USING ((is_admin_user() OR is_worker_role()));--> statement-breakpoint
CREATE POLICY "clusters_insert_consolidated" ON "clusters" AS PERMISSIVE FOR INSERT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "clusters_select_consolidated" ON "clusters" AS PERMISSIVE FOR SELECT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "clusters_update_consolidated" ON "clusters" AS PERMISSIVE FOR UPDATE TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "highlights_delete_own" ON "highlights" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id));--> statement-breakpoint
CREATE POLICY "highlights_insert_own" ON "highlights" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "highlights_select_own" ON "highlights" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "highlights_update_own" ON "highlights" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "platform_quota_admin_select" ON "platform_quota" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_user());--> statement-breakpoint
CREATE POLICY "platform_quota_worker_all" ON "platform_quota" AS PERMISSIVE FOR ALL TO "worker";--> statement-breakpoint
CREATE POLICY "Allow public read-only access." ON "prices" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow public read-only access." ON "products" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "raw_items_admin_all" ON "raw_items" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_user()) WITH CHECK (is_admin_user());--> statement-breakpoint
CREATE POLICY "raw_items_worker_all" ON "raw_items" AS PERMISSIVE FOR ALL TO "worker";--> statement-breakpoint
CREATE POLICY "contents_select_consolidated" ON "contents" AS PERMISSIVE FOR SELECT TO "authenticated", "worker" USING ((is_admin_user() OR is_worker_role() OR true));--> statement-breakpoint
CREATE POLICY "contents_worker_all" ON "contents" AS PERMISSIVE FOR ALL TO "worker";--> statement-breakpoint
CREATE POLICY "contents_authenticated_read" ON "contents" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "contents_admin_all" ON "contents" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "source_health_admin_select" ON "source_health" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_user());--> statement-breakpoint
CREATE POLICY "source_health_worker_all" ON "source_health" AS PERMISSIVE FOR ALL TO "worker";--> statement-breakpoint
CREATE POLICY "source_metrics_admin_select" ON "source_metrics" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_user());--> statement-breakpoint
CREATE POLICY "source_metrics_worker_insert" ON "source_metrics" AS PERMISSIVE FOR INSERT TO "worker";--> statement-breakpoint
CREATE POLICY "source_metrics_worker_update" ON "source_metrics" AS PERMISSIVE FOR UPDATE TO "worker";--> statement-breakpoint
CREATE POLICY "source_metrics_worker_select" ON "source_metrics" AS PERMISSIVE FOR SELECT TO "worker";--> statement-breakpoint
CREATE POLICY "sources_delete_consolidated" ON "sources" AS PERMISSIVE FOR DELETE TO "authenticated", "worker" USING ((is_admin_user() OR is_worker_role()));--> statement-breakpoint
CREATE POLICY "sources_insert_consolidated" ON "sources" AS PERMISSIVE FOR INSERT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "sources_select_consolidated" ON "sources" AS PERMISSIVE FOR SELECT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "sources_update_consolidated" ON "sources" AS PERMISSIVE FOR UPDATE TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "stories_delete_consolidated" ON "stories" AS PERMISSIVE FOR DELETE TO "authenticated", "worker" USING ((is_admin_user() OR is_worker_role()));--> statement-breakpoint
CREATE POLICY "stories_insert_consolidated" ON "stories" AS PERMISSIVE FOR INSERT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "stories_select_consolidated" ON "stories" AS PERMISSIVE FOR SELECT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "stories_update_consolidated" ON "stories" AS PERMISSIVE FOR UPDATE TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "story_embeddings_delete_consolidated" ON "story_embeddings" AS PERMISSIVE FOR DELETE TO "authenticated", "worker" USING ((is_admin_user() OR is_worker_role()));--> statement-breakpoint
CREATE POLICY "story_embeddings_insert_consolidated" ON "story_embeddings" AS PERMISSIVE FOR INSERT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "story_embeddings_select_consolidated" ON "story_embeddings" AS PERMISSIVE FOR SELECT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "story_embeddings_update_consolidated" ON "story_embeddings" AS PERMISSIVE FOR UPDATE TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "story_overlays_delete_consolidated" ON "story_overlays" AS PERMISSIVE FOR DELETE TO "authenticated", "worker" USING ((is_admin_user() OR is_worker_role()));--> statement-breakpoint
CREATE POLICY "story_overlays_insert_consolidated" ON "story_overlays" AS PERMISSIVE FOR INSERT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "story_overlays_select_consolidated" ON "story_overlays" AS PERMISSIVE FOR SELECT TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "story_overlays_update_consolidated" ON "story_overlays" AS PERMISSIVE FOR UPDATE TO "authenticated", "worker";--> statement-breakpoint
CREATE POLICY "subscriptions_select_own" ON "subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id));--> statement-breakpoint
CREATE POLICY "users_select_own" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = id));--> statement-breakpoint
CREATE POLICY "users_update_own" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "job_metrics_admin_select" ON "job_metrics" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_user());--> statement-breakpoint
CREATE POLICY "job_metrics_worker_all" ON "job_metrics" AS PERMISSIVE FOR ALL TO "worker";
*/