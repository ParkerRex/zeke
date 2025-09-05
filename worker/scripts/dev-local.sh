#!/usr/bin/env bash
set -euo pipefail

# Fast local development - builds and runs without heavy Python deps

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
IMAGE_TAG="zeke-worker:dev"

if [[ -f "$ENV_FILE" ]]; then
  echo "[info] Using $ENV_FILE"
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${DATABASE_URL:?Set DATABASE_URL in worker/.env}" \
  "${BOSS_SCHEMA:=pgboss}" \
  "${BOSS_CRON_TZ:=UTC}" \
  "${BOSS_MIGRATE:=true}" \
  "${PORT:=8080}"

echo "[info] Building fast dev image $IMAGE_TAG"
docker build -f "$ROOT_DIR/Dockerfile.dev" -t "$IMAGE_TAG" "$ROOT_DIR"

echo "[info] Starting container on http://localhost:$PORT"
echo "[info] Note: YouTube processing will be disabled (no Python deps)"
docker run --rm \
  -p "$PORT:$PORT" \
  -e NODE_ENV=development \
  -e PORT="$PORT" \
  -e DATABASE_URL="$DATABASE_URL" \
  -e BOSS_SCHEMA="$BOSS_SCHEMA" \
  -e BOSS_CRON_TZ="$BOSS_CRON_TZ" \
  -e BOSS_MIGRATE="$BOSS_MIGRATE" \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  -e YOUTUBE_API_KEY="${YOUTUBE_API_KEY:-}" \
  "$IMAGE_TAG"
