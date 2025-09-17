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

export const clusters = pgTable(
	"clusters",
	{
		clusterKey: text("cluster_key").primaryKey().notNull(),
		representativeStoryId: uuid("representative_story_id"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("clusters_rep_story_idx").using(
			"btree",
			table.representativeStoryId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.representativeStoryId],
			foreignColumns: [stories.id],
			name: "clusters_representative_story_id_fkey",
		}),
		pgPolicy("clusters_delete_consolidated", {
			as: "permissive",
			for: "delete",
			to: ["authenticated", "worker"],
			using: sql`(is_admin_user() OR is_worker_role())`,
		}),
		pgPolicy("clusters_insert_consolidated", {
			as: "permissive",
			for: "insert",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("clusters_select_consolidated", {
			as: "permissive",
			for: "select",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("clusters_update_consolidated", {
			as: "permissive",
			for: "update",
			to: ["authenticated", "worker"],
		}),
	],
);

export const customers = pgTable(
	"customers",
	{
		id: uuid().primaryKey().notNull(),
		stripeCustomerId: text("stripe_customer_id"),
	},
	(table) => [
		foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "customers_id_fkey",
		}),
	],
);

export const highlights = pgTable(
	"highlights",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid("user_id").notNull(),
		storyId: uuid("story_id").notNull(),
		contentId: uuid("content_id").notNull(),
		span: jsonb().notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("highlights_story_idx").using(
			"btree",
			table.storyId.asc().nullsLast().op("uuid_ops"),
		),
		index("highlights_user_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.contentId],
			foreignColumns: [contents.id],
			name: "highlights_content_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "highlights_story_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("highlights_delete_own", {
			as: "permissive",
			for: "delete",
			to: ["authenticated"],
			using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
		}),
		pgPolicy("highlights_insert_own", {
			as: "permissive",
			for: "insert",
			to: ["authenticated"],
		}),
		pgPolicy("highlights_select_own", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
		}),
		pgPolicy("highlights_update_own", {
			as: "permissive",
			for: "update",
			to: ["authenticated"],
		}),
	],
);

export const platformQuota = pgTable(
	"platform_quota",
	{
		provider: text().primaryKey().notNull(),
		quotaLimit: integer("quota_limit"),
		used: integer(),
		remaining: integer(),
		resetAt: timestamp("reset_at", { withTimezone: true, mode: "string" }),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		pgPolicy("platform_quota_admin_select", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
			using: sql`is_admin_user()`,
		}),
		pgPolicy("platform_quota_worker_all", {
			as: "permissive",
			for: "all",
			to: ["worker"],
		}),
	],
);

export const prices = pgTable(
	"prices",
	{
		id: text().primaryKey().notNull(),
		productId: text("product_id"),
		active: boolean(),
		description: text(),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		unitAmount: bigint("unit_amount", { mode: "number" }),
		currency: text(),
		type: pricingType(),
		interval: pricingPlanInterval(),
		intervalCount: integer("interval_count"),
		trialPeriodDays: integer("trial_period_days"),
		metadata: jsonb(),
	},
	(table) => [
		foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "prices_product_id_fkey",
		}),
		pgPolicy("Allow public read-only access.", {
			as: "permissive",
			for: "select",
			to: ["public"],
			using: sql`true`,
		}),
		check("prices_currency_check", sql`char_length(currency) = 3`),
	],
);

export const products = pgTable(
	"products",
	{
		id: text().primaryKey().notNull(),
		active: boolean(),
		name: text(),
		description: text(),
		image: text(),
		metadata: jsonb(),
	},
	(table) => [
		pgPolicy("Allow public read-only access.", {
			as: "permissive",
			for: "select",
			to: ["public"],
			using: sql`true`,
		}),
	],
);

