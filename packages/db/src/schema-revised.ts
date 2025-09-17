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
	check,
	foreignKey,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgPolicy,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
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
export const teamRole = pgEnum("team_role", ["owner", "admin", "member", "viewer"]);
export const inviteStatus = pgEnum("invite_status", ["pending", "accepted", "expired", "revoked"]);
export const storyKind = pgEnum("story_kind", ["article", "video", "podcast", "pdf", "tweet"]);
export const highlightKind = pgEnum("highlight_kind", ["insight", "quote", "action", "question"]);
export const playbookStatus = pgEnum("playbook_status", ["draft", "active", "published", "archived"]);
export const stepStatus = pgEnum("step_status", ["pending", "in_progress", "completed", "skipped"]);
export const threadStatus = pgEnum("thread_status", ["active", "resolved", "archived"]);
export const messageRole = pgEnum("message_role", ["user", "assistant", "system"]);

// ============================================================================
// USER & PROFILE TABLES
// ============================================================================

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().notNull(),
		email: text("email").notNull(),
		fullName: text("full_name"),
		avatarUrl: text("avatar_url"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		uniqueIndex("users_email_key").using("btree", table.email),
		index("users_created_at_idx").using("btree", table.createdAt),
	],
);

export const userProfiles = pgTable(
	"user_profiles",
	{
		userId: uuid("user_id").primaryKey().notNull().references(() => users.id, { onDelete: "cascade" }),
		jobTitle: text("job_title"),
		preferences: jsonb("preferences"),
		timezone: text("timezone").default("UTC"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
);

// ============================================================================
// TEAM & MEMBERSHIP TABLES
// ============================================================================

export const teams = pgTable(
	"teams",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		ownerId: uuid("owner_id").references(() => users.id),
		stripeCustomerId: text("stripe_customer_id"),
		planCode: text("plan_code").default("free"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		uniqueIndex("teams_slug_key").using("btree", table.slug),
		uniqueIndex("teams_stripe_customer_id_key").using("btree", table.stripeCustomerId),
		index("teams_owner_id_idx").using("btree", table.ownerId),
	],
);

export const teamMembers = pgTable(
	"team_members",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
		role: teamRole("role").notNull().default("member"),
		status: text("status").notNull().default("active"),
		joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		uniqueIndex("team_members_team_user_key").using("btree", table.teamId, table.userId),
		index("team_members_user_id_idx").using("btree", table.userId),
	],
);

export const teamInvites = pgTable(
	"team_invites",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
		email: text("email").notNull(),
		role: teamRole("role").notNull().default("member"),
		status: inviteStatus("status").notNull().default("pending"),
		expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("team_invites_team_email_idx").using("btree", table.teamId, table.email),
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
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		persona: text("persona"),
		status: text("status").default("active"),
		ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
		context: jsonb("context"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("customers_team_id_idx").using("btree", table.teamId),
		index("customers_owner_id_idx").using("btree", table.ownerId),
	],
);

export const customerTags = pgTable(
	"customer_tags",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color"),
	},
	(table) => [
		uniqueIndex("customer_tags_team_name_key").using("btree", table.teamId, table.name),
	],
);

export const customerTagAssignments = pgTable(
	"customer_tag_assignments",
	{
		customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id").notNull().references(() => customerTags.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({ columns: [table.customerId, table.tagId] }),
	],
);

export const teamGoals = pgTable(
	"team_goals",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
		createdBy: uuid("created_by").notNull().references(() => users.id),
		title: text("title").notNull(),
		goalType: text("goal_type").notNull(),
		status: text("status").default("active"),
		successMetrics: jsonb("success_metrics"),
		docRefs: jsonb("doc_refs"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("team_goals_team_id_idx").using("btree", table.teamId),
		index("team_goals_customer_id_idx").using("btree", table.customerId),
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
		authorityScore: numeric("authority_score", { precision: 3, scale: 2 }),
		isActive: boolean("is_active").default(true),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("sources_type_idx").using("btree", table.type),
		index("sources_active_idx").using("btree", table.isActive),
	],
);

