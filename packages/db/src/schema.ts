/**
 * Revised Drizzle Schema for Zeke
 * Based on docs/plans/in-progress/db-proposed-er.md
 *
 * This schema implements the Discover → Apply content intelligence pipeline
 * with multi-tenant support, story intelligence, highlights, playbooks, and assistant features.
 */

import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	foreignKey,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	pgView,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

// ============================================================================
// ENUMS
// ============================================================================

export const healthStatus = pgEnum("health_status", ["ok", "warn", "error"]);
export const pricingPlanInterval = pgEnum("pricing_plan_interval", [
	"day",
	"week",
	"month",
	"year",
]);
export const pricingType = pgEnum("pricing_type", ["one_time", "recurring"]);
export const subscriptionStatus = pgEnum("subscription_status", [
	"trialing",
	"active",
	"canceled",
	"incomplete",
	"incomplete_expired",
	"past_due",
	"unpaid",
	"paused",
]);
export const planCodeEnum = pgEnum("plan_code", [
	"trial",
	"starter",
	"pro",
	"enterprise",
]);
export const teamRole = pgEnum("team_role", [
	"owner",
	"admin",
	"member",
	"viewer",
]);
export const inviteStatus = pgEnum("invite_status", [
	"pending",
	"accepted",
	"expired",
	"revoked",
]);
export const storyKind = pgEnum("story_kind", [
	"article",
	"video",
	"podcast",
	"pdf",
	"tweet",
]);
export const highlightKind = pgEnum("highlight_kind", [
	"insight",
	"quote",
	"action",
	"question",
]);
export const highlightOrigin = pgEnum("highlight_origin", [
	"user",
	"assistant",
	"system",
]);
export const highlightCollaboratorRole = pgEnum(
	"highlight_collaborator_role",
	["viewer", "editor"],
);
export const highlightShareScope = pgEnum("highlight_share_scope", [
	"private",
	"team",
	"public",
]);
export const playbookStatus = pgEnum("playbook_status", [
	"draft",
	"active",
	"published",
	"archived",
]);
export const stepStatus = pgEnum("step_status", [
	"pending",
	"in_progress",
	"completed",
	"skipped",
]);
export const threadStatus = pgEnum("thread_status", [
	"active",
	"resolved",
	"archived",
]);
export const messageRole = pgEnum("message_role", [
	"user",
	"assistant",
	"system",
]);

export const activityTypeEnum = pgEnum("activity_type", [
	"story_published",
	"story_pinned",
	"highlight_created",
	"highlight_pinned",
	"playbook_created",
	"playbook_published",
	"assistant_thread_started",
	"assistant_message_posted",
	"goal_created",
	"goal_completed",
	"subscription_upgraded",
	"subscription_downgraded",
]);

export const activityVisibilityEnum = pgEnum("activity_visibility", [
	"team",
	"personal",
	"system",
]);

// ============================================================================
// USER & PROFILE TABLES
// ============================================================================

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().notNull(),
		email: text("email").notNull(),
		full_name: text("full_name"),
		avatar_url: text("avatar_url"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("users_email_key").using("btree", table.email),
		index("users_created_at_idx").using("btree", table.created_at),
	],
);

