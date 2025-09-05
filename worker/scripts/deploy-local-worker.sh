#!/usr/bin/env bash
set -euo pipefail

# Build and run the worker locally via Docker.
# Uses worker/.env for env vars (expects a Direct DB URL for local dev).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
ENV_FILE_LOCAL="$ROOT_DIR/.env.local"
IMAGE_TAG="zeke-worker:local"

if [[ -f "$ENV_FILE_LOCAL" ]]; then
  echo "[info] Using $ENV_FILE_LOCAL"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE_LOCAL"
  set +a
elif [[ -f "$ENV_FILE" ]]; then
  echo "[info] Using $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${DATABASE_URL:?Set DATABASE_URL in worker/.env or env (use Direct URL)}" \
  "${BOSS_SCHEMA:=pgboss}" \
  "${BOSS_CRON_TZ:=UTC}" \
  "${BOSS_MIGRATE:=true}" \
  "${PORT:=8080}"

echo "[info] Building Docker image $IMAGE_TAG"
docker build -t "$IMAGE_TAG" "$ROOT_DIR"

echo "[info] Starting container on http://localhost:$PORT"
docker run --rm \
  -p "$PORT:$PORT" \
  -e NODE_ENV=production \
  -e PORT="$PORT" \
  -e DATABASE_URL="$DATABASE_URL" \
  -e BOSS_SCHEMA="$BOSS_SCHEMA" \
  -e BOSS_CRON_TZ="$BOSS_CRON_TZ" \
  -e BOSS_MIGRATE="$BOSS_MIGRATE" \
  "$IMAGE_TAG"
