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
ALTER TABLE "teams" DROP CONSTRAINT "teams_owner_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "teams_owner_id_idx";--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "inbox_id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "inbox_email" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "inbox_forwarding" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "document_classification" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "canceled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "plan" "plan_code" DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_team_id_idx" ON "notifications" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "teams_inbox_id_key" ON "teams" USING btree ("inbox_id");--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "plan_code";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "updated_at";