export const userProfiles = pgTable("user_profiles", {
	user_id: uuid("user_id")
		.primaryKey()
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	job_title: text("job_title"),
	preferences: jsonb("preferences"),
	timezone: text("timezone").default("UTC"),
	created_at: timestamp("created_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
	updated_at: timestamp("updated_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

// ============================================================================
// TEAM & MEMBERSHIP TABLES
// ============================================================================

export const teams = pgTable(
	"teams",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		owner_id: uuid("owner_id").references(() => users.id),
		stripe_customer_id: text("stripe_customer_id"),
		plan_code: planCodeEnum("plan_code").default("trial"),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("teams_slug_key").using("btree", table.slug),
		uniqueIndex("teams_stripe_customer_id_key").using(
			"btree",
			table.stripe_customer_id,
		),
		index("teams_owner_id_idx").using("btree", table.owner_id),
	],
);

export const teamMembers = pgTable(
	"team_members",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		user_id: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: teamRole("role").notNull().default("member"),
		status: text("status").notNull().default("active"),
		joined_at: timestamp("joined_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("team_members_team_user_key").using(
			"btree",
			table.team_id,
			table.user_id,
		),
		index("team_members_user_id_idx").using("btree", table.user_id),
	],
);

export const teamInvites = pgTable(
	"team_invites",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		invited_by: uuid("invited_by").references(() => users.id, {
			onDelete: "set null",
		}),
		email: text("email").notNull(),
		role: teamRole("role").notNull().default("member"),
		status: inviteStatus("status").notNull().default("pending"),
		expires_at: timestamp("expires_at", { withTimezone: true, mode: "string" }),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("team_invites_team_email_idx").using(
			"btree",
			table.team_id,
			table.email,
		),
		index("team_invites_status_idx").using("btree", table.status),
	],
);

// ============================================================================
// CUSTOMER & GOAL TABLES
// ============================================================================

export const customers = pgTable(
	"customers",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		persona: text("persona"),
		status: text("status").default("active"),
		owner_id: uuid("owner_id").references(() => users.id, {
			onDelete: "set null",
		}),
		context: jsonb("context"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("customers_team_id_idx").using("btree", table.team_id),
		index("customers_owner_id_idx").using("btree", table.owner_id),
	],
);

export const customerTags = pgTable(
	"customer_tags",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color"),
	},
	(table) => [
		uniqueIndex("customer_tags_team_name_key").using(
			"btree",
			table.team_id,
			table.name,
		),
	],
);

export const customerTagAssignments = pgTable(
	"customer_tag_assignments",
	{
		customer_id: uuid("customer_id")
			.notNull()
			.references(() => customers.id, { onDelete: "cascade" }),
		tag_id: uuid("tag_id")
			.notNull()
			.references(() => customerTags.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.customer_id, table.tag_id] })],
);

export const teamGoals = pgTable(
	"team_goals",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		customer_id: uuid("customer_id").references(() => customers.id, {
			onDelete: "set null",
		}),
		created_by: uuid("created_by")
			.notNull()
			.references(() => users.id),
		title: text("title").notNull(),
		goal_type: text("goal_type").notNull(),
		status: text("status").default("active"),
		success_metrics: jsonb("success_metrics"),
		doc_refs: jsonb("doc_refs"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("team_goals_team_id_idx").using("btree", table.team_id),
		index("team_goals_customer_id_idx").using("btree", table.customer_id),
	],
);

// ============================================================================
// SOURCE & INGESTION TABLES
// ============================================================================

export const sources = pgTable(
	"sources",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		type: text("type").notNull(), // rss, youtube_channel, youtube_search, pdf, etc.
		name: text("name"),
		url: text("url"),
		authority_score: numeric("authority_score", { precision: 3, scale: 2 }),
		is_active: boolean("is_active").default(true),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("sources_type_idx").using("btree", table.type),
		index("sources_active_idx").using("btree", table.is_active),
	],
);

export const sourceConnections = pgTable(
	"source_connections",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		source_id: uuid("source_id")
			.notNull()
			.references(() => sources.id, { onDelete: "cascade" }),
		sync_status: text("sync_status").default("active"),
		last_synced_at: timestamp("last_synced_at", {
			withTimezone: true,
			mode: "string",
		}),
		filters: jsonb("filters"),
	},
	(table) => [
		uniqueIndex("source_connections_team_source_key").using(
			"btree",
			table.team_id,
			table.source_id,
		),
	],
);

export const rawItems = pgTable(
	"raw_items",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		source_id: uuid("source_id")
			.notNull()
			.references(() => sources.id, { onDelete: "cascade" }),
		external_id: text("external_id").notNull(),
		kind: text("kind").notNull().default("article"),
		title: text("title"),
		url: text("url"),
		status: text("status").notNull().default("pending"),
		published_at: timestamp("published_at", {
			withTimezone: true,
			mode: "string",
		}),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("raw_items_source_external_key").using(
			"btree",
			table.source_id,
			table.external_id,
		),
		index("raw_items_status_idx").using("btree", table.status),
	],
);

