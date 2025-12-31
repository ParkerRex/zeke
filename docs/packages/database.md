# Database Package

Drizzle ORM schema, queries, and migrations.

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
| `stories` | Content narratives |
| `highlights` | User notes/highlights |
| `chats` | Chat conversations |
| `contents` | Raw content items |
| `sources` | Content sources |
| `transcripts` | Video/audio transcripts |
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

```bash
cd packages/db

# Generate migration from schema changes
bun run db:generate

# Apply to local database
bun run migrate:dev

# Apply to production
bun run migrate

# Open Drizzle Studio
bun run migrate:studio
```

### Migration Files

Generated in `drizzle/` directory:
```
drizzle/
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

## pgvector

For AI embeddings:

```typescript
import { vector } from "drizzle-orm/pg-core";

export const embeddings = pgTable("embeddings", {
  id: uuid().primaryKey(),
  embedding: vector("embedding", { dimensions: 1536 }),
});
```

Enable extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Environment Variables

```bash
# Primary database
DATABASE_PRIMARY_URL=postgresql://zeke:password@localhost:5435/zeke

# Optional pooler for production
DATABASE_PRIMARY_POOLER_URL=postgresql://pooler.neon.tech/...

# SSL mode
PGSSLMODE=require  # or 'disable' for local
```

## Docker Setup

```bash
# Start PostgreSQL
docker compose up -d postgres

# Enable pgvector
psql postgresql://zeke:zeke_dev_password@localhost:5435/zeke \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
cd packages/db && bun run migrate:dev
```

## Related

- [API Application](../apps/api.md)
- [Jobs Package](./jobs.md)