export const rawItems = pgTable(
	"raw_items",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		sourceId: uuid("source_id").notNull(),
		externalId: text("external_id").notNull(),
		url: text().notNull(),
		kind: text(),
		title: text(),
		metadata: jsonb(),
		discoveredAt: timestamp("discovered_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		status: text(),
		error: text(),
		attempts: integer().default(0),
	},
	(table) => [
		index("idx_raw_items_youtube")
			.using(
				"btree",
				table.kind.asc().nullsLast().op("text_ops"),
				table.externalId.asc().nullsLast().op("text_ops"),
			)
			.where(sql`(kind = 'youtube'::text)`),
		index("raw_items_source_discovered_idx").using(
			"btree",
			table.sourceId.asc().nullsLast().op("timestamptz_ops"),
			table.discoveredAt.desc().nullsFirst().op("timestamptz_ops"),
		),
		uniqueIndex("raw_items_source_external_unique").using(
			"btree",
			table.sourceId.asc().nullsLast().op("text_ops"),
			table.externalId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.sourceId],
			foreignColumns: [sources.id],
			name: "raw_items_source_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("raw_items_admin_all", {
			as: "permissive",
			for: "all",
			to: ["authenticated"],
			using: sql`is_admin_user()`,
			withCheck: sql`is_admin_user()`,
		}),
		pgPolicy("raw_items_worker_all", {
			as: "permissive",
			for: "all",
			to: ["worker"],
		}),
	],
);

export const contents = pgTable(
	"contents",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		rawItemId: uuid("raw_item_id").notNull(),
		text: text(),
		htmlUrl: text("html_url"),
		transcriptUrl: text("transcript_url"),
		pdfUrl: text("pdf_url"),
		lang: text(),
		extractedAt: timestamp("extracted_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		contentHash: text("content_hash").notNull(),
		audioUrl: text("audio_url"),
		durationSeconds: integer("duration_seconds"),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		viewCount: bigint("view_count", { mode: "number" }),
		transcriptVtt: text("transcript_vtt"),
	},
	(table) => [
		index("contents_content_hash_idx").using(
			"btree",
			table.contentHash.asc().nullsLast().op("text_ops"),
		),
		index("idx_contents_audio_url")
			.using("btree", table.audioUrl.asc().nullsLast().op("text_ops"))
			.where(sql`(audio_url IS NOT NULL)`),
		index("idx_contents_transcript_url")
			.using("btree", table.transcriptUrl.asc().nullsLast().op("text_ops"))
			.where(sql`(transcript_url IS NOT NULL)`),
		index("idx_contents_transcript_vtt")
			.using("btree", table.id.asc().nullsLast().op("uuid_ops"))
			.where(sql`(transcript_vtt IS NOT NULL)`),
		foreignKey({
			columns: [table.rawItemId],
			foreignColumns: [rawItems.id],
			name: "contents_raw_item_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("contents_select_consolidated", {
			as: "permissive",
			for: "select",
			to: ["authenticated", "worker"],
			using: sql`(is_admin_user() OR is_worker_role() OR true)`,
		}),
		pgPolicy("contents_worker_all", {
			as: "permissive",
			for: "all",
			to: ["worker"],
		}),
		pgPolicy("contents_authenticated_read", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
		}),
		pgPolicy("contents_admin_all", {
			as: "permissive",
			for: "all",
			to: ["authenticated"],
		}),
	],
);

export const sourceHealth = pgTable(
	"source_health",
	{
		sourceId: uuid("source_id").primaryKey().notNull(),
		status: healthStatus().default("ok").notNull(),
		lastSuccessAt: timestamp("last_success_at", {
			withTimezone: true,
			mode: "string",
		}),
		lastErrorAt: timestamp("last_error_at", {
			withTimezone: true,
			mode: "string",
		}),
		error24H: integer("error_24h").default(0),
		message: text(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.sourceId],
			foreignColumns: [sources.id],
			name: "source_health_source_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("source_health_admin_select", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
			using: sql`is_admin_user()`,
		}),
		pgPolicy("source_health_worker_all", {
			as: "permissive",
			for: "all",
			to: ["worker"],
		}),
	],
);

