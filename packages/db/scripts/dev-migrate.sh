#!/bin/bash

# Development Migration Script - Uses Local Supabase
# This script automatically uses your local Supabase instance

set -e

echo "🏠 Using LOCAL Supabase for development migration..."

# Set local database URL
export DATABASE_SESSION_POOLER_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "📍 Database: $DATABASE_SESSION_POOLER_URL"

# Check if Supabase is running
if ! curl -s http://127.0.0.1:54321/health >/dev/null 2>&1; then
    echo "❌ ERROR: Local Supabase is not running"
    echo "💡 Start it with: cd apps/api && supabase start"
    exit 1
fi

echo "✅ Local Supabase is running"

# Run the main migration script
./scripts/migrate.sh
