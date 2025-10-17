#!/usr/bin/env bash
set -e

ROOT_DIR="$(dirname "$0")/.."

echo "Building all apps..."

# Build packages first (dependency order)
cd "$ROOT_DIR/packages/db" && bun run build
cd "$ROOT_DIR/packages/ui" && bun run build || true

# Build apps
cd "$ROOT_DIR/apps/dashboard" && bun run build
cd "$ROOT_DIR/apps/website" && bun run build

echo "✓ Build complete"
