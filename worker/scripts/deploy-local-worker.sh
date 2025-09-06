#!/usr/bin/env bash
set -euo pipefail

# Build and run the worker locally via Docker.
# Uses worker/.env for env vars (expects a Direct DB URL for local dev).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE_DEV="$ROOT_DIR/.env.development"
ENV_FILE_LOCAL="$ROOT_DIR/.env.local"
ENV_FILE="$ROOT_DIR/.env"
IMAGE_TAG="zeke-worker:local"

# Preserve any pre-set PORT before sourcing env files so caller overrides win
PRESET_PORT="${PORT:-}"

if [[ -f "$ENV_FILE_DEV" ]]; then
  echo "[info] Using $ENV_FILE_DEV"
  set -a; source "$ENV_FILE_DEV"; set +a
elif [[ -f "$ENV_FILE_LOCAL" ]]; then
  echo "[info] Using $ENV_FILE_LOCAL"
  set -a; source "$ENV_FILE_LOCAL"; set +a
elif [[ -f "$ENV_FILE" ]]; then
  echo "[info] Using $ENV_FILE"
  set -a; source "$ENV_FILE"; set +a
fi

: "${DATABASE_URL:?Set DATABASE_URL in worker/.env or env (use Direct URL)}" \
  "${BOSS_SCHEMA:=pgboss}" \
  "${BOSS_CRON_TZ:=UTC}" \
  "${BOSS_MIGRATE:=true}" \
  "${PORT:=8080}"

# Re-apply caller override for PORT if provided
if [[ -n "$PRESET_PORT" ]]; then
  PORT="$PRESET_PORT"
fi

# Container name is port-specific to avoid collisions
CONTAINER_NAME="zeke-worker-local-$PORT"

# If a container with this name already exists, remove it to avoid port bind errors
if command -v docker >/dev/null 2>&1; then
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[info] Removing existing container ${CONTAINER_NAME}"
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
  # Also clean up the legacy default name if present
  if docker ps -a --format '{{.Names}}' | grep -q '^zeke-worker-local$'; then
    echo "[info] Removing legacy container zeke-worker-local"
    docker rm -f zeke-worker-local >/dev/null 2>&1 || true
  fi
fi

# Rewrite localhost in DATABASE_URL so the container can reach the host DB
DOCKER_DATABASE_URL="$DATABASE_URL"
if [[ "$DOCKER_DATABASE_URL" == *"127.0.0.1"* || "$DOCKER_DATABASE_URL" == *"localhost"* ]]; then
  DOCKER_DATABASE_URL=$(echo "$DOCKER_DATABASE_URL" | sed -E 's/(postgresql:\/\/[^@]*@)(127\.0\.0\.1|localhost)/\1host.docker.internal/')
  echo "[info] Rewriting DATABASE_URL host for Docker: host.docker.internal"
fi

echo "[info] Building Docker image $IMAGE_TAG (full deps)"
docker build -t "$IMAGE_TAG" "$ROOT_DIR"

echo "[info] Starting container ${CONTAINER_NAME} on http://localhost:$PORT"
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:$PORT" \
  -e NODE_ENV=production \
  -e PORT="$PORT" \
  -e DATABASE_URL="$DOCKER_DATABASE_URL" \
  -e BOSS_SCHEMA="$BOSS_SCHEMA" \
  -e BOSS_CRON_TZ="$BOSS_CRON_TZ" \
  -e BOSS_MIGRATE="$BOSS_MIGRATE" \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  -e YOUTUBE_API_KEY="${YOUTUBE_API_KEY:-}" \
  "$IMAGE_TAG"