export const sourceMetrics = pgTable(
	"source_metrics",
	{
		sourceId: uuid("source_id").primaryKey().notNull(),
		rawTotal: integer("raw_total").default(0),
		contentsTotal: integer("contents_total").default(0),
		storiesTotal: integer("stories_total").default(0),
		raw24H: integer("raw_24h").default(0),
		contents24H: integer("contents_24h").default(0),
		stories24H: integer("stories_24h").default(0),
		lastRawAt: timestamp("last_raw_at", { withTimezone: true, mode: "string" }),
		lastContentAt: timestamp("last_content_at", {
			withTimezone: true,
			mode: "string",
		}),
		lastStoryAt: timestamp("last_story_at", {
			withTimezone: true,
			mode: "string",
		}),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.sourceId],
			foreignColumns: [sources.id],
			name: "source_metrics_source_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("source_metrics_admin_select", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
			using: sql`is_admin_user()`,
		}),
		pgPolicy("source_metrics_worker_insert", {
			as: "permissive",
			for: "insert",
			to: ["worker"],
		}),
		pgPolicy("source_metrics_worker_update", {
			as: "permissive",
			for: "update",
			to: ["worker"],
		}),
		pgPolicy("source_metrics_worker_select", {
			as: "permissive",
			for: "select",
			to: ["worker"],
		}),
	],
);