export const sourceConnections = pgTable(
	"source_connections",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		sourceId: uuid("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
		syncStatus: text("sync_status").default("active"),
		lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: "string" }),
		filters: jsonb("filters"),
	},
	(table) => [
		uniqueIndex("source_connections_team_source_key").using("btree", table.teamId, table.sourceId),
	],
);

export const rawItems = pgTable(
	"raw_items",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		sourceId: uuid("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
		externalId: text("external_id").notNull(),
		title: text("title"),
		url: text("url"),
		status: text("status").default("pending"),
		publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		uniqueIndex("raw_items_source_external_key").using("btree", table.sourceId, table.externalId),
		index("raw_items_status_idx").using("btree", table.status),
	],
);

export const contents = pgTable(
	"contents",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		rawItemId: uuid("raw_item_id").notNull().references(() => rawItems.id, { onDelete: "cascade" }),
		contentType: text("content_type").notNull(), // text, transcript, pdf, etc.
		textBody: text("text_body"),
		durationSeconds: integer("duration_seconds"),
		transcriptUrl: text("transcript_url"),
		languageCode: text("language_code"),
		extractedAt: timestamp("extracted_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("contents_raw_item_idx").using("btree", table.rawItemId),
	],
);

// ============================================================================
// STORY & CLUSTER TABLES
// ============================================================================

export const storyClusters = pgTable(
	"story_clusters",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		clusterKey: text("cluster_key").notNull(),
		label: text("label"),
		primaryStoryId: uuid("primary_story_id"),
		metrics: jsonb("metrics"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		uniqueIndex("story_clusters_key").using("btree", table.clusterKey),
		index("story_clusters_primary_story_idx").using("btree", table.primaryStoryId),
	],
);

export const stories = pgTable(
	"stories",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		contentId: uuid("content_id").notNull().references(() => contents.id, { onDelete: "cascade" }),
		clusterId: uuid("cluster_id").references(() => storyClusters.id, { onDelete: "set null" }),
		primarySourceId: uuid("primary_source_id").references(() => sources.id, { onDelete: "set null" }),
		title: text("title"),
		summary: text("summary"),
		kind: storyKind("kind").notNull().default("article"),
		primaryUrl: text("primary_url"),
		publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("stories_cluster_idx").using("btree", table.clusterId),
		index("stories_source_idx").using("btree", table.primarySourceId),
		index("stories_published_at_idx").using("btree", table.publishedAt),
	],
);

// Add foreign key constraint after story_clusters table is defined
export const storyClustersFk = foreignKey({
	columns: [storyClusters.primaryStoryId],
	foreignColumns: [stories.id],
	name: "story_clusters_primary_story_fkey",
});

export const storyAssets = pgTable(
	"story_assets",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
		assetType: text("asset_type").notNull(), // video, audio, image, pdf
		externalUrl: text("external_url").notNull(), // YouTube URL, etc.
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("story_assets_story_idx").using("btree", table.storyId),
		index("story_assets_type_idx").using("btree", table.assetType),
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
		avatarUrl: text("avatar_url"),
		profileUrl: text("profile_url"),
	},
	(table) => [
		uniqueIndex("authors_slug_key").using("btree", table.slug),
	],
);

export const storyAuthors = pgTable(
	"story_authors",
	{
		storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
		authorId: uuid("author_id").notNull().references(() => authors.id, { onDelete: "cascade" }),
		role: text("role").default("author"),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		primaryKey({ columns: [table.storyId, table.authorId] }),
	],
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
		storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
		categoryId: uuid("category_id").notNull().references(() => storyCategories.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({ columns: [table.storyId, table.categoryId] }),
	],
);

// ============================================================================
// STORY STRUCTURE TABLES (Chapters & Turns)
// ============================================================================

export const storyChapters = pgTable(
	"story_chapters",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
		title: text("title"),
		summary: text("summary"),
		startSeconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		endSeconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		index("story_chapters_story_idx").using("btree", table.storyId),
		index("story_chapters_position_idx").using("btree", table.position),
	],
);

