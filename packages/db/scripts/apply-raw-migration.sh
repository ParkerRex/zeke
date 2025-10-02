#!/bin/bash

# Apply raw SQL migration
# Usage: ./scripts/apply-raw-migration.sh <migration-file>

set -e

if [ -z "$1" ]; then
    echo "❌ ERROR: Please provide migration file"
    echo "Usage: ./scripts/apply-raw-migration.sh <migration-file>"
    exit 1
fi

MIGRATION_FILE="$1"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ ERROR: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Check if DATABASE_SESSION_POOLER_URL is set
if [ -z "$DATABASE_SESSION_POOLER_URL" ]; then
    echo "❌ ERROR: DATABASE_SESSION_POOLER_URL environment variable is not set"
    echo "💡 Set it to your database URL:"
    echo "   export DATABASE_SESSION_POOLER_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'"
    exit 1
fi

echo "🔄 Applying migration: $MIGRATION_FILE"
echo "📁 Database: $DATABASE_SESSION_POOLER_URL"

# Apply the migration using psql
psql "$DATABASE_SESSION_POOLER_URL" -f "$MIGRATION_FILE"

echo "✅ Migration applied successfully!"
