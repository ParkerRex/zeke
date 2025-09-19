CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('story_published', 'story_pinned', 'highlight_created', 'highlight_pinned', 'playbook_created', 'playbook_published', 'assistant_thread_started', 'assistant_message_posted', 'goal_created', 'goal_completed', 'subscription_upgraded', 'subscription_downgraded');--> statement-breakpoint
CREATE TYPE "public"."activity_visibility" AS ENUM('team', 'personal', 'system');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('ok', 'warn', 'error');--> statement-breakpoint
CREATE TYPE "public"."highlight_kind" AS ENUM('insight', 'quote', 'action', 'question');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."plan_code" AS ENUM('trial', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."playbook_status" AS ENUM('draft', 'active', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."pricing_plan_interval" AS ENUM('day', 'week', 'month', 'year');--> statement-breakpoint
CREATE TYPE "public"."pricing_type" AS ENUM('one_time', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."story_kind" AS ENUM('article', 'video', 'podcast', 'pdf', 'tweet');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."thread_status" AS ENUM('active', 'resolved', 'archived');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"actor_id" uuid,
	"type" "activity_type" NOT NULL,
	"visibility" "activity_visibility" DEFAULT 'team' NOT NULL,
	"story_id" uuid,
	"highlight_id" uuid,
	"playbook_id" uuid,
	"thread_id" uuid,
	"goal_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assistant_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid,
	"role" "message_role" NOT NULL,
	"body" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assistant_thread_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"highlight_id" uuid,
	"turn_id" uuid,
	"added_by" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assistant_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"story_id" uuid,
	"playbook_id" uuid,
	"goal_id" uuid,
	"created_by" uuid NOT NULL,
	"topic" text,
	"status" "thread_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"avatar_url" text,
	"profile_url" text
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_item_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"text_body" text,
	"html_url" text,
	"pdf_url" text,
	"audio_url" text,
	"language_code" text,
	"content_hash" text NOT NULL,
	"duration_seconds" integer,
	"view_count" bigint,
	"transcript_url" text,
	"transcript_vtt" text,
	"extracted_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_tag_assignments" (
	"customer_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "customer_tag_assignments_customer_id_tag_id_pk" PRIMARY KEY("customer_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "customer_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"persona" text,
	"status" text DEFAULT 'active',
	"owner_id" uuid,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "highlight_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"highlight_id" uuid NOT NULL,
	"turn_id" uuid NOT NULL,
	"source_url" text
);
--> statement-breakpoint
CREATE TABLE "highlight_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"highlight_id" uuid NOT NULL,
	"tag" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"team_id" uuid,
	"created_by" uuid NOT NULL,
	"chapter_id" uuid,
	"kind" "highlight_kind" DEFAULT 'insight' NOT NULL,
	"title" text,
	"summary" text,
	"quote" text,
	"start_seconds" numeric(10, 2),
	"end_seconds" numeric(10, 2),
	"confidence" numeric(3, 2),
	"is_generated" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_metrics" (
	"name" text NOT NULL,
	"state" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "job_metrics_name_state_pk" PRIMARY KEY("name","state")
);
--> statement-breakpoint
CREATE TABLE "message_source_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"highlight_id" uuid,
	"turn_id" uuid,
	"confidence" numeric(3, 2)
);
--> statement-breakpoint
CREATE TABLE "platform_quota" (
	"provider" text PRIMARY KEY NOT NULL,
	"quota_limit" integer,
	"used" integer,
	"remaining" integer,
	"reset_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playbook_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playbook_id" uuid NOT NULL,
	"output_type" text NOT NULL,
	"external_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playbook_step_highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playbook_step_id" uuid NOT NULL,
	"highlight_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbook_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playbook_id" uuid NOT NULL,
	"template_step_id" uuid,
	"assigned_to" uuid,
	"status" "step_status" DEFAULT 'pending' NOT NULL,
	"content" text,
	"position" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "playbook_template_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"title" text NOT NULL,
	"output_type" text,
	"position" integer DEFAULT 0 NOT NULL,
	"default_payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "playbook_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_role" text,
	"default_channel" text,
	"is_public" boolean DEFAULT false,
	"metadata" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playbooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"story_id" uuid,
	"template_id" uuid,
	"customer_id" uuid,
	"goal_id" uuid,
	"created_by" uuid NOT NULL,
	"status" "playbook_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"active" boolean DEFAULT true,
	"currency" text NOT NULL,
	"type" "pricing_type" NOT NULL,
	"unit_amount" bigint,
	"interval" "pricing_plan_interval",
	"interval_count" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "raw_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"kind" text DEFAULT 'article' NOT NULL,
	"title" text,
	"url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"published_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "source_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"sync_status" text DEFAULT 'active',
	"last_synced_at" timestamp with time zone,
	"filters" jsonb
);
--> statement-breakpoint
CREATE TABLE "source_health" (
	"source_id" uuid PRIMARY KEY NOT NULL,
	"status" "health_status" NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	"message" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"url" text,
	"authority_score" numeric(3, 2),
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"cluster_id" uuid,
	"primary_source_id" uuid,
	"title" text,
	"summary" text,
	"kind" "story_kind" DEFAULT 'article' NOT NULL,
	"primary_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"asset_type" text NOT NULL,
	"external_url" text NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "story_authors" (
	"story_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"role" text DEFAULT 'author',
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "story_authors_story_id_author_id_pk" PRIMARY KEY("story_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "story_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "story_category_links" (
	"story_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "story_category_links_story_id_category_id_pk" PRIMARY KEY("story_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "story_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"title" text,
	"summary" text,
	"start_seconds" numeric(10, 2),
	"end_seconds" numeric(10, 2),
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cluster_key" text NOT NULL,
	"label" text,
	"primary_story_id" uuid,
	"metrics" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_embeddings" (
	"story_id" uuid PRIMARY KEY NOT NULL,
	"model_version" text,
	"embedding" vector(1536),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"visibility" text DEFAULT 'team' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_overlays" (
	"story_id" uuid PRIMARY KEY NOT NULL,
	"why_it_matters" text,
	"confidence" numeric(3, 2),
	"citations" jsonb,
	"analysis_state" text DEFAULT 'pending',
	"analyzed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "story_tag_embeddings" (
	"tag_id" uuid PRIMARY KEY NOT NULL,
	"model_version" text NOT NULL,
	"embedding" vector(1536),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"chapter_id" uuid,
	"speaker" text,
	"start_seconds" numeric(10, 2),
	"end_seconds" numeric(10, 2),
	"content" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" uuid NOT NULL,
	"price_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"plan_code" "plan_code" NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"customer_id" uuid,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"goal_type" text NOT NULL,
	"status" text DEFAULT 'active',
	"success_metrics" jsonb,
	"doc_refs" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_highlight_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"highlight_id" uuid NOT NULL,
	"state" text DEFAULT 'active',
	"pinned_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"invited_by" uuid,
	"email" text NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_story_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	"state" text DEFAULT 'unread',
	"pinned" boolean DEFAULT false,
	"rating" integer,
	"last_viewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" uuid,
	"stripe_customer_id" text,
	"plan_code" "plan_code" DEFAULT 'trial',
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"job_title" text,
	"preferences" jsonb,
	"timezone" text DEFAULT 'UTC',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_thread_id_assistant_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."assistant_threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_goal_id_team_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."team_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_thread_id_assistant_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."assistant_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_thread_sources" ADD CONSTRAINT "assistant_thread_sources_thread_id_assistant_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."assistant_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_thread_sources" ADD CONSTRAINT "assistant_thread_sources_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_thread_sources" ADD CONSTRAINT "assistant_thread_sources_turn_id_story_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."story_turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_thread_sources" ADD CONSTRAINT "assistant_thread_sources_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_goal_id_team_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."team_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_raw_item_id_raw_items_id_fk" FOREIGN KEY ("raw_item_id") REFERENCES "public"."raw_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tag_assignments" ADD CONSTRAINT "customer_tag_assignments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tag_assignments" ADD CONSTRAINT "customer_tag_assignments_tag_id_customer_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."customer_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_references" ADD CONSTRAINT "highlight_references_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_references" ADD CONSTRAINT "highlight_references_turn_id_story_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."story_turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_tags" ADD CONSTRAINT "highlight_tags_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_chapter_id_story_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."story_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_source_links" ADD CONSTRAINT "message_source_links_message_id_assistant_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."assistant_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_source_links" ADD CONSTRAINT "message_source_links_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_source_links" ADD CONSTRAINT "message_source_links_turn_id_story_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."story_turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_outputs" ADD CONSTRAINT "playbook_outputs_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_step_highlights" ADD CONSTRAINT "playbook_step_highlights_playbook_step_id_playbook_steps_id_fk" FOREIGN KEY ("playbook_step_id") REFERENCES "public"."playbook_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_step_highlights" ADD CONSTRAINT "playbook_step_highlights_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_steps" ADD CONSTRAINT "playbook_steps_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_steps" ADD CONSTRAINT "playbook_steps_template_step_id_playbook_template_steps_id_fk" FOREIGN KEY ("template_step_id") REFERENCES "public"."playbook_template_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_steps" ADD CONSTRAINT "playbook_steps_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_template_steps" ADD CONSTRAINT "playbook_template_steps_template_id_playbook_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."playbook_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_templates" ADD CONSTRAINT "playbook_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_template_id_playbook_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."playbook_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_goal_id_team_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."team_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_items" ADD CONSTRAINT "raw_items_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_connections" ADD CONSTRAINT "source_connections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_connections" ADD CONSTRAINT "source_connections_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_health" ADD CONSTRAINT "source_health_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_cluster_id_story_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."story_clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_primary_source_id_sources_id_fk" FOREIGN KEY ("primary_source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_assets" ADD CONSTRAINT "story_assets_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_authors" ADD CONSTRAINT "story_authors_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_authors" ADD CONSTRAINT "story_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_category_links" ADD CONSTRAINT "story_category_links_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_category_links" ADD CONSTRAINT "story_category_links_category_id_story_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."story_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_chapters" ADD CONSTRAINT "story_chapters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_embeddings" ADD CONSTRAINT "story_embeddings_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_notes" ADD CONSTRAINT "story_notes_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_notes" ADD CONSTRAINT "story_notes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_notes" ADD CONSTRAINT "story_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_overlays" ADD CONSTRAINT "story_overlays_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tag_embeddings" ADD CONSTRAINT "story_tag_embeddings_tag_id_story_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."story_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tags" ADD CONSTRAINT "story_tags_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tags" ADD CONSTRAINT "story_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_turns" ADD CONSTRAINT "story_turns_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_turns" ADD CONSTRAINT "story_turns_chapter_id_story_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."story_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_price_id_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_goals" ADD CONSTRAINT "team_goals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_goals" ADD CONSTRAINT "team_goals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_goals" ADD CONSTRAINT "team_goals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD CONSTRAINT "team_highlight_states_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD CONSTRAINT "team_highlight_states_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD CONSTRAINT "team_highlight_states_pinned_by_users_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_story_states" ADD CONSTRAINT "team_story_states_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_story_states" ADD CONSTRAINT "team_story_states_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_team_idx" ON "activities" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "activities_created_at_idx" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "assistant_messages_thread_idx" ON "assistant_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "assistant_messages_created_idx" ON "assistant_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "assistant_thread_sources_thread_idx" ON "assistant_thread_sources" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "assistant_threads_team_idx" ON "assistant_threads" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "assistant_threads_story_idx" ON "assistant_threads" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "assistant_threads_status_idx" ON "assistant_threads" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "authors_slug_key" ON "authors" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "contents_raw_item_key" ON "contents" USING btree ("raw_item_id");--> statement-breakpoint
CREATE INDEX "contents_content_hash_idx" ON "contents" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "contents_audio_url_idx" ON "contents" USING btree ("audio_url") WHERE (audio_url IS NOT NULL);--> statement-breakpoint
CREATE INDEX "contents_transcript_url_idx" ON "contents" USING btree ("transcript_url") WHERE (transcript_url IS NOT NULL);--> statement-breakpoint
CREATE INDEX "contents_transcript_vtt_idx" ON "contents" USING btree ("id") WHERE (transcript_vtt IS NOT NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "customer_tags_team_name_key" ON "customer_tags" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "customers_team_id_idx" ON "customers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "customers_owner_id_idx" ON "customers" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "highlight_refs_highlight_idx" ON "highlight_references" USING btree ("highlight_id");--> statement-breakpoint
CREATE INDEX "highlight_refs_turn_idx" ON "highlight_references" USING btree ("turn_id");--> statement-breakpoint
CREATE INDEX "highlight_tags_highlight_idx" ON "highlight_tags" USING btree ("highlight_id");--> statement-breakpoint
CREATE INDEX "highlight_tags_tag_idx" ON "highlight_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "highlights_story_idx" ON "highlights" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "highlights_team_idx" ON "highlights" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "highlights_chapter_idx" ON "highlights" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "message_source_links_message_idx" ON "message_source_links" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "playbook_outputs_playbook_idx" ON "playbook_outputs" USING btree ("playbook_id");--> statement-breakpoint
CREATE UNIQUE INDEX "playbook_step_highlights_key" ON "playbook_step_highlights" USING btree ("playbook_step_id","highlight_id");--> statement-breakpoint
CREATE INDEX "playbook_steps_playbook_idx" ON "playbook_steps" USING btree ("playbook_id");--> statement-breakpoint
CREATE INDEX "playbook_steps_position_idx" ON "playbook_steps" USING btree ("position");--> statement-breakpoint
CREATE INDEX "playbook_template_steps_template_idx" ON "playbook_template_steps" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "playbook_template_steps_position_idx" ON "playbook_template_steps" USING btree ("position");--> statement-breakpoint
CREATE INDEX "playbook_templates_public_idx" ON "playbook_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "playbooks_team_idx" ON "playbooks" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "playbooks_story_idx" ON "playbooks" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "playbooks_customer_idx" ON "playbooks" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "playbooks_status_idx" ON "playbooks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prices_product_idx" ON "prices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "prices_active_idx" ON "prices" USING btree ("active");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_items_source_external_key" ON "raw_items" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "raw_items_status_idx" ON "raw_items" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "source_connections_team_source_key" ON "source_connections" USING btree ("team_id","source_id");--> statement-breakpoint
CREATE INDEX "sources_type_idx" ON "sources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sources_active_idx" ON "sources" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "stories_content_key" ON "stories" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "stories_cluster_idx" ON "stories" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "stories_source_idx" ON "stories" USING btree ("primary_source_id");--> statement-breakpoint
CREATE INDEX "stories_published_at_idx" ON "stories" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "story_assets_story_idx" ON "story_assets" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_assets_type_idx" ON "story_assets" USING btree ("asset_type");--> statement-breakpoint
CREATE UNIQUE INDEX "story_categories_slug_key" ON "story_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "story_chapters_story_idx" ON "story_chapters" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_chapters_position_idx" ON "story_chapters" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "story_clusters_key" ON "story_clusters" USING btree ("cluster_key");--> statement-breakpoint
CREATE INDEX "story_clusters_primary_story_idx" ON "story_clusters" USING btree ("primary_story_id");--> statement-breakpoint
CREATE INDEX "story_notes_story_team_idx" ON "story_notes" USING btree ("story_id","team_id");--> statement-breakpoint
CREATE INDEX "story_tag_embeddings_model_idx" ON "story_tag_embeddings" USING btree ("model_version");--> statement-breakpoint
CREATE INDEX "story_tags_story_idx" ON "story_tags" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_tags_tag_idx" ON "story_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "story_turns_story_idx" ON "story_turns" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_turns_chapter_idx" ON "story_turns" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "story_turns_position_idx" ON "story_turns" USING btree ("position");--> statement-breakpoint
CREATE INDEX "subscriptions_team_idx" ON "subscriptions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_code_idx" ON "subscriptions" USING btree ("plan_code");--> statement-breakpoint
CREATE INDEX "team_goals_team_id_idx" ON "team_goals" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_goals_customer_id_idx" ON "team_goals" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_highlight_states_key" ON "team_highlight_states" USING btree ("team_id","highlight_id");--> statement-breakpoint
CREATE INDEX "team_invites_team_email_idx" ON "team_invites" USING btree ("team_id","email");--> statement-breakpoint
CREATE INDEX "team_invites_status_idx" ON "team_invites" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_user_key" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_story_states_key" ON "team_story_states" USING btree ("team_id","story_id");--> statement-breakpoint
CREATE INDEX "team_story_states_pinned_idx" ON "team_story_states" USING btree ("pinned");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_key" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_stripe_customer_id_key" ON "teams" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "teams_owner_id_idx" ON "teams" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