export const storyTurns = pgTable(
	"story_turns",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
		chapterId: uuid("chapter_id").references(() => storyChapters.id, { onDelete: "set null" }),
		speaker: text("speaker"),
		startSeconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		endSeconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		content: text("content"),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		index("story_turns_story_idx").using("btree", table.storyId),
		index("story_turns_chapter_idx").using("btree", table.chapterId),
		index("story_turns_position_idx").using("btree", table.position),
	],
);

// ============================================================================
// STORY ANALYSIS TABLES
// ============================================================================

export const storyEmbeddings = pgTable(
	"story_embeddings",
	{
		storyId: uuid("story_id").primaryKey().notNull().references(() => stories.id, { onDelete: "cascade" }),
		modelVersion: text("model_version"),
		embedding: vector("embedding", { dimensions: 1536 }),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
);

export const storyOverlays = pgTable(
	"story_overlays",
	{
		storyId: uuid("story_id").primaryKey().notNull().references(() => stories.id, { onDelete: "cascade" }),
		whyItMatters: text("why_it_matters"),
		confidence: numeric("confidence", { precision: 3, scale: 2 }),
		citations: jsonb("citations"),
		analysisState: text("analysis_state").default("pending"),
		analyzedAt: timestamp("analyzed_at", { withTimezone: true, mode: "string" }),
	},
);

// ============================================================================
// HIGHLIGHT TABLES
// ============================================================================

export const highlights = pgTable(
	"highlights",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
		teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }), // null = global
		createdBy: uuid("created_by").notNull().references(() => users.id),
		chapterId: uuid("chapter_id").references(() => storyChapters.id, { onDelete: "set null" }),
		kind: highlightKind("kind").notNull().default("insight"),
		title: text("title"),
		summary: text("summary"),
		quote: text("quote"),
		startSeconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		endSeconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		confidence: numeric("confidence", { precision: 3, scale: 2 }),
		isGenerated: boolean("is_generated").default(false),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("highlights_story_idx").using("btree", table.storyId),
		index("highlights_team_idx").using("btree", table.teamId),
		index("highlights_chapter_idx").using("btree", table.chapterId),
	],
);

export const highlightReferences = pgTable(
	"highlight_references",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		highlightId: uuid("highlight_id").notNull().references(() => highlights.id, { onDelete: "cascade" }),
		turnId: uuid("turn_id").notNull().references(() => storyTurns.id, { onDelete: "cascade" }),
		sourceUrl: text("source_url"),
	},
	(table) => [
		index("highlight_refs_highlight_idx").using("btree", table.highlightId),
		index("highlight_refs_turn_idx").using("btree", table.turnId),
	],
);

export const highlightTags = pgTable(
	"highlight_tags",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		highlightId: uuid("highlight_id").notNull().references(() => highlights.id, { onDelete: "cascade" }),
		tag: text("tag").notNull(),
	},
	(table) => [
		index("highlight_tags_highlight_idx").using("btree", table.highlightId),
		index("highlight_tags_tag_idx").using("btree", table.tag),
	],
);

// ============================================================================
// TEAM STATE TABLES
// ============================================================================

export const teamHighlightStates = pgTable(
	"team_highlight_states",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		highlightId: uuid("highlight_id").notNull().references(() => highlights.id, { onDelete: "cascade" }),
		state: text("state").default("active"), // active, archived, etc.
		pinnedBy: uuid("pinned_by").references(() => users.id, { onDelete: "set null" }),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		uniqueIndex("team_highlight_states_key").using("btree", table.teamId, table.highlightId),
	],
);

export const teamStoryStates = pgTable(
	"team_story_states",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
		state: text("state").default("unread"), // unread, read, archived
		pinned: boolean("pinned").default(false),
		rating: integer("rating"),
		lastViewedAt: timestamp("last_viewed_at", { withTimezone: true, mode: "string" }),
	},
	(table) => [
		uniqueIndex("team_story_states_key").using("btree", table.teamId, table.storyId),
		index("team_story_states_pinned_idx").using("btree", table.pinned),
	],
);

