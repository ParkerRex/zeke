-- Create new chat tables for the assistant
CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

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

-- Add indexes for the chat tables
CREATE INDEX IF NOT EXISTS "chats_team_id_idx" ON "chats" ("team_id");
CREATE INDEX IF NOT EXISTS "chats_user_id_idx" ON "chats" ("user_id");
CREATE INDEX IF NOT EXISTS "chats_updated_at_idx" ON "chats" ("updated_at");

CREATE INDEX IF NOT EXISTS "chat_messages_chat_id_idx" ON "chat_messages" ("chat_id");
CREATE INDEX IF NOT EXISTS "chat_messages_team_id_idx" ON "chat_messages" ("team_id");
CREATE INDEX IF NOT EXISTS "chat_messages_user_id_idx" ON "chat_messages" ("user_id");
CREATE INDEX IF NOT EXISTS "chat_messages_created_at_idx" ON "chat_messages" ("created_at");

CREATE INDEX IF NOT EXISTS "chat_feedback_chat_id_idx" ON "chat_feedback" ("chat_id");
CREATE INDEX IF NOT EXISTS "chat_feedback_message_id_idx" ON "chat_feedback" ("message_id");
CREATE INDEX IF NOT EXISTS "chat_feedback_team_id_idx" ON "chat_feedback" ("team_id");
CREATE INDEX IF NOT EXISTS "chat_feedback_user_id_idx" ON "chat_feedback" ("user_id");
CREATE INDEX IF NOT EXISTS "chat_feedback_type_idx" ON "chat_feedback" ("type");
CREATE INDEX IF NOT EXISTS "chat_feedback_created_at_idx" ON "chat_feedback" ("created_at");

-- Add foreign key constraints
ALTER TABLE "chats" ADD CONSTRAINT "chats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;