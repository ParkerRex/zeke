# Zeke Database Migrations

## 🎯 **ALWAYS USE DRIZZLE - NEVER RAW SQL**

This document ensures we maintain consistency and avoid migration conflicts.

## 📋 **Migration Workflow**

### 1. **Make Schema Changes**
Always start by modifying `src/schema.ts`:

```typescript
// Example: Adding a new table
export const newTable = pgTable("new_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. **Generate Migration**
```bash
# From project root - uses local PostgreSQL
bun run db:migrate

# Or from packages/db directory
bun run migrate:dev
```

### 3. **Review Generated SQL**
Check the generated SQL in `migrations/` directory before committing.

### 4. **Commit Migration Files**
```bash
git add packages/db/migrations/
git add packages/db/src/schema.ts
git commit -m "feat: add new_table migration"
```

## 🚀 **Available Commands**

### Development (Local PostgreSQL)
```bash
bun run db:migrate        # Generate + apply migration to local DB
bun run db:studio        # Open Drizzle Studio to inspect DB
```

### Production
```bash
bun run db:migrate:prod  # Apply to production (set DATABASE_SESSION_POOLER_URL first)
```

### Manual Commands
```bash
cd packages/db

# Generate migration from schema changes
bun run migrate:generate

# Apply existing migrations to database
bun run migrate:push

# Open database studio
bun run migrate:studio
```

## ⚠️ **NEVER DO THESE**

❌ **Don't write raw SQL migrations in database admin tools**
❌ **Don't modify migration files after they're generated**
❌ **Don't run SQL directly in database admin tools for schema changes**
❌ **Don't bypass Drizzle for schema modifications**

## ✅ **ALWAYS DO THESE**

✅ **Modify `src/schema.ts` first**
✅ **Use `bun run db:migrate` for development**
✅ **Review generated SQL before committing**
✅ **Test migrations on local PostgreSQL first**
✅ **Commit both schema.ts AND migration files**

## 🔧 **Common Migration Patterns**

### Adding a New Table
```typescript
export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content"),
  teamId: uuid("team_id").notNull().references(() => teams.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Adding an Index
```typescript
export const storiesIndex = index("stories_team_id_idx").on(stories.teamId);
```

### Adding a Foreign Key
```typescript
export const highlights = pgTable("highlights", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
});
```

### Adding an Enum
```typescript
export const storyStatus = pgEnum("story_status", ["draft", "published", "archived"]);

export const stories = pgTable("stories", {
  // ... other fields
  status: storyStatus("status").default("draft"),
});
```

## 🎯 **Environment Variables**

### Local Development
```bash
DATABASE_SESSION_POOLER_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### Production
```bash
DATABASE_SESSION_POOLER_URL="postgresql://postgres.PROJECT:PASSWORD@HOST:5432/postgres"
```

## 🐛 **Troubleshooting**

### "No schema files found"
- Ensure you're running from `packages/db` directory
- Check that `src/schema.ts` exists

### "Cannot find module '@zeke/db'"
- Run `bun install` from project root
- Ensure workspace dependencies are properly linked

### "Database connection failed"
- Check if PostgreSQL is running: `docker compose ps`
- Verify DATABASE_SESSION_POOLER_URL is set correctly

### "Migration conflicts"
- Never edit generated migration files
- If conflicts occur, modify schema.ts and generate new migration