export const storyNotes = pgTable(
	"story_notes",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
		visibility: text("visibility").notNull().default("team"), // team, personal
		body: text("body").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("story_notes_story_team_idx").using("btree", table.storyId, table.teamId),
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
		targetRole: text("target_role"),
		defaultChannel: text("default_channel"),
		isPublic: boolean("is_public").default(false),
		metadata: jsonb("metadata"),
		createdBy: uuid("created_by").notNull().references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("playbook_templates_public_idx").using("btree", table.isPublic),
	],
);

export const playbookTemplateSteps = pgTable(
	"playbook_template_steps",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		templateId: uuid("template_id").notNull().references(() => playbookTemplates.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		outputType: text("output_type"),
		position: integer("position").notNull().default(0),
		defaultPayload: jsonb("default_payload"),
	},
	(table) => [
		index("playbook_template_steps_template_idx").using("btree", table.templateId),
		index("playbook_template_steps_position_idx").using("btree", table.position),
	],
);

export const playbooks = pgTable(
	"playbooks",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		storyId: uuid("story_id").references(() => stories.id, { onDelete: "set null" }),
		templateId: uuid("template_id").references(() => playbookTemplates.id, { onDelete: "set null" }),
		customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
		goalId: uuid("goal_id").references(() => teamGoals.id, { onDelete: "set null" }),
		createdBy: uuid("created_by").notNull().references(() => users.id),
		status: playbookStatus("status").notNull().default("draft"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
	},
	(table) => [
		index("playbooks_team_idx").using("btree", table.teamId),
		index("playbooks_story_idx").using("btree", table.storyId),
		index("playbooks_customer_idx").using("btree", table.customerId),
		index("playbooks_status_idx").using("btree", table.status),
	],
);

export const playbookSteps = pgTable(
	"playbook_steps",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbookId: uuid("playbook_id").notNull().references(() => playbooks.id, { onDelete: "cascade" }),
		templateStepId: uuid("template_step_id").references(() => playbookTemplateSteps.id, { onDelete: "set null" }),
		assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
		status: stepStatus("status").notNull().default("pending"),
		content: text("content"),
		position: integer("position").notNull().default(0),
		completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
	},
	(table) => [
		index("playbook_steps_playbook_idx").using("btree", table.playbookId),
		index("playbook_steps_position_idx").using("btree", table.position),
	],
);

export const playbookStepHighlights = pgTable(
	"playbook_step_highlights",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbookStepId: uuid("playbook_step_id").notNull().references(() => playbookSteps.id, { onDelete: "cascade" }),
		highlightId: uuid("highlight_id").notNull().references(() => highlights.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("playbook_step_highlights_key").using("btree", table.playbookStepId, table.highlightId),
	],
);

export const playbookOutputs = pgTable(
	"playbook_outputs",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbookId: uuid("playbook_id").notNull().references(() => playbooks.id, { onDelete: "cascade" }),
		outputType: text("output_type").notNull(),
		externalUrl: text("external_url"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("playbook_outputs_playbook_idx").using("btree", table.playbookId),
	],
);

// ============================================================================
// ASSISTANT TABLES
// ============================================================================

export const assistantThreads = pgTable(
	"assistant_threads",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
		storyId: uuid("story_id").references(() => stories.id, { onDelete: "set null" }),
		playbookId: uuid("playbook_id").references(() => playbooks.id, { onDelete: "set null" }),
		goalId: uuid("goal_id").references(() => teamGoals.id, { onDelete: "set null" }),
		createdBy: uuid("created_by").notNull().references(() => users.id),
		topic: text("topic"),
		status: threadStatus("status").notNull().default("active"),
		startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("assistant_threads_team_idx").using("btree", table.teamId),
		index("assistant_threads_story_idx").using("btree", table.storyId),
		index("assistant_threads_status_idx").using("btree", table.status),
	],
);

