#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

cd "$ROOT_DIR/apps/api"
echo "Starting API on port 3003..."
TZ=UTC PORT=3003 bun --hot ./src/index.ts
