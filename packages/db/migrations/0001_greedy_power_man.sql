CREATE TYPE "public"."activity_source" AS ENUM('system', 'user');--> statement-breakpoint
CREATE TYPE "public"."activity_status" AS ENUM('unread', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('story_published', 'story_pinned', 'highlight_created', 'highlight_pinned', 'playbook_created', 'playbook_published', 'goal_created', 'goal_completed', 'subscription_upgraded', 'subscription_downgraded');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('ok', 'warn', 'error');--> statement-breakpoint
CREATE TYPE "public"."highlight_collaborator_role" AS ENUM('viewer', 'editor');--> statement-breakpoint
CREATE TYPE "public"."highlight_kind" AS ENUM('insight', 'quote', 'action', 'question', 'code_example', 'code_change', 'api_change', 'metric');--> statement-breakpoint
CREATE TYPE "public"."highlight_origin" AS ENUM('user', 'system');--> statement-breakpoint
CREATE TYPE "public"."highlight_share_scope" AS ENUM('private', 'team', 'public');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."plan_code" AS ENUM('trial', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."plans" AS ENUM('trial', 'starter', 'pro');--> statement-breakpoint
CREATE TYPE "public"."playbook_run_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."playbook_status" AS ENUM('draft', 'active', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."story_kind" AS ENUM('article', 'video', 'podcast', 'pdf', 'tweet');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."teamRoles" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid,
	"type" "activity_type" NOT NULL,
	"priority" smallint DEFAULT 5,
	"group_id" uuid,
	"source" "activity_source" NOT NULL,
	"metadata" jsonb NOT NULL,
	"status" "activity_status" DEFAULT 'unread' NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_encrypted" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"key_hash" text,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid DEFAULT gen_random_uuid(),
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"app_id" text NOT NULL,
	"created_by" uuid DEFAULT gen_random_uuid(),
	"settings" jsonb,
	CONSTRAINT "unique_app_id_team_id" UNIQUE("team_id","app_id")
);
--> statement-breakpoint
ALTER TABLE "apps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"avatar_url" text,
	"profile_url" text
);
--> statement-breakpoint
CREATE TABLE "chat_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"message_id" text NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "highlight_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"highlight_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "highlight_collaborator_role" DEFAULT 'viewer' NOT NULL,
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
	"origin" "highlight_origin" DEFAULT 'user' NOT NULL,
	"title" text,
	"summary" text,
	"quote" text,
	"start_seconds" numeric(10, 2),
	"end_seconds" numeric(10, 2),
	"confidence" numeric(3, 2),
	"is_generated" boolean DEFAULT false,
	"metadata" jsonb,
	"origin_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"notification_type" text NOT NULL,
	"channel" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_team_type_channel_key" UNIQUE("user_id","team_id","notification_type","channel")
);
--> statement-breakpoint
ALTER TABLE "notification_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oauth_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"refresh_token" text,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"scopes" text[] NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"refresh_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked" boolean DEFAULT false,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "oauth_access_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "oauth_access_tokens_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "oauth_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"overview" text,
	"developer_name" text,
	"logo_url" text,
	"website" text,
	"install_url" text,
	"screenshots" text[] DEFAULT '{}'::text[],
	"redirect_uris" text[] NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"team_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_public" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"status" text DEFAULT 'draft',
	CONSTRAINT "oauth_applications_slug_unique" UNIQUE("slug"),
	CONSTRAINT "oauth_applications_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
