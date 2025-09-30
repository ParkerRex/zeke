#!/bin/bash

# Drizzle Migration Script for Zeke
# This ensures we always use Drizzle for migrations, never raw SQL

set -e

echo "🔄 Starting Drizzle migration process..."

# Check if DATABASE_SESSION_POOLER_URL is set
if [ -z "$DATABASE_SESSION_POOLER_URL" ]; then
    echo "❌ ERROR: DATABASE_SESSION_POOLER_URL environment variable is not set"
    echo "💡 Set it to your database URL:"
    echo "   export DATABASE_SESSION_POOLER_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'"
    exit 1
fi

echo "✅ Database URL configured"

# Navigate to db package directory
cd "$(dirname "$0")/.."

echo "📁 Working directory: $(pwd)"

# Generate migration from schema changes
echo "🔧 Generating migration from schema.ts..."
bunx drizzle-kit generate --config drizzle.config.ts

# Check if new migration files were created
MIGRATION_COUNT=$(ls -1 migrations/*.sql 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo "⚠️  No new migrations generated - schema might be up to date"
else
    echo "✅ Generated $MIGRATION_COUNT migration file(s)"
fi

# Apply migrations to database
echo "🚀 Applying migrations to database..."
bunx drizzle-kit push --config drizzle.config.ts

echo "✅ Migration complete!"
echo "📝 Next steps:"
echo "   1. Review generated SQL in migrations/ directory"
echo "   2. Commit the new migration files to git"
echo "   3. Restart your API server to pick up schema changes"
