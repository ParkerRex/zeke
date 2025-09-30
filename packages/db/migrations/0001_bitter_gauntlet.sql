ALTER TYPE "public"."highlight_kind" ADD VALUE 'code_example';--> statement-breakpoint
ALTER TYPE "public"."highlight_kind" ADD VALUE 'code_change';--> statement-breakpoint
ALTER TYPE "public"."highlight_kind" ADD VALUE 'api_change';--> statement-breakpoint
ALTER TYPE "public"."highlight_kind" ADD VALUE 'metric';--> statement-breakpoint
ALTER TABLE "story_overlays" ADD COLUMN "brief_one_liner" text;--> statement-breakpoint
ALTER TABLE "story_overlays" ADD COLUMN "brief_two_liner" text;--> statement-breakpoint
ALTER TABLE "story_overlays" ADD COLUMN "brief_elevator" text;--> statement-breakpoint
ALTER TABLE "story_overlays" ADD COLUMN "time_saved_seconds" integer;--> statement-breakpoint
ALTER TABLE "story_overlays" ADD COLUMN "brief_generated_at" timestamp with time zone;