ALTER TABLE "oauth_applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "oauth_authorization_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"scopes" text[] NOT NULL,
	"redirect_uri" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used" boolean DEFAULT false,
	"code_challenge" text,
	"code_challenge_method" text,
	CONSTRAINT "oauth_authorization_codes_code_unique" UNIQUE("code")
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
CREATE TABLE "playbook_run_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"step_id" uuid,
	"event_type" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playbook_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playbook_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"triggered_by" uuid,
	"trigger_source" text,
	"status" "playbook_run_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
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
	"created_by" uuid NOT NULL,
	"status" "playbook_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"published_at" timestamp with time zone
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
	"analyzed_at" timestamp with time zone,
	"brief_one_liner" text,
	"brief_two_liner" text,
	"brief_elevator" text,
	"time_saved_seconds" integer,
	"brief_generated_at" timestamp with time zone
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
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "unique_tag_name" UNIQUE("team_id","name")
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "team_highlight_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"highlight_id" uuid NOT NULL,
	"state" text DEFAULT 'active',
	"pinned_by" uuid,
	"shared_scope" "highlight_share_scope" DEFAULT 'private' NOT NULL,
	"shared_by" uuid,
	"shared_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now()
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"logo_url" text,
	"email" text,
	"canceled_at" timestamp with time zone,
	"plan" "plans" DEFAULT 'trial' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid,
	"email" text,
	"role" "teamRoles",
	"code" text DEFAULT 'nanoid(24)',
	"invited_by" uuid,
	CONSTRAINT "unique_team_invite" UNIQUE("team_id","email"),
	CONSTRAINT "user_invites_code_key" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "user_invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"email" text,
	"team_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"locale" text DEFAULT 'en',
	"week_starts_on_monday" boolean DEFAULT false,
	"timezone" text,
	"timezone_auto_sync" boolean DEFAULT true,
	"time_format" numeric DEFAULT 24,
	"date_format" text
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users_on_team" (
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"role" "teamRoles",
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "members_pkey" PRIMARY KEY("user_id","team_id","id")
);
--> statement-breakpoint
ALTER TABLE "users_on_team" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "integrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_raw_item_id_raw_items_id_fk" FOREIGN KEY ("raw_item_id") REFERENCES "public"."raw_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_collaborators" ADD CONSTRAINT "highlight_collaborators_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_collaborators" ADD CONSTRAINT "highlight_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_references" ADD CONSTRAINT "highlight_references_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_references" ADD CONSTRAINT "highlight_references_turn_id_story_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."story_turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_tags" ADD CONSTRAINT "highlight_tags_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_chapter_id_story_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."story_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."oauth_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_applications" ADD CONSTRAINT "oauth_applications_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_applications" ADD CONSTRAINT "oauth_applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."oauth_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_outputs" ADD CONSTRAINT "playbook_outputs_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_run_events" ADD CONSTRAINT "playbook_run_events_run_id_playbook_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."playbook_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_run_events" ADD CONSTRAINT "playbook_run_events_step_id_playbook_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."playbook_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_runs" ADD CONSTRAINT "playbook_runs_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_runs" ADD CONSTRAINT "playbook_runs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_runs" ADD CONSTRAINT "playbook_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "tags" ADD CONSTRAINT "tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD CONSTRAINT "team_highlight_states_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD CONSTRAINT "team_highlight_states_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD CONSTRAINT "team_highlight_states_pinned_by_users_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD CONSTRAINT "team_highlight_states_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_story_states" ADD CONSTRAINT "team_story_states_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_story_states" ADD CONSTRAINT "team_story_states_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "public_user_invites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_notifications_idx" ON "activities" USING btree ("team_id","priority","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_insights_idx" ON "activities" USING btree ("team_id","type","source","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_metadata_gin_idx" ON "activities" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "activities_group_id_idx" ON "activities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "activities_insights_group_idx" ON "activities" USING btree ("team_id","group_id","type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "api_keys_key_idx" ON "api_keys" USING btree ("key_hash" text_ops);--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "api_keys_team_id_idx" ON "api_keys" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "authors_slug_key" ON "authors" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "chat_feedback_chat_id_idx" ON "chat_feedback" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_feedback_message_id_idx" ON "chat_feedback" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "chat_feedback_team_id_idx" ON "chat_feedback" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "chat_feedback_user_id_idx" ON "chat_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_feedback_type_idx" ON "chat_feedback" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_feedback_created_at_idx" ON "chat_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_chat_id_idx" ON "chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_messages_team_id_idx" ON "chat_messages" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chats_team_id_idx" ON "chats" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "chats_user_id_idx" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chats_updated_at_idx" ON "chats" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contents_raw_item_key" ON "contents" USING btree ("raw_item_id");--> statement-breakpoint
CREATE INDEX "contents_content_hash_idx" ON "contents" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "contents_audio_url_idx" ON "contents" USING btree ("audio_url") WHERE (audio_url IS NOT NULL);--> statement-breakpoint
CREATE INDEX "contents_transcript_url_idx" ON "contents" USING btree ("transcript_url") WHERE (transcript_url IS NOT NULL);--> statement-breakpoint
CREATE INDEX "contents_transcript_vtt_idx" ON "contents" USING btree ("id") WHERE (transcript_vtt IS NOT NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "highlight_collaborators_unique" ON "highlight_collaborators" USING btree ("highlight_id","user_id");--> statement-breakpoint
CREATE INDEX "highlight_collaborators_user_idx" ON "highlight_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "highlight_refs_highlight_idx" ON "highlight_references" USING btree ("highlight_id");--> statement-breakpoint
CREATE INDEX "highlight_refs_turn_idx" ON "highlight_references" USING btree ("turn_id");--> statement-breakpoint
CREATE INDEX "highlight_tags_highlight_idx" ON "highlight_tags" USING btree ("highlight_id");--> statement-breakpoint
CREATE INDEX "highlight_tags_tag_idx" ON "highlight_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "highlights_story_idx" ON "highlights" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "highlights_team_idx" ON "highlights" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "highlights_chapter_idx" ON "highlights" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "highlights_origin_idx" ON "highlights" USING btree ("origin");--> statement-breakpoint
CREATE INDEX "notification_settings_user_team_idx" ON "notification_settings" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE INDEX "notification_settings_type_channel_idx" ON "notification_settings" USING btree ("notification_type","channel");--> statement-breakpoint
CREATE INDEX "notifications_team_id_idx" ON "notifications" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_token_idx" ON "oauth_access_tokens" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_refresh_token_idx" ON "oauth_access_tokens" USING btree ("refresh_token" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_application_id_idx" ON "oauth_access_tokens" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_user_id_idx" ON "oauth_access_tokens" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "oauth_applications_team_id_idx" ON "oauth_applications" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "oauth_applications_client_id_idx" ON "oauth_applications" USING btree ("client_id" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_applications_slug_idx" ON "oauth_applications" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_authorization_codes_code_idx" ON "oauth_authorization_codes" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_authorization_codes_application_id_idx" ON "oauth_authorization_codes" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "oauth_authorization_codes_user_id_idx" ON "oauth_authorization_codes" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "playbook_outputs_playbook_idx" ON "playbook_outputs" USING btree ("playbook_id");--> statement-breakpoint
CREATE INDEX "playbook_run_events_run_idx" ON "playbook_run_events" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "playbook_run_events_step_idx" ON "playbook_run_events" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "playbook_run_events_type_idx" ON "playbook_run_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "playbook_runs_playbook_idx" ON "playbook_runs" USING btree ("playbook_id");--> statement-breakpoint
CREATE INDEX "playbook_runs_team_idx" ON "playbook_runs" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "playbook_runs_status_idx" ON "playbook_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "playbook_step_highlights_key" ON "playbook_step_highlights" USING btree ("playbook_step_id","highlight_id");--> statement-breakpoint
CREATE INDEX "playbook_steps_playbook_idx" ON "playbook_steps" USING btree ("playbook_id");--> statement-breakpoint
CREATE INDEX "playbook_steps_position_idx" ON "playbook_steps" USING btree ("position");--> statement-breakpoint
CREATE INDEX "playbook_template_steps_template_idx" ON "playbook_template_steps" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "playbook_template_steps_position_idx" ON "playbook_template_steps" USING btree ("position");--> statement-breakpoint
CREATE INDEX "playbook_templates_public_idx" ON "playbook_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "playbooks_team_idx" ON "playbooks" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "playbooks_story_idx" ON "playbooks" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "playbooks_status_idx" ON "playbooks" USING btree ("status");--> statement-breakpoint
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
CREATE INDEX "tags_team_id_idx" ON "tags" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "team_highlight_states_key" ON "team_highlight_states" USING btree ("team_id","highlight_id");--> statement-breakpoint
CREATE INDEX "team_highlight_states_scope_idx" ON "team_highlight_states" USING btree ("shared_scope");--> statement-breakpoint
CREATE UNIQUE INDEX "team_story_states_key" ON "team_story_states" USING btree ("team_id","story_id");--> statement-breakpoint
CREATE INDEX "team_story_states_pinned_idx" ON "team_story_states" USING btree ("pinned");--> statement-breakpoint
CREATE INDEX "user_invites_team_id_idx" ON "user_invites" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_team_id_idx" ON "users" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_on_team_team_id_idx" ON "users_on_team" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_on_team_user_id_idx" ON "users_on_team" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE OR REPLACE FUNCTION "private"."get_teams_for_authenticated_user"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select team_id
  from users_on_team
  where user_id = auth.uid()
$$;
--> statement-breakpoint
ALTER FUNCTION "private"."get_teams_for_authenticated_user"() OWNER TO "postgres";--> statement-breakpoint
CREATE POLICY "Apps can be deleted by a member of the team" ON "apps" AS PERMISSIVE FOR DELETE TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Apps can be inserted by a member of the team" ON "apps" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Apps can be selected by a member of the team" ON "apps" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Apps can be updated by a member of the team" ON "apps" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can manage their own notification settings" ON "notification_settings" AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "OAuth applications can be managed by team members" ON "oauth_applications" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Tags can be handled by a member of the team" ON "tags" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Invited users can select team if they are invited." ON "teams" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Teams can be deleted by a member of the team" ON "teams" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Teams can be selected by a member of the team" ON "teams" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Teams can be updated by a member of the team" ON "teams" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable select for users based on email" ON "user_invites" AS PERMISSIVE FOR SELECT TO public USING (((auth.jwt() ->> 'email'::text) = email));--> statement-breakpoint
CREATE POLICY "User Invites can be created by a member of the team" ON "user_invites" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "User Invites can be deleted by a member of the team" ON "user_invites" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "User Invites can be deleted by invited email" ON "user_invites" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "User Invites can be selected by a member of the team" ON "user_invites" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "User Invites can be updated by a member of the team" ON "user_invites" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can insert their own profile." ON "users" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can select their own profile." ON "users" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can select users if they are in the same team" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can update own profile." ON "users" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "users_on_team" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable updates for users on team" ON "users_on_team" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Select for current user teams" ON "users_on_team" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users on team can be deleted by a member of the team" ON "users_on_team" AS PERMISSIVE FOR DELETE TO public;