export const sources = pgTable(
	"sources",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		kind: text().notNull(),
		name: text(),
		url: text(),
		domain: text(),
		authorityScore: numeric("authority_score"),
		lastCursor: jsonb("last_cursor"),
		lastChecked: timestamp("last_checked", {
			withTimezone: true,
			mode: "string",
		}),
		metadata: jsonb(),
		active: boolean().default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("sources_domain_idx").using(
			"btree",
			table.domain.asc().nullsLast().op("text_ops"),
		),
		pgPolicy("sources_delete_consolidated", {
			as: "permissive",
			for: "delete",
			to: ["authenticated", "worker"],
			using: sql`(is_admin_user() OR is_worker_role())`,
		}),
		pgPolicy("sources_insert_consolidated", {
			as: "permissive",
			for: "insert",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("sources_select_consolidated", {
			as: "permissive",
			for: "select",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("sources_update_consolidated", {
			as: "permissive",
			for: "update",
			to: ["authenticated", "worker"],
		}),
		check(
			"check_youtube_metadata",
			sql`(kind <> ALL (ARRAY['youtube_channel'::text, 'youtube_search'::text])) OR ((metadata IS NOT NULL) AND (metadata <> '{}'::jsonb))`,
		),
	],
);

export const stories = pgTable(
	"stories",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		contentId: uuid("content_id").notNull(),
		canonicalUrl: text("canonical_url"),
		kind: text(),
		title: text(),
		primaryUrl: text("primary_url"),
		publishedAt: timestamp("published_at", {
			withTimezone: true,
			mode: "string",
		}),
		clusterKey: text("cluster_key"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("stories_cluster_key_idx").using(
			"btree",
			table.clusterKey.asc().nullsLast().op("text_ops"),
		),
		index("stories_created_idx").using(
			"btree",
			table.createdAt.desc().nullsFirst().op("timestamptz_ops"),
		),
		index("stories_published_idx").using(
			"btree",
			table.publishedAt.asc().nullsLast().op("timestamptz_ops"),
		),
		foreignKey({
			columns: [table.contentId],
			foreignColumns: [contents.id],
			name: "stories_content_id_fkey",
		}).onDelete("restrict"),
		unique("stories_content_id_key").on(table.contentId),
		pgPolicy("stories_delete_consolidated", {
			as: "permissive",
			for: "delete",
			to: ["authenticated", "worker"],
			using: sql`(is_admin_user() OR is_worker_role())`,
		}),
		pgPolicy("stories_insert_consolidated", {
			as: "permissive",
			for: "insert",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("stories_select_consolidated", {
			as: "permissive",
			for: "select",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("stories_update_consolidated", {
			as: "permissive",
			for: "update",
			to: ["authenticated", "worker"],
		}),
	],
);

export const storyEmbeddings = pgTable(
	"story_embeddings",
	{
		storyId: uuid("story_id").primaryKey().notNull(),
		modelVersion: text("model_version"),
		embedding: vector({ dimensions: 1536 }),
	},
	(table) => [
		index("story_embeddings_l2_idx")
			.using("ivfflat", table.embedding.asc().nullsLast().op("vector_l2_ops"))
			.with({ lists: "100" }),
		foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "story_embeddings_story_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("story_embeddings_delete_consolidated", {
			as: "permissive",
			for: "delete",
			to: ["authenticated", "worker"],
			using: sql`(is_admin_user() OR is_worker_role())`,
		}),
		pgPolicy("story_embeddings_insert_consolidated", {
			as: "permissive",
			for: "insert",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("story_embeddings_select_consolidated", {
			as: "permissive",
			for: "select",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("story_embeddings_update_consolidated", {
			as: "permissive",
			for: "update",
			to: ["authenticated", "worker"],
		}),
	],
);

export const storyOverlays = pgTable(
	"story_overlays",
	{
		storyId: uuid("story_id").primaryKey().notNull(),
		whyItMatters: text("why_it_matters"),
		chili: integer(),
		confidence: numeric(),
		citations: jsonb(),
		modelVersion: text("model_version"),
		analyzedAt: timestamp("analyzed_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "story_overlays_story_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("story_overlays_delete_consolidated", {
			as: "permissive",
			for: "delete",
			to: ["authenticated", "worker"],
			using: sql`(is_admin_user() OR is_worker_role())`,
		}),
		pgPolicy("story_overlays_insert_consolidated", {
			as: "permissive",
			for: "insert",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("story_overlays_select_consolidated", {
			as: "permissive",
			for: "select",
			to: ["authenticated", "worker"],
		}),
		pgPolicy("story_overlays_update_consolidated", {
			as: "permissive",
			for: "update",
			to: ["authenticated", "worker"],
		}),
	],
);

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: text().primaryKey().notNull(),
		userId: uuid("user_id").notNull(),
		status: subscriptionStatus(),
		metadata: jsonb(),
		priceId: text("price_id"),
		quantity: integer(),
		cancelAtPeriodEnd: boolean("cancel_at_period_end"),
		created: timestamp({ withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
		currentPeriodStart: timestamp("current_period_start", {
			withTimezone: true,
			mode: "string",
		})
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
		currentPeriodEnd: timestamp("current_period_end", {
			withTimezone: true,
			mode: "string",
		})
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
		endedAt: timestamp("ended_at", {
			withTimezone: true,
			mode: "string",
		}).default(sql`timezone('utc'::text, now())`),
		cancelAt: timestamp("cancel_at", {
			withTimezone: true,
			mode: "string",
		}).default(sql`timezone('utc'::text, now())`),
		canceledAt: timestamp("canceled_at", {
			withTimezone: true,
			mode: "string",
		}).default(sql`timezone('utc'::text, now())`),
		trialStart: timestamp("trial_start", {
			withTimezone: true,
			mode: "string",
		}).default(sql`timezone('utc'::text, now())`),
		trialEnd: timestamp("trial_end", {
			withTimezone: true,
			mode: "string",
		}).default(sql`timezone('utc'::text, now())`),
	},
	(table) => [
		foreignKey({
			columns: [table.priceId],
			foreignColumns: [prices.id],
			name: "subscriptions_price_id_fkey",
		}),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_user_id_fkey",
		}),
		pgPolicy("subscriptions_select_own", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
			using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
		}),
	],
);

export const users = pgTable(
	"users",
	{
		id: uuid().primaryKey().notNull(),
		fullName: text("full_name"),
		avatarUrl: text("avatar_url"),
		billingAddress: jsonb("billing_address"),
		paymentMethod: jsonb("payment_method"),
		isAdmin: boolean("is_admin").default(false).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.id],
			foreignColumns: [table.id],
			name: "users_id_fkey",
		}),
		pgPolicy("users_select_own", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
			using: sql`(( SELECT auth.uid() AS uid) = id)`,
		}),
		pgPolicy("users_update_own", {
			as: "permissive",
			for: "update",
			to: ["authenticated"],
		}),
	],
);

export const jobMetrics = pgTable(
	"job_metrics",
	{
		name: text().notNull(),
		state: text().notNull(),
		count: integer().default(0).notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.name, table.state],
			name: "job_metrics_pkey",
		}),
		pgPolicy("job_metrics_admin_select", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
			using: sql`is_admin_user()`,
		}),
		pgPolicy("job_metrics_worker_all", {
			as: "permissive",
			for: "all",
			to: ["worker"],
		}),
	],
);

import {
	boolean,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey(),
	email: text("email"),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	activeTeamId: uuid("active_team_id"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	isAdmin: boolean("is_admin").notNull().default(false),
});

export const teams = pgTable("teams", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name"),
	slug: text("slug"),
	ownerId: uuid("owner_id").references(() => users.id),
	stripeCustomerId: text("stripe_customer_id"),
	planCode: text("plan_code"),
	logoUrl: text("logo_url"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const teamMembers = pgTable(
	"team_members",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.references(() => teams.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		role: text("role").notNull().default("member"),
		status: text("status").notNull().default("active"),
		joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		teamUserUnique: uniqueIndex("team_members_team_id_user_id_key").on(
			table.teamId,
			table.userId,
		),
	}),
);

export const teamInvites = pgTable("team_invites", {
	id: uuid("id").primaryKey().defaultRandom(),
	teamId: uuid("team_id")
		.references(() => teams.id, { onDelete: "cascade" })
		.notNull(),
	invitedBy: uuid("invited_by").references(() => users.id),
	email: text("email").notNull(),
	role: text("role").notNull().default("member"),
	status: text("status").notNull().default("pending"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type TeamInvite = typeof teamInvites.$inferSelect;

// Relations
import { relations } from "drizzle-orm/relations";
import {
	clusters,
	contents,
	customers,
	highlights,
	prices,
	products,
	rawItems,
	sourceHealth,
	sourceMetrics,
	sources,
	stories,
	storyEmbeddings,
	storyOverlays,
	subscriptions,
	users,
	usersInAuth,
} from "./schema";

export const clustersRelations = relations(clusters, ({ one }) => ({
	story: one(stories, {
		fields: [clusters.representativeStoryId],
		references: [stories.id],
	}),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
	clusters: many(clusters),
	highlights: many(highlights),
	content: one(contents, {
		fields: [stories.contentId],
		references: [contents.id],
	}),
	storyEmbeddings: many(storyEmbeddings),
	storyOverlays: many(storyOverlays),
}));

export const customersRelations = relations(customers, ({ one }) => ({
	usersInAuth: one(usersInAuth, {
		fields: [customers.id],
		references: [usersInAuth.id],
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
	customers: many(customers),
	subscriptions: many(subscriptions),
	users: many(users),
}));

export const highlightsRelations = relations(highlights, ({ one }) => ({
	content: one(contents, {
		fields: [highlights.contentId],
		references: [contents.id],
	}),
	story: one(stories, {
		fields: [highlights.storyId],
		references: [stories.id],
	}),
}));

export const contentsRelations = relations(contents, ({ one, many }) => ({
	highlights: many(highlights),
	rawItem: one(rawItems, {
		fields: [contents.rawItemId],
		references: [rawItems.id],
	}),
	stories: many(stories),
}));

export const pricesRelations = relations(prices, ({ one, many }) => ({
	product: one(products, {
		fields: [prices.productId],
		references: [products.id],
	}),
	subscriptions: many(subscriptions),
}));

export const productsRelations = relations(products, ({ many }) => ({
	prices: many(prices),
}));

export const rawItemsRelations = relations(rawItems, ({ one, many }) => ({
	source: one(sources, {
		fields: [rawItems.sourceId],
		references: [sources.id],
	}),
	contents: many(contents),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
	rawItems: many(rawItems),
	sourceHealths: many(sourceHealth),
	sourceMetrics: many(sourceMetrics),
}));

export const sourceHealthRelations = relations(sourceHealth, ({ one }) => ({
	source: one(sources, {
		fields: [sourceHealth.sourceId],
		references: [sources.id],
	}),
}));

export const sourceMetricsRelations = relations(sourceMetrics, ({ one }) => ({
	source: one(sources, {
		fields: [sourceMetrics.sourceId],
		references: [sources.id],
	}),
}));

export const storyEmbeddingsRelations = relations(
	storyEmbeddings,
	({ one }) => ({
		story: one(stories, {
			fields: [storyEmbeddings.storyId],
			references: [stories.id],
		}),
	}),
);

export const storyOverlaysRelations = relations(storyOverlays, ({ one }) => ({
	story: one(stories, {
		fields: [storyOverlays.storyId],
		references: [stories.id],
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	price: one(prices, {
		fields: [subscriptions.priceId],
		references: [prices.id],
	}),
	usersInAuth: one(usersInAuth, {
		fields: [subscriptions.userId],
		references: [usersInAuth.id],
	}),
}));

export const usersRelations = relations(users, ({ one }) => ({
	usersInAuth: one(usersInAuth, {
		fields: [users.id],
		references: [usersInAuth.id],
	}),
}));