export const contents = pgTable(
	"contents",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		raw_item_id: uuid("raw_item_id")
			.notNull()
			.references(() => rawItems.id, { onDelete: "cascade" }),
		content_type: text("content_type").notNull(), // text, transcript, pdf, etc.
		text_body: text("text_body"),
		html_url: text("html_url"),
		pdf_url: text("pdf_url"),
		audio_url: text("audio_url"),
		language_code: text("language_code"),
		content_hash: text("content_hash").notNull(), // Hash for deduplication
		duration_seconds: integer("duration_seconds"),
		view_count: bigint("view_count", { mode: "number" }),
		transcript_url: text("transcript_url"),
		transcript_vtt: text("transcript_vtt"),
		extracted_at: timestamp("extracted_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("contents_raw_item_key").using("btree", table.raw_item_id),
		index("contents_content_hash_idx").using("btree", table.content_hash),
		index("contents_audio_url_idx")
			.using("btree", table.audio_url)
			.where(sql`(audio_url IS NOT NULL)`),
		index("contents_transcript_url_idx")
			.using("btree", table.transcript_url)
			.where(sql`(transcript_url IS NOT NULL)`),
		index("contents_transcript_vtt_idx")
			.using("btree", table.id)
			.where(sql`(transcript_vtt IS NOT NULL)`),
	],
);

// ============================================================================
// STORY & CLUSTER TABLES
// ============================================================================

export const storyClusters = pgTable(
	"story_clusters",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		cluster_key: text("cluster_key").notNull(),
		label: text("label"),
		primary_story_id: uuid("primary_story_id"),
		metrics: jsonb("metrics"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("story_clusters_key").using("btree", table.cluster_key),
		index("story_clusters_primary_story_idx").using(
			"btree",
			table.primary_story_id,
		),
	],
);

export const stories = pgTable(
	"stories",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		content_id: uuid("content_id")
			.notNull()
			.references(() => contents.id, { onDelete: "cascade" }),
		cluster_id: uuid("cluster_id").references(() => storyClusters.id, {
			onDelete: "set null",
		}),
		primary_source_id: uuid("primary_source_id").references(() => sources.id, {
			onDelete: "set null",
		}),
		title: text("title"),
		summary: text("summary"),
		kind: storyKind("kind").notNull().default("article"),
		primary_url: text("primary_url"),
		published_at: timestamp("published_at", {
			withTimezone: true,
			mode: "string",
		}),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("stories_content_key").using("btree", table.content_id),
		index("stories_cluster_idx").using("btree", table.cluster_id),
		index("stories_source_idx").using("btree", table.primary_source_id),
		index("stories_published_at_idx").using("btree", table.published_at),
	],
);

// Add foreign key constraint after story_clusters table is defined
export const storyClustersFk = foreignKey({
	columns: [storyClusters.primary_story_id],
	foreignColumns: [stories.id],
	name: "story_clusters_primary_story_fkey",
});

export const storyAssets = pgTable(
	"story_assets",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		asset_type: text("asset_type").notNull(), // video, audio, image, pdf
		external_url: text("external_url").notNull(), // YouTube URL, etc.
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("story_assets_story_idx").using("btree", table.story_id),
		index("story_assets_type_idx").using("btree", table.asset_type),
	],
);

// ============================================================================
// AUTHOR & CATEGORY TABLES
// ============================================================================

export const authors = pgTable(
	"authors",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		avatar_url: text("avatar_url"),
		profile_url: text("profile_url"),
	},
	(table) => [uniqueIndex("authors_slug_key").using("btree", table.slug)],
);

export const storyAuthors = pgTable(
	"story_authors",
	{
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		author_id: uuid("author_id")
			.notNull()
			.references(() => authors.id, { onDelete: "cascade" }),
		role: text("role").default("author"),
		position: integer("position").notNull().default(0),
	},
	(table) => [primaryKey({ columns: [table.story_id, table.author_id] })],
);

export const storyCategories = pgTable(
	"story_categories",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		slug: text("slug").notNull(),
		name: text("name").notNull(),
		description: text("description"),
	},
	(table) => [
		uniqueIndex("story_categories_slug_key").using("btree", table.slug),
	],
);

export const storyCategoryLinks = pgTable(
	"story_category_links",
	{
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		category_id: uuid("category_id")
			.notNull()
			.references(() => storyCategories.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.story_id, table.category_id] })],
);

