import type { UIChatMessage } from "@api/ai/types";
import { type SQL, relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  date,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return "tsvector";
  },
});

type NumericConfig = {
  precision?: number;
  scale?: number;
};

export const numericCasted = customType<{
  data: number;
  driverData: string;
  config: NumericConfig;
}>({
  dataType: (config) => {
    if (config?.precision && config?.scale) {
      return `numeric(${config.precision}, ${config.scale})`;
    }
    return "numeric";
  },
  fromDriver: (value: string) => Number.parseFloat(value),
  toDriver: (value: number) => value.toString(),
});

// ============================================================================
// ENUMS
// ============================================================================

export const healthStatus = pgEnum("health_status", ["ok", "warn", "error"]);

export const plansEnum = pgEnum("plans", ["trial", "starter", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing",
  "incomplete",
  "incomplete_expired",
]);

export const teamRolesEnum = pgEnum("teamRoles", ["owner", "member"]);

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
  "code_example", // Code snippets, implementation examples
  "code_change", // Git diffs, breaking changes
  "api_change", // API updates, new endpoints
  "metric", // Performance numbers, benchmarks
]);
export const highlightOrigin = pgEnum("highlight_origin", ["user", "system"]);
export const highlightCollaboratorRole = pgEnum("highlight_collaborator_role", [
  "viewer",
  "editor",
]);
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
export const playbookRunStatus = pgEnum("playbook_run_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);
export const stepStatus = pgEnum("step_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "story_published",
  "story_pinned",
  "highlight_created",
  "highlight_pinned",
  "playbook_created",
  "playbook_published",
  "goal_created",
  "goal_completed",
  "subscription_upgraded",
  "subscription_downgraded",
]);

export const activitySourceEnum = pgEnum("activity_source", [
  "system", // Automated system processes
  "user", // Direct user actions
]);

export const activityStatusEnum = pgEnum("activity_status", [
  "unread",
  "read",
  "archived",
]);

