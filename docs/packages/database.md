# Database Package

Schema, migrations, and query helpers. This is the data source of truth. If the data model changes, it changes here.

## Owns

- Drizzle schema (`packages/db/src/schema.ts`)
- Migrations and DB health checks
- Shared query helpers

## Does Not Own

- Business logic (API owns it)
- Caching (Cache package owns it)
- Background scheduling (Jobs package owns it)

## Overview

| Property | Value |
|----------|-------|
| Package | `@zeke/db` |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Extensions | pgvector |

## Exports

```typescript
import { db } from "@zeke/db/client";
import { stories, users, teams } from "@zeke/db/schema";
import { getStoryById } from "@zeke/db/queries";
```

| Export | Description |
|--------|-------------|
| `./client` | Database client singleton |
| `./schema` | Drizzle schema definitions |
| `./queries` | Pre-built query functions |
| `./utils/api-keys` | API key utilities |
| `./utils/health` | Health check utilities |

## Schema

### Naming Convention

- **Database**: `snake_case` columns
- **Application**: `camelCase` properties
- Automatic mapping via Drizzle `casing: "snake_case"`

```typescript
// Schema definition
export const stories = pgTable("stories", {
  id: uuid().primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => teams.id),  // snake_case in DB
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage in code (camelCase)
const story = await db.query.stories.findFirst();
console.log(story.teamId);  // camelCase
```

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `teams` | Organizations |
| `users_on_team` | Team membership |
| `stories` | User-facing content |
| `contents` | Raw extracted content |
| `sources` | Content sources |
| `highlights` | User notes/highlights |
| `chats` | Chat conversations |
| `playbooks` | Automation workflows |
| `tags` | Content tags |
| `api_keys` | API authentication |
| `activities` | Activity log |

### Enums

```typescript
// Plan types
export const plans = pgEnum("plans", ["trial", "starter", "pro"]);

// Team roles
export const teamRole = pgEnum("team_role", ["owner", "admin", "member", "viewer"]);

// Story types
export const storyKind = pgEnum("story_kind", ["article", "video", "podcast", "pdf", "tweet"]);

// Highlight types
export const highlightKind = pgEnum("highlight_kind", [
  "insight", "quote", "action", "question", "code_example"
]);
```

### Relationships

```
users
├── teams (owner)
│   └── users_on_team (members)
├── stories
│   ├── highlights
│   └── story_clusters
├── chats
├── api_keys
└── notification_settings

contents
├── sources
└── transcripts

playbooks
└── playbook_runs
```

## Queries

Pre-built query functions in `src/queries/`:

```typescript
// Import specific queries
import { getStoryById, getStoriesForTeam } from "@zeke/db/queries";

// Usage
const story = await getStoryById(storyId);
const stories = await getStoriesForTeam(teamId, { limit: 10 });
```

### Available Queries

| File | Functions |
|------|-----------|
| `stories.ts` | `getStoryById`, `getStoriesForTeam`, etc. |
| `highlights.ts` | `getHighlightsForStory`, `createHighlight`, etc. |
| `chats.ts` | `getChatById`, `getChatsForUser`, etc. |
| `teams.ts` | `getTeamById`, `getTeamMembers`, etc. |
| `users.ts` | `getUserById`, `getUserByEmail`, etc. |
| `search.ts` | Full-text search functions |
| `activities.ts` | Activity log operations |
| `api-keys.ts` | API key management |
| `notifications.ts` | Notification queries |

## Client

```typescript
import { db } from "@zeke/db/client";

// Query builder
const stories = await db.query.stories.findMany({
  where: eq(stories.teamId, teamId),
  with: { highlights: true },
  limit: 10,
});

// Raw SQL
const result = await db.execute(sql`SELECT * FROM stories WHERE id = ${id}`);
```

## Migrations

### From repo root

```bash
bun run db:migrate        # Generate + apply to local DB
bun run db:studio         # Open Drizzle Studio
bun run db:migrate:prod   # Apply to production
```

### From `packages/db`

```bash
bun run migrate:dev       # Local migration
bun run migrate           # Production migration
bun run migrate:studio    # Drizzle Studio
```

### Migration Files

Generated in `migrations/` directory:
```
packages/db/migrations/
├── 0000_initial.sql
├── 0001_add_stories.sql
└── meta/
    └── _journal.json
```

## Connection Pooling

```typescript
// Client uses connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_PRIMARY_URL,
  max: 12,                    // Max connections
  idleTimeoutMillis: 60000,   // Idle timeout
  connectionTimeoutMillis: 15000,
});
```

### Pool Statistics

```typescript
import { getConnectionPoolStats } from "@zeke/db/client";

const stats = getConnectionPoolStats();
// { primary: { total: 12, active: 3, idle: 9, waiting: 0 } }
```