export const storyTags = pgTable(
	"story_tags",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		tag: text("tag").notNull(),
		created_by: uuid("created_by").references(() => users.id, {
			onDelete: "set null",
		}),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("story_tags_story_idx").using("btree", table.story_id),
		index("story_tags_tag_idx").using("btree", table.tag),
	],
);

export const storyTagEmbeddings = pgTable(
	"story_tag_embeddings",
	{
		tag_id: uuid("tag_id")
			.primaryKey()
			.references(() => storyTags.id, { onDelete: "cascade" }),
		model_version: text("model_version").notNull(),
		embedding: vector("embedding", { dimensions: 1536 }),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("story_tag_embeddings_model_idx").using("btree", table.model_version),
	],
);

// ============================================================================
// STORY STRUCTURE TABLES (Chapters & Turns)
// ============================================================================

export const storyChapters = pgTable(
	"story_chapters",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		title: text("title"),
		summary: text("summary"),
		start_seconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		end_seconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		index("story_chapters_story_idx").using("btree", table.story_id),
		index("story_chapters_position_idx").using("btree", table.position),
	],
);

export const storyTurns = pgTable(
	"story_turns",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		chapter_id: uuid("chapter_id").references(() => storyChapters.id, {
			onDelete: "set null",
		}),
		speaker: text("speaker"),
		start_seconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		end_seconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		content: text("content"),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		index("story_turns_story_idx").using("btree", table.story_id),
		index("story_turns_chapter_idx").using("btree", table.chapter_id),
		index("story_turns_position_idx").using("btree", table.position),
	],
);

// ============================================================================
// STORY ANALYSIS TABLES
// ============================================================================

export const storyEmbeddings = pgTable("story_embeddings", {
	story_id: uuid("story_id")
		.primaryKey()
		.notNull()
		.references(() => stories.id, { onDelete: "cascade" }),
	model_version: text("model_version"),
	embedding: vector("embedding", { dimensions: 1536 }),
	updated_at: timestamp("updated_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

export const storyOverlays = pgTable("story_overlays", {
	story_id: uuid("story_id")
		.primaryKey()
		.notNull()
		.references(() => stories.id, { onDelete: "cascade" }),
	why_it_matters: text("why_it_matters"),
	confidence: numeric("confidence", { precision: 3, scale: 2 }),
	citations: jsonb("citations"),
	analysis_state: text("analysis_state").default("pending"),
	analyzed_at: timestamp("analyzed_at", { withTimezone: true, mode: "string" }),
});

// ============================================================================
// HIGHLIGHT TABLES
// ============================================================================

export const highlights = pgTable(
	"highlights",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		team_id: uuid("team_id").references(() => teams.id, {
			onDelete: "cascade",
		}), // null = global
		created_by: uuid("created_by")
			.notNull()
			.references(() => users.id),
		chapter_id: uuid("chapter_id").references(() => storyChapters.id, {
			onDelete: "set null",
		}),
		kind: highlightKind("kind").notNull().default("insight"),
		origin: highlightOrigin("origin").notNull().default("user"),
		assistant_thread_id: uuid("assistant_thread_id"),
		title: text("title"),
		summary: text("summary"),
		quote: text("quote"),
		start_seconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		end_seconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		confidence: numeric("confidence", { precision: 3, scale: 2 }),
		is_generated: boolean("is_generated").default(false),
		metadata: jsonb("metadata"),
		origin_metadata: jsonb("origin_metadata"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("highlights_story_idx").using("btree", table.story_id),
		index("highlights_team_idx").using("btree", table.team_id),
		index("highlights_chapter_idx").using("btree", table.chapter_id),
		index("highlights_origin_idx").using("btree", table.origin),
	],
);

export const highlightReferences = pgTable(
	"highlight_references",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		highlight_id: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
		turn_id: uuid("turn_id")
			.notNull()
			.references(() => storyTurns.id, { onDelete: "cascade" }),
		source_url: text("source_url"),
	},
	(table) => [
		index("highlight_refs_highlight_idx").using("btree", table.highlight_id),
		index("highlight_refs_turn_idx").using("btree", table.turn_id),
	],
);

export const highlightTags = pgTable(
	"highlight_tags",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		highlight_id: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
		tag: text("tag").notNull(),
	},
	(table) => [
		index("highlight_tags_highlight_idx").using("btree", table.highlight_id),
		index("highlight_tags_tag_idx").using("btree", table.tag),
	],
);

export const highlightCollaborators = pgTable(
	"highlight_collaborators",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		highlight_id: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
		user_id: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: highlightCollaboratorRole("role").notNull().default("viewer"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("highlight_collaborators_unique").using(
			"btree",
			table.highlight_id,
			table.user_id,
		),
		index("highlight_collaborators_user_idx").using("btree", table.user_id),
	],
);

// ============================================================================
// TEAM STATE TABLES
// ============================================================================

export const teamHighlightStates = pgTable(
	"team_highlight_states",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		highlight_id: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
		state: text("state").default("active"), // active, archived, etc.
		pinned_by: uuid("pinned_by").references(() => users.id, {
			onDelete: "set null",
		}),
		shared_scope: highlightShareScope("shared_scope").notNull().default("private"),
		shared_by: uuid("shared_by").references(() => users.id, {
			onDelete: "set null",
		}),
		shared_at: timestamp("shared_at", {
			withTimezone: true,
			mode: "string",
		}),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("team_highlight_states_key").using(
			"btree",
			table.team_id,
			table.highlight_id,
		),
		index("team_highlight_states_scope_idx").using(
			"btree",
			table.shared_scope,
		),
	],
);

