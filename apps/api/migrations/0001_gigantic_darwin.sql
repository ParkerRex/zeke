CREATE TYPE "public"."highlight_collaborator_role" AS ENUM('viewer', 'editor');--> statement-breakpoint
CREATE TYPE "public"."highlight_origin" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."highlight_share_scope" AS ENUM('private', 'team', 'public');--> statement-breakpoint
CREATE TABLE "highlight_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"highlight_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "highlight_collaborator_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "highlights" ADD COLUMN "origin" "highlight_origin" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "highlights" ADD COLUMN "assistant_thread_id" uuid;--> statement-breakpoint
ALTER TABLE "highlights" ADD COLUMN "origin_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD COLUMN "shared_scope" "highlight_share_scope" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD COLUMN "shared_by" uuid;--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD COLUMN "shared_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "highlight_collaborators" ADD CONSTRAINT "highlight_collaborators_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_collaborators" ADD CONSTRAINT "highlight_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "highlight_collaborators_unique" ON "highlight_collaborators" USING btree ("highlight_id","user_id");--> statement-breakpoint
CREATE INDEX "highlight_collaborators_user_idx" ON "highlight_collaborators" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "team_highlight_states" ADD CONSTRAINT "team_highlight_states_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "highlights_origin_idx" ON "highlights" USING btree ("origin");--> statement-breakpoint
CREATE INDEX "team_highlight_states_scope_idx" ON "team_highlight_states" USING btree ("shared_scope");