export const tags = pgTable(
  "tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
  },
  (table) => [
    index("tags_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "tags_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_tag_name").on(table.teamId, table.name),
    pgPolicy("Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text(),
    logoUrl: text("logo_url"),
    email: text(),
    canceledAt: timestamp("canceled_at", {
      withTimezone: true,
      mode: "string",
    }),
    plan: plansEnum().default("trial").notNull(),
    // subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  },
  (table) => [
    pgPolicy("Invited users can select team if they are invited.", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Teams can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("Teams can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Teams can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const userInvites = pgTable(
  "user_invites",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id"),
    email: text(),
    role: teamRolesEnum(),
    code: text().default("nanoid(24)"),
    invitedBy: uuid("invited_by"),
  },
  (table) => [
    index("user_invites_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "public_user_invites_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [users.id],
      name: "user_invites_invited_by_fkey",
    }).onDelete("cascade"),
    unique("unique_team_invite").on(table.teamId, table.email),
    unique("user_invites_code_key").on(table.code),
    pgPolicy("Enable select for users based on email", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`((auth.jwt() ->> 'email'::text) = email)`,
    }),
    pgPolicy("User Invites can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("User Invites can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("User Invites can be deleted by invited email", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("User Invites can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("User Invites can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

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

export const apps = pgTable(
  "apps",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").defaultRandom(),
    config: jsonb(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    appId: text("app_id").notNull(),
    createdBy: uuid("created_by").defaultRandom(),
    settings: jsonb(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "apps_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "integrations_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_app_id_team_id").on(table.teamId, table.appId),
    pgPolicy("Apps can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Apps can be inserted by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Apps can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Apps can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    email: text(),
    teamId: uuid("team_id"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    locale: text().default("en"),
    weekStartsOnMonday: boolean("week_starts_on_monday").default(false),
    timezone: text(),
    timezoneAutoSync: boolean("timezone_auto_sync").default(true),
    timeFormat: numericCasted("time_format").default(24),
    dateFormat: text("date_format"),
  },
  (table) => [
    index("users_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.id],
      foreignColumns: [table.id],
      name: "users_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "users_team_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Users can insert their own profile.", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(auth.uid() = id)`,
    }),
    pgPolicy("Users can select their own profile.", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Users can select users if they are in the same team", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Users can update own profile.", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const usersOnTeam = pgTable(
  "users_on_team",
  {
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    id: uuid().defaultRandom().notNull(),
    role: teamRolesEnum(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("users_on_team_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("users_on_team_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "users_on_team_team_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "users_on_team_user_id_fkey",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.userId, table.teamId, table.id],
      name: "members_pkey",
    }),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable updates for users on team", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
    pgPolicy("Select for current user teams", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Users on team can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
  ],
);

// export const usersInAuth = pgTable(
//   "auth.users",
//   {
//     instanceId: uuid("instance_id"),
//     id: uuid("id").notNull(),
//     aud: varchar("aud", { length: 255 }),
//     role: varchar("role", { length: 255 }),
//     email: varchar("email", { length: 255 }),
//     encryptedPassword: varchar("encrypted_password", { length: 255 }),
//     emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
//     invitedAt: timestamp("invited_at", { withTimezone: true }),
//     confirmationToken: varchar("confirmation_token", { length: 255 }),
//     confirmationSentAt: timestamp("confirmation_sent_at", {
//       withTimezone: true,
//     }),
//     recoveryToken: varchar("recovery_token", { length: 255 }),
//     recoverySentAt: timestamp("recovery_sent_at", { withTimezone: true }),
//     emailChangeTokenNew: varchar("email_change_token_new", { length: 255 }),
//     emailChange: varchar("email_change", { length: 255 }),
//     emailChangeSentAt: timestamp("email_change_sent_at", {
//       withTimezone: true,
//     }),
//     lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
//     rawAppMetaData: jsonb("raw_app_meta_data"),
//     rawUserMetaData: jsonb("raw_user_meta_data"),
//     isSuperAdmin: boolean("is_super_admin"),
//     createdAt: timestamp("created_at", { withTimezone: true }),
//     updatedAt: timestamp("updated_at", { withTimezone: true }),
//     phone: text("phone").default(sql`null::character varying`),
//     phoneConfirmedAt: timestamp("phone_confirmed_at", { withTimezone: true }),
//     phoneChange: text("phone_change").default(sql`''::character varying`),
//     phoneChangeToken: varchar("phone_change_token", { length: 255 }).default(
//       sql`''::character varying`,
//     ),
//     phoneChangeSentAt: timestamp("phone_change_sent_at", {
//       withTimezone: true,
//     }),
//     // Drizzle ORM does not support .stored() for generated columns, so we omit it
//     confirmedAt: timestamp("confirmed_at", {
//       withTimezone: true,
//       mode: "string",
//     }).generatedAlwaysAs(sql`LEAST(email_confirmed_at, phone_confirmed_at)`),
//     emailChangeTokenCurrent: varchar("email_change_token_current", {
//       length: 255,
//     }).default(sql`''::character varying`),
//     emailChangeConfirmStatus: smallint("email_change_confirm_status").default(
//       0,
//     ),
//     bannedUntil: timestamp("banned_until", { withTimezone: true }),
//     reauthenticationToken: varchar("reauthentication_token", {
//       length: 255,
//     }).default(sql`''::character varying`),
//     reauthenticationSentAt: timestamp("reauthentication_sent_at", {
//       withTimezone: true,
//     }),
//     isSsoUser: boolean("is_sso_user").notNull().default(false),
//     deletedAt: timestamp("deleted_at", { withTimezone: true }),
//     isAnonymous: boolean("is_anonymous").notNull().default(false),
//   },
//   (table) => [
//     primaryKey({ columns: [table.id], name: "users_pkey" }),
//     unique("users_phone_key").on(table.phone),
//     unique("confirmation_token_idx").on(table.confirmationToken),
//     unique("email_change_token_current_idx").on(table.emailChangeTokenCurrent),
//     unique("email_change_token_new_idx").on(table.emailChangeTokenNew),
//     unique("reauthentication_token_idx").on(table.reauthenticationToken),
//     unique("recovery_token_idx").on(table.recoveryToken),
//     unique("users_email_partial_key").on(table.email),
//     index("users_instance_id_email_idx").on(
//       table.instanceId,
//       sql`lower((email)::text)`,
//     ),
//     index("users_instance_id_idx").on(table.instanceId),
//     index("users_is_anonymous_idx").on(table.isAnonymous),
//     // Check constraint for email_change_confirm_status
//     {
//       kind: "check",
//       name: "users_email_change_confirm_status_check",
//       expression: sql`((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2))`,
//     },
//   ],
// );

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    keyEncrypted: text("key_encrypted").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    keyHash: text("key_hash"),
    scopes: text("scopes").array().notNull().default(sql`'{}'::text[]`),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    index("api_keys_key_idx").using(
      "btree",
      table.keyHash.asc().nullsLast().op("text_ops"),
    ),
    index("api_keys_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    index("api_keys_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "api_keys_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "api_keys_team_id_fkey",
    }).onDelete("cascade"),
    unique("api_keys_key_unique").on(table.keyHash),
  ],
);

export const chats = pgTable(
  "chats",
  {
    id: text("id").primaryKey(), // nanoid
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, {
        onDelete: "cascade",
      }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    teamIdIdx: index("chats_team_id_idx").on(table.teamId),
    userIdIdx: index("chats_user_id_idx").on(table.userId),
    updatedAtIdx: index("chats_updated_at_idx").on(table.updatedAt),
  }),
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, {
        onDelete: "cascade",
      }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, {
        onDelete: "cascade",
      }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    content: jsonb("content").$type<UIChatMessage>().notNull(), // Store individual message as JSONB
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    chatIdIdx: index("chat_messages_chat_id_idx").on(table.chatId),
    teamIdIdx: index("chat_messages_team_id_idx").on(table.teamId),
    userIdIdx: index("chat_messages_user_id_idx").on(table.userId),
    createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt),
  }),
);

export const chatFeedback = pgTable(
  "chat_feedback",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, {
        onDelete: "cascade",
      }),
    messageId: text("message_id").notNull(), // Client-side message ID from AI SDK
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, {
        onDelete: "cascade",
      }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    type: text("type").notNull(), // "positive", "negative", "other"
    comment: text("comment"), // Optional comment
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    chatIdIdx: index("chat_feedback_chat_id_idx").on(table.chatId),
    messageIdIdx: index("chat_feedback_message_id_idx").on(table.messageId),
    teamIdIdx: index("chat_feedback_team_id_idx").on(table.teamId),
    userIdIdx: index("chat_feedback_user_id_idx").on(table.userId),
    typeIdx: index("chat_feedback_type_idx").on(table.type),
    createdAtIdx: index("chat_feedback_created_at_idx").on(table.createdAt),
  }),
);

// Relations
// OAuth Applications
export const oauthApplications = pgTable(
  "oauth_applications",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    overview: text("overview"),
    developerName: text("developer_name"),
    logoUrl: text("logo_url"),
    website: text("website"),
    installUrl: text("install_url"),
    screenshots: text("screenshots").array().default(sql`'{}'::text[]`),
    redirectUris: text("redirect_uris").array().notNull(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret").notNull(),
    scopes: text("scopes").array().notNull().default(sql`'{}'::text[]`),
    teamId: uuid("team_id").notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    isPublic: boolean("is_public").default(false),
    active: boolean("active").default(true),
    status: text("status", {
      enum: ["draft", "pending", "approved", "rejected"],
    }).default("draft"),
  },
  (table) => [
    index("oauth_applications_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("oauth_applications_client_id_idx").using(
      "btree",
      table.clientId.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_applications_slug_idx").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "oauth_applications_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "oauth_applications_created_by_fkey",
    }).onDelete("cascade"),
    pgPolicy("OAuth applications can be managed by team members", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// OAuth Authorization Codes
export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    applicationId: uuid("application_id").notNull(),
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    scopes: text("scopes").array().notNull(),
    redirectUri: text("redirect_uri").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    used: boolean("used").default(false),
    codeChallenge: text("code_challenge"),
    codeChallengeMethod: text("code_challenge_method"),
  },
  (table) => [
    index("oauth_authorization_codes_code_idx").using(
      "btree",
      table.code.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_authorization_codes_application_id_idx").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops"),
    ),
    index("oauth_authorization_codes_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [oauthApplications.id],
      name: "oauth_authorization_codes_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "oauth_authorization_codes_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "oauth_authorization_codes_team_id_fkey",
    }).onDelete("cascade"),
  ],
);

// OAuth Access Tokens
export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    token: text("token").notNull().unique(),
    refreshToken: text("refresh_token").unique(),
    applicationId: uuid("application_id").notNull(),
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    scopes: text("scopes").array().notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
    revoked: boolean("revoked").default(false),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("oauth_access_tokens_token_idx").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_access_tokens_refresh_token_idx").using(
      "btree",
      table.refreshToken.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_access_tokens_application_id_idx").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops"),
    ),
    index("oauth_access_tokens_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [oauthApplications.id],
      name: "oauth_access_tokens_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "oauth_access_tokens_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "oauth_access_tokens_team_id_fkey",
    }).onDelete("cascade"),
  ],
);

