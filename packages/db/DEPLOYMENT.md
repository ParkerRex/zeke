# Database Schema Deployment Guide

This guide covers deploying Drizzle schema changes to both local and production databases.

## 🏠 Local Development

### Prerequisites
- Local Supabase running (`supabase start` from `apps/api`)
- Environment variables set in `.env.local`

> **💡 Note:** The Supabase config lives in `apps/api/supabase/config.toml`, not in the packages. This is where you run `supabase start`. The `packages/supabase/` contains client libraries, and `packages/db/` contains Drizzle schemas/migrations.

### Quick Commands

```bash
# From packages/db directory
bun run migrate:dev   # Migrates to local Supabase automatically
```

That's it! The script handles everything:
- Checks if local Supabase is running
- Generates migrations from schema changes
- Applies them to local database

### What It Does

1. Verifies local Supabase is running at `http://127.0.0.1:54321`
2. Connects to `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
3. Runs `drizzle-kit generate` to create migration files
4. Runs `drizzle-kit push` to apply changes
5. Prompts for column rename confirmations (select "create column" for new fields)

### Manual Process (if needed)

```bash
cd packages/db
export DATABASE_SESSION_POOLER_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
bunx drizzle-kit generate --config drizzle.config.ts
bunx drizzle-kit push --config drizzle.config.ts
```

## 🚀 Production Deployment

### Prerequisites
- Production database URL in `packages/db/.env`
- SSL certificate (`prod-ca-2021.crt`) in project root
- Database backup recommended before major changes

### Production Commands

```bash
# From packages/db directory
export DATABASE_SESSION_POOLER_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
bun run migrate
```

The script automatically:
- Uses SSL with the certificate in `prod-ca-2021.crt`
- Generates migrations
- Applies to production database
- Prompts for column confirmations

### SSL Configuration

The `drizzle.config.ts` automatically handles SSL for Supabase production:

```typescript
ssl: isSupabase ? {
  ca: readFileSync(resolve(__dirname, "../../prod-ca-2021.crt")).toString(),
} : false
```

### Using Direct Connection (Alternative)

If pooler doesn't work, use the direct connection:

```bash
export DATABASE_SESSION_POOLER_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
bun run migrate
```

## 🔄 Migration Workflow

### Column Rename Prompts

When running migrations, drizzle-kit will ask if columns are created or renamed:

```
Is inbox_id column in teams table created or renamed from another column?
❯ + inbox_id              create column    ← SELECT THIS for new columns
  ~ slug › inbox_id       rename column
  ~ owner_id › inbox_id   rename column
```

**Always select "create column" unless you're intentionally renaming an existing column.**

## 📊 Verification

After deployment:

```bash
# Check table structure
psql $DATABASE_SESSION_POOLER_URL -c "\d teams"

# Verify data
psql $DATABASE_SESSION_POOLER_URL -c "SELECT id, name, email, plan FROM teams LIMIT 5;"
```

## 🐛 Troubleshooting

### SSL Connection Errors

If you see "SSL connection is required":
- Ensure `prod-ca-2021.crt` exists in project root
- Use direct connection URL (not pooler)
- Check `drizzle.config.ts` has SSL config

### Migration Already Applied

If migration files already exist:
```bash
# Delete old migrations (if safe)
rm -rf packages/db/migrations/*.sql

# Regenerate
bun run migrate:generate
```

### Connection Pooler Issues

Use direct connection instead:
```bash
# Instead of: aws-1-us-east-2.pooler.supabase.com
# Use: db.PROJECT.supabase.co
```

## 📁 Important Files

```
packages/db/
├── drizzle.config.ts       # SSL config, DB credentials
├── .env                    # Production DB URLs
├── scripts/
│   ├── dev-migrate.sh     # Local: auto-detects Supabase
│   └── migrate.sh         # Production: requires DB URL
├── migrations/            # Generated SQL (git committed)
└── src/schema.ts         # Drizzle schema definitions

prod-ca-2021.crt          # SSL cert (project root)
```

## 🔐 Security Notes

- `packages/db/.env` contains production credentials (gitignored)
- SSL cert (`prod-ca-2021.crt`) is in project root
- Always review generated migrations before production deploy
- Backup production before major schema changes

## 💰 Team Payment Setup

Our teams table matches Midday's architecture for Stripe payments:

```typescript
teams {
  id, name, logoUrl           // Basic info
  email, inboxId              // Communication
  inboxEmail, inboxForwarding // Email features
  plan, stripeCustomerId      // Stripe payments (not Polar!)
  countryCode                 // Localization
  documentClassification      // AI features
  canceledAt                  // Subscription status
}
```

**Note:** We don't use `baseCurrency` - everything is handled by Stripe.