export const teamStoryStates = pgTable(
	"team_story_states",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		state: text("state").default("unread"), // unread, read, archived
		pinned: boolean("pinned").default(false),
		rating: integer("rating"),
		last_viewed_at: timestamp("last_viewed_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		uniqueIndex("team_story_states_key").using(
			"btree",
			table.team_id,
			table.story_id,
		),
		index("team_story_states_pinned_idx").using("btree", table.pinned),
	],
);

export const storyNotes = pgTable(
	"story_notes",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		story_id: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		user_id: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		visibility: text("visibility").notNull().default("team"), // team, personal
		body: text("body").notNull(),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("story_notes_story_team_idx").using(
			"btree",
			table.story_id,
			table.team_id,
		),
	],
);

// ============================================================================
// PLAYBOOK TABLES
// ============================================================================

export const playbookTemplates = pgTable(
	"playbook_templates",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		title: text("title").notNull(),
		description: text("description"),
		target_role: text("target_role"),
		default_channel: text("default_channel"),
		is_public: boolean("is_public").default(false),
		metadata: jsonb("metadata"),
		created_by: uuid("created_by")
			.notNull()
			.references(() => users.id),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("playbook_templates_public_idx").using("btree", table.is_public),
	],
);

export const playbookTemplateSteps = pgTable(
	"playbook_template_steps",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		template_id: uuid("template_id")
			.notNull()
			.references(() => playbookTemplates.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		output_type: text("output_type"),
		position: integer("position").notNull().default(0),
		default_payload: jsonb("default_payload"),
	},
	(table) => [
		index("playbook_template_steps_template_idx").using(
			"btree",
			table.template_id,
		),
		index("playbook_template_steps_position_idx").using(
			"btree",
			table.position,
		),
	],
);

export const playbooks = pgTable(
	"playbooks",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		story_id: uuid("story_id").references(() => stories.id, {
			onDelete: "set null",
		}),
		template_id: uuid("template_id").references(() => playbookTemplates.id, {
			onDelete: "set null",
		}),
		customer_id: uuid("customer_id").references(() => customers.id, {
			onDelete: "set null",
		}),
		goal_id: uuid("goal_id").references(() => teamGoals.id, {
			onDelete: "set null",
		}),
		created_by: uuid("created_by")
			.notNull()
			.references(() => users.id),
		status: playbookStatus("status").notNull().default("draft"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		published_at: timestamp("published_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index("playbooks_team_idx").using("btree", table.team_id),
		index("playbooks_story_idx").using("btree", table.story_id),
		index("playbooks_customer_idx").using("btree", table.customer_id),
		index("playbooks_status_idx").using("btree", table.status),
	],
);

export const playbookSteps = pgTable(
	"playbook_steps",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbook_id: uuid("playbook_id")
			.notNull()
			.references(() => playbooks.id, { onDelete: "cascade" }),
		template_step_id: uuid("template_step_id").references(
			() => playbookTemplateSteps.id,
			{ onDelete: "set null" },
		),
		assigned_to: uuid("assigned_to").references(() => users.id, {
			onDelete: "set null",
		}),
		status: stepStatus("status").notNull().default("pending"),
		content: text("content"),
		position: integer("position").notNull().default(0),
		completed_at: timestamp("completed_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index("playbook_steps_playbook_idx").using("btree", table.playbook_id),
		index("playbook_steps_position_idx").using("btree", table.position),
	],
);

export const playbookStepHighlights = pgTable(
	"playbook_step_highlights",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbook_step_id: uuid("playbook_step_id")
			.notNull()
			.references(() => playbookSteps.id, { onDelete: "cascade" }),
		highlight_id: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("playbook_step_highlights_key").using(
			"btree",
			table.playbook_step_id,
			table.highlight_id,
		),
	],
);