// where it falls off maybe

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
  // Brief fields (40-second read summaries)
  brief_one_liner: text("brief_one_liner"), // Single sentence
  brief_two_liner: text("brief_two_liner"), // 2 sentences
  brief_elevator: text("brief_elevator"), // 30-40 second pitch
  time_saved_seconds: integer("time_saved_seconds"), // Original read time - brief time
  brief_generated_at: timestamp("brief_generated_at", {
    withTimezone: true,
    mode: "string",
  }),
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
    shared_scope: highlightShareScope("shared_scope")
      .notNull()
      .default("private"),
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
    index("team_highlight_states_scope_idx").using("btree", table.shared_scope),
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

export const playbookRuns = pgTable(
  "playbook_runs",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    playbook_id: uuid("playbook_id")
      .notNull()
      .references(() => playbooks.id, { onDelete: "cascade" }),
    team_id: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    triggered_by: uuid("triggered_by").references(() => users.id, {
      onDelete: "set null",
    }),
    trigger_source: text("trigger_source"),
    status: playbookRunStatus("status").notNull().default("pending"),
    metadata: jsonb("metadata"),
    started_at: timestamp("started_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    completed_at: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    index("playbook_runs_playbook_idx").using("btree", table.playbook_id),
    index("playbook_runs_team_idx").using("btree", table.team_id),
    index("playbook_runs_status_idx").using("btree", table.status),
  ],
);

