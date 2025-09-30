# Database Schema Deployment Guide

This guide covers deploying Drizzle schema changes to both local and production databases.

## 🏠 Local Development

### Prerequisites
- Local Supabase running (`supabase start`)
- Environment variables set in `.env.local`

### Quick Commands

```bash
# From project root
bun db:migrate        # Push to local database
bun db:studio         # Open Drizzle Studio UI

# Or from packages/db
bun run migrate:dev   # Development migration (uses local DB)
bun run migrate:push  # Direct push (no migration files)
```

### Step-by-Step Process

1. **Start Local Supabase**
   ```bash
   cd packages/db
   supabase start
   ```

2. **Generate Migration from Schema Changes**
   ```bash
   bunx drizzle-kit generate --config drizzle.config.ts
   ```

3. **Push to Local Database**
   ```bash
   DATABASE_SESSION_POOLER="postgresql://postgres:postgres@localhost:54322/postgres" \
     bunx drizzle-kit push --config drizzle.config.ts
   ```

4. **Verify Schema**
   ```bash
   psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d users"
   ```

5. **Generate Supabase Types**
   ```bash
   cd ../supabase
   bun run db:generate
   ```
   This creates `src/types/db.ts` with TypeScript types for all tables

## 🚀 Production Deployment

### Prerequisites
- Production `DATABASE_SESSION_POOLER_URL` environment variable
- Supabase project ID in package.json
- Database backup recommended before major changes

### Deployment Process

1. **Set Production Database URL**
   ```bash
   export DATABASE_SESSION_POOLER_URL="your-production-pooler-url"
   ```

2. **Review Schema Changes**
   ```bash
   cd packages/db
   bunx drizzle-kit generate --config drizzle.config.ts
   # Review generated SQL in migrations/ directory
   ```

3. **Push to Production**
   ```bash
   bun run migrate    # Uses production URL from env
   ```

4. **Generate Production Types** (optional - usually same as local)
   ```bash
   cd ../supabase
   supabase gen types --lang=typescript \
     --project-id hblelrtwdpukaymtpchv \
     --schema public > src/types/db.ts
   ```

5. **Verify Production Deployment**
   ```bash
   psql "$DATABASE_SESSION_POOLER_URL" -c "SELECT count(*) FROM users;"
   ```

## 📊 Schema Verification Checklist

After any schema push, verify:

- [ ] All tables created with correct columns
- [ ] Foreign key constraints in place
- [ ] Indexes created properly
- [ ] Enums defined correctly
- [ ] TypeScript types generated successfully
- [ ] User menu component displays data correctly

### Quick Verification Commands

```bash
# Check specific table
psql $DATABASE_URL -c "\d users"
psql $DATABASE_URL -c "\d teams"

# Verify relationships
psql $DATABASE_URL -c "\d+ users" | grep "Foreign-key"

# Check enum types
psql $DATABASE_URL -c "\dT+ plan_code"
```

## 🔄 User Data Flow Verification

Test the complete data flow from component to database:

1. **Component** → `apps/dashboard/src/components/user-menu.tsx`
   - Uses `useUserQuery()` hook

2. **Hook** → `apps/dashboard/src/hooks/use-user.ts`
   - Calls `trpc.user.me.query()`

3. **TRPC Router** → `apps/api/src/trpc/routers/user.ts`
   - Executes `getUserById(db, session.user.id)`

4. **Database Query** → `packages/db/src/queries/users.ts`
   - Joins users + teams tables
   - Returns: id, email, fullName, avatarUrl, teamId, team{id, name, slug, planCode}

5. **Schema** → `packages/db/src/schema.ts`
   - users table: 13 columns with indexes
   - teams table: 10 columns with foreign keys

6. **TypeScript Types** → `packages/supabase/src/types/db.ts`
   - Auto-generated from production schema

## 🐛 Troubleshooting

### "No schema changes, nothing to migrate"
This is normal if schema is up to date. Use `drizzle-kit push` to force sync.

### "Database connection failed"
Check:
- Supabase is running (local)
- Environment variables are set correctly
- Network access to production database

### "Type errors after schema update"
Regenerate types:
```bash
cd packages/supabase && bun run db:generate
```

### Foreign key constraint errors
Ensure:
- Related tables exist
- Column types match
- Cascade options are correct

## 📁 File Structure

```
packages/
├── db/
│   ├── src/
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   ├── queries/
│   │   │   └── users.ts        # getUserById, updateUser
│   │   └── client.ts           # Database client setup
│   ├── migrations/              # Generated SQL migrations
│   ├── scripts/
│   │   ├── dev-migrate.sh      # Local migration script
│   │   └── migrate.sh          # Production migration script
│   └── drizzle.config.ts       # Drizzle Kit configuration
│
└── supabase/
    ├── src/types/db.ts         # Generated TypeScript types
    └── package.json            # Contains db:generate script
```

## 🔐 Security Notes

- Never commit `.env.local` with production credentials
- Use connection pooler URLs for production
- Enable Row Level Security (RLS) policies
- Review migration SQL before production deploy
- Always backup production database before major schema changes

## 📚 Additional Resources

- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [PostgreSQL Schema Basics](https://www.postgresql.org/docs/current/ddl-schemas.html)