export const assistantThreadSources = pgTable(
	"assistant_thread_sources",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		threadId: uuid("thread_id").notNull().references(() => assistantThreads.id, { onDelete: "cascade" }),
		highlightId: uuid("highlight_id").references(() => highlights.id, { onDelete: "cascade" }),
		turnId: uuid("turn_id").references(() => storyTurns.id, { onDelete: "cascade" }),
		addedBy: uuid("added_by").notNull().references(() => users.id),
		position: integer("position").notNull().default(0),
		addedAt: timestamp("added_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("assistant_thread_sources_thread_idx").using("btree", table.threadId),
	],
);

export const assistantMessages = pgTable(
	"assistant_messages",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		threadId: uuid("thread_id").notNull().references(() => assistantThreads.id, { onDelete: "cascade" }),
		senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
		role: messageRole("role").notNull(),
		body: text("body").notNull(),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("assistant_messages_thread_idx").using("btree", table.threadId),
		index("assistant_messages_created_idx").using("btree", table.createdAt),
	],
);

export const messageSourceLinks = pgTable(
	"message_source_links",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		messageId: uuid("message_id").notNull().references(() => assistantMessages.id, { onDelete: "cascade" }),
		highlightId: uuid("highlight_id").references(() => highlights.id, { onDelete: "cascade" }),
		turnId: uuid("turn_id").references(() => storyTurns.id, { onDelete: "cascade" }),
		confidence: numeric("confidence", { precision: 3, scale: 2 }),
	},
	(table) => [
		index("message_source_links_message_idx").using("btree", table.messageId),
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
	(table) => [
		index("products_active_idx").using("btree", table.active),
	],
);

export const prices = pgTable(
	"prices",
	{
		id: text("id").primaryKey().notNull(), // Stripe price ID
		productId: text("product_id").notNull().references(() => products.id),
		active: boolean("active").default(true),
		currency: text("currency").notNull(),
		type: pricingType("type").notNull(),
		unitAmount: bigint("unit_amount", { mode: "number" }),
		interval: pricingPlanInterval("interval"),
		intervalCount: integer("interval_count"),
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("prices_product_idx").using("btree", table.productId),
		index("prices_active_idx").using("btree", table.active),
	],
);

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: text("id").primaryKey().notNull(), // Stripe subscription ID
		teamId: uuid("team_id").notNull().references(() => teams.id),
		priceId: text("price_id").notNull().references(() => prices.id),
		status: subscriptionStatus("status").notNull(),
		currentPeriodStart: timestamp("current_period_start", { withTimezone: true, mode: "string" }),
		currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: "string" }),
		canceledAt: timestamp("canceled_at", { withTimezone: true, mode: "string" }),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		index("subscriptions_team_idx").using("btree", table.teamId),
		index("subscriptions_status_idx").using("btree", table.status),
	],
);

// ============================================================================
// OPERATIONAL TABLES (Keep for instrumentation)
// ============================================================================

export const platformQuota = pgTable(
	"platform_quota",
	{
		provider: text("provider").primaryKey().notNull(),
		quotaLimit: integer("quota_limit"),
		used: integer("used"),
		remaining: integer("remaining"),
		resetAt: timestamp("reset_at", { withTimezone: true, mode: "string" }),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
);

export const sourceHealth = pgTable(
	"source_health",
	{
		sourceId: uuid("source_id").primaryKey().notNull().references(() => sources.id, { onDelete: "cascade" }),
		status: healthStatus("status").notNull(),
		lastSuccessAt: timestamp("last_success_at", { withTimezone: true, mode: "string" }),
		lastErrorAt: timestamp("last_error_at", { withTimezone: true, mode: "string" }),
		message: text("message"),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
);

export const jobMetrics = pgTable(
	"job_metrics",
	{
		name: text("name").notNull(),
		state: text("state").notNull(),
		count: integer("count").notNull().default(0),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
	},
	(table) => [
		primaryKey({ columns: [table.name, table.state] }),
	],
);

// ============================================================================
// TODO: team_state deferred per plan
// This is a placeholder for future team state management features
// ============================================================================

// TODO: Implement team_state management in a future iteration
// This will include features like workspace preferences, team-wide settings,
// and collaborative state that spans multiple entities