export const playbookRunEvents = pgTable(
  "playbook_run_events",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    run_id: uuid("run_id")
      .notNull()
      .references(() => playbookRuns.id, { onDelete: "cascade" }),
    step_id: uuid("step_id").references(() => playbookSteps.id, {
      onDelete: "set null",
    }),
    event_type: text("event_type").notNull(),
    detail: jsonb("detail"),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("playbook_run_events_run_idx").using("btree", table.run_id),
    index("playbook_run_events_step_idx").using("btree", table.step_id),
    index("playbook_run_events_type_idx").using("btree", table.event_type),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // story_published, highlight_shared, etc.
    title: text("title").notNull(),
    message: text("message"),
    read: boolean("read").default(false).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("notifications_team_id_idx").using("btree", table.teamId),
    index("notifications_user_id_idx").using("btree", table.userId),
    index("notifications_read_idx").using("btree", table.read),
    index("notifications_created_at_idx").using("btree", table.createdAt),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Core fields
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id"),
    type: activityTypeEnum().notNull(),
    priority: smallint().default(5), // 1-3 = notifications, 4-10 = insights only

    // Group related activities together (e.g., same business event across multiple users)
    groupId: uuid("group_id"),

    // Source of the activity
    source: activitySourceEnum().notNull(),

    // All the data
    metadata: jsonb().notNull(),

    // Simple lifecycle (only for notifications)
    status: activityStatusEnum().default("unread").notNull(),

    // Timestamp of last system use (e.g. insight generation, digest inclusion)
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    // Optimized indexes
    index("activities_notifications_idx").using(
      "btree",
      table.teamId,
      table.priority,
      table.status,
      table.createdAt.desc(),
    ),
    index("activities_insights_idx").using(
      "btree",
      table.teamId,
      table.type,
      table.source,
      table.createdAt.desc(),
    ),
    index("activities_metadata_gin_idx").using("gin", table.metadata),
    index("activities_group_id_idx").on(table.groupId),
    index("activities_insights_group_idx").using(
      "btree",
      table.teamId,
      table.groupId,
      table.type,
      table.createdAt.desc(),
    ),

    // Foreign keys
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "activities_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "activities_user_id_fkey",
    }).onDelete("set null"),
  ],
);

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