export const playbookOutputs = pgTable(
	"playbook_outputs",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbook_id: uuid("playbook_id")
			.notNull()
			.references(() => playbooks.id, { onDelete: "cascade" }),
		output_type: text("output_type").notNull(),
		external_url: text("external_url"),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("playbook_outputs_playbook_idx").using("btree", table.playbook_id),
	],
);

// ============================================================================
// ASSISTANT TABLES
// ============================================================================

export const assistantThreads = pgTable(
	"assistant_threads",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		story_id: uuid("story_id").references(() => stories.id, {
			onDelete: "set null",
		}),
		playbook_id: uuid("playbook_id").references(() => playbooks.id, {
			onDelete: "set null",
		}),
		goal_id: uuid("goal_id").references(() => teamGoals.id, {
			onDelete: "set null",
		}),
		created_by: uuid("created_by")
			.notNull()
			.references(() => users.id),
		topic: text("topic"),
		status: threadStatus("status").notNull().default("active"),
		started_at: timestamp("started_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("assistant_threads_team_idx").using("btree", table.team_id),
		index("assistant_threads_story_idx").using("btree", table.story_id),
		index("assistant_threads_status_idx").using("btree", table.status),
	],
);

export const highlightAssistantThreadFk = foreignKey({
	columns: [highlights.assistant_thread_id],
	foreignColumns: [assistantThreads.id],
	name: "highlights_assistant_thread_id_fkey",
}).onDelete("set null");

export const assistantThreadSources = pgTable(
	"assistant_thread_sources",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		thread_id: uuid("thread_id")
			.notNull()
			.references(() => assistantThreads.id, { onDelete: "cascade" }),
		highlight_id: uuid("highlight_id").references(() => highlights.id, {
			onDelete: "cascade",
		}),
		turn_id: uuid("turn_id").references(() => storyTurns.id, {
			onDelete: "cascade",
		}),
		added_by: uuid("added_by")
			.notNull()
			.references(() => users.id),
		position: integer("position").notNull().default(0),
		added_at: timestamp("added_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("assistant_thread_sources_thread_idx").using(
			"btree",
			table.thread_id,
		),
	],
);

export const assistantMessages = pgTable(
	"assistant_messages",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		thread_id: uuid("thread_id")
			.notNull()
			.references(() => assistantThreads.id, { onDelete: "cascade" }),
		sender_id: uuid("sender_id").references(() => users.id, {
			onDelete: "set null",
		}),
		role: messageRole("role").notNull(),
		body: text("body").notNull(),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("assistant_messages_thread_idx").using("btree", table.thread_id),
		index("assistant_messages_created_idx").using("btree", table.created_at),
	],
);

export const messageSourceLinks = pgTable(
	"message_source_links",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		message_id: uuid("message_id")
			.notNull()
			.references(() => assistantMessages.id, { onDelete: "cascade" }),
		highlight_id: uuid("highlight_id").references(() => highlights.id, {
			onDelete: "cascade",
		}),
		turn_id: uuid("turn_id").references(() => storyTurns.id, {
			onDelete: "cascade",
		}),
		confidence: numeric("confidence", { precision: 3, scale: 2 }),
	},
	(table) => [
		index("message_source_links_message_idx").using("btree", table.message_id),
	],
);