// Relations

export const usersRelations = relations(users, ({ one, many }) => ({
  stories: many(stories),
  highlights: many(highlights),
  playbooks: many(playbooks),
  userInvites: many(userInvites),
  apps: many(apps),
  apiKeys: many(apiKeys),
  oauthApplications: many(oauthApplications),
  oauthAuthorizationCodes: many(oauthAuthorizationCodes),
  oauthAccessTokens: many(oauthAccessTokens),
  // usersInAuth: one(usersInAuth, {
  //   fields: [users.id],
  //   references: [usersInAuth.id],
  // }),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  usersOnTeams: many(usersOnTeam),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [apiKeys.teamId],
    references: [teams.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  stories: many(stories),
  highlights: many(highlights),
  playbooks: many(playbooks),
  tags: many(tags),
  userInvites: many(userInvites),
  apps: many(apps),
  apiKeys: many(apiKeys),
  users: many(users),
  usersOnTeams: many(usersOnTeam),
}));

export const appsRelations = relations(apps, ({ one }) => ({
  user: one(users, {
    fields: [apps.createdBy],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [apps.teamId],
    references: [teams.id],
  }),
}));

// export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
//   users: many(users),
// }));

export const usersOnTeamRelations = relations(usersOnTeam, ({ one }) => ({
  team: one(teams, {
    fields: [usersOnTeam.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [usersOnTeam.userId],
    references: [users.id],
  }),
}));

// OAuth Relations
export const oauthApplicationsRelations = relations(
  oauthApplications,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [oauthApplications.teamId],
      references: [teams.id],
    }),
    createdBy: one(users, {
      fields: [oauthApplications.createdBy],
      references: [users.id],
    }),
    authorizationCodes: many(oauthAuthorizationCodes),
    accessTokens: many(oauthAccessTokens),
  }),
);

export const oauthAuthorizationCodesRelations = relations(
  oauthAuthorizationCodes,
  ({ one }) => ({
    application: one(oauthApplications, {
      fields: [oauthAuthorizationCodes.applicationId],
      references: [oauthApplications.id],
    }),
    user: one(users, {
      fields: [oauthAuthorizationCodes.userId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [oauthAuthorizationCodes.teamId],
      references: [teams.id],
    }),
  }),
);

export const oauthAccessTokensRelations = relations(
  oauthAccessTokens,
  ({ one }) => ({
    application: one(oauthApplications, {
      fields: [oauthAccessTokens.applicationId],
      references: [oauthApplications.id],
    }),
    user: one(users, {
      fields: [oauthAccessTokens.userId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [oauthAccessTokens.teamId],
      references: [teams.id],
    }),
  }),
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    notificationType: text("notification_type").notNull(),
    channel: text("channel").notNull(), // 'in_app', 'email', 'push'
    enabled: boolean().default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("notification_settings_user_team_type_channel_key").on(
      table.userId,
      table.teamId,
      table.notificationType,
      table.channel,
    ),
    index("notification_settings_user_team_idx").on(table.userId, table.teamId),
    index("notification_settings_type_channel_idx").on(
      table.notificationType,
      table.channel,
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "notification_settings_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "notification_settings_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can manage their own notification settings", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(user_id = auth.uid())`,
    }),
  ],
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  team: one(teams, {
    fields: [chats.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  chatMessages: many(chatMessages),
  feedback: many(chatFeedback),
}));

export const chatMessagesRelations = relations(
  chatMessages,
  ({ one, many }) => ({
    chat: one(chats, {
      fields: [chatMessages.chatId],
      references: [chats.id],
    }),
    team: one(teams, {
      fields: [chatMessages.teamId],
      references: [teams.id],
    }),
    user: one(users, {
      fields: [chatMessages.userId],
      references: [users.id],
    }),
    feedback: many(chatFeedback),
  }),
);

export const chatFeedbackRelations = relations(chatFeedback, ({ one }) => ({
  chat: one(chats, {
    fields: [chatFeedback.chatId],
    references: [chats.id],
  }),
  message: one(chatMessages, {
    fields: [chatFeedback.messageId],
    references: [chatMessages.id],
  }),
  team: one(teams, {
    fields: [chatFeedback.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [chatFeedback.userId],
    references: [users.id],
  }),
}));