export const activities = pgTable(
	"activities",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		actor_id: uuid("actor_id").references(() => users.id, {
			onDelete: "set null",
		}),
		type: activityTypeEnum("type").notNull(),
		visibility: activityVisibilityEnum("visibility").notNull().default("team"),
		story_id: uuid("story_id").references(() => stories.id, {
			onDelete: "set null",
		}),
		highlight_id: uuid("highlight_id").references(() => highlights.id, {
			onDelete: "set null",
		}),
		playbook_id: uuid("playbook_id").references(() => playbooks.id, {
			onDelete: "set null",
		}),
		thread_id: uuid("thread_id").references(() => assistantThreads.id, {
			onDelete: "set null",
		}),
		goal_id: uuid("goal_id").references(() => teamGoals.id, {
			onDelete: "set null",
		}),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("activities_team_idx").using("btree", table.team_id),
		index("activities_type_idx").using("btree", table.type),
		index("activities_created_at_idx").using("btree", table.created_at),
	],
);

// ============================================================================
// BILLING TABLES (Stripe Integration)
// ============================================================================

export const products = pgTable(
	"products",
	{
		id: text("id").primaryKey().notNull(), // Stripe product ID
		name: text("name").notNull(),
		description: text("description"),
		active: boolean("active").default(true),
		metadata: jsonb("metadata"),
	},
	(table) => [index("products_active_idx").using("btree", table.active)],
);

export const prices = pgTable(
	"prices",
	{
		id: text("id").primaryKey().notNull(), // Stripe price ID
		product_id: text("product_id")
			.notNull()
			.references(() => products.id),
		active: boolean("active").default(true),
		currency: text("currency").notNull(),
		type: pricingType("type").notNull(),
		unit_amount: bigint("unit_amount", { mode: "number" }),
		interval: pricingPlanInterval("interval"),
		interval_count: integer("interval_count"),
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("prices_product_idx").using("btree", table.product_id),
		index("prices_active_idx").using("btree", table.active),
	],
);

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: text("id").primaryKey().notNull(), // Stripe subscription ID
		team_id: uuid("team_id")
			.notNull()
			.references(() => teams.id),
		price_id: text("price_id")
			.notNull()
			.references(() => prices.id),
		status: subscriptionStatus("status").notNull(),
		plan_code: planCodeEnum("plan_code").notNull(),
		current_period_start: timestamp("current_period_start", {
			withTimezone: true,
			mode: "string",
		}),
		current_period_end: timestamp("current_period_end", {
			withTimezone: true,
			mode: "string",
		}),
		trial_ends_at: timestamp("trial_ends_at", {
			withTimezone: true,
			mode: "string",
		}),
		canceled_at: timestamp("canceled_at", {
			withTimezone: true,
			mode: "string",
		}),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("subscriptions_team_idx").using("btree", table.team_id),
		index("subscriptions_status_idx").using("btree", table.status),
		index("subscriptions_plan_code_idx").using("btree", table.plan_code),
	],
);

// ============================================================================
// OPERATIONAL TABLES (Keep for instrumentation)
// ============================================================================

export const platformQuota = pgTable("platform_quota", {
	provider: text("provider").primaryKey().notNull(),
	quota_limit: integer("quota_limit"),
	used: integer("used"),
	remaining: integer("remaining"),
	reset_at: timestamp("reset_at", { withTimezone: true, mode: "string" }),
	updated_at: timestamp("updated_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

export const sourceHealth = pgTable("source_health", {
	source_id: uuid("source_id")
		.primaryKey()
		.notNull()
		.references(() => sources.id, { onDelete: "cascade" }),
	status: healthStatus("status").notNull(),
	last_success_at: timestamp("last_success_at", {
		withTimezone: true,
		mode: "string",
	}),
	last_error_at: timestamp("last_error_at", {
		withTimezone: true,
		mode: "string",
	}),
	message: text("message"),
	updated_at: timestamp("updated_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

export const jobMetrics = pgTable(
	"job_metrics",
	{
		name: text("name").notNull(),
		state: text("state").notNull(),
		count: integer("count").notNull().default(0),
		updated_at: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.name, table.state] })],
);

// ============================================================================
// TODO: team_state deferred per plan
// This is a placeholder for future team state management features
// ============================================================================

// TODO: Implement team_state management in a future iteration
// This will include features like workspace preferences, team-wide settings,
// and collaborative state that spans multiple entities
