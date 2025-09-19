#!/usr/bin/env bash
set -euo pipefail

# Build and run the engine locally via Docker.
# Uses engine/.env for env vars (expects a Direct DB URL for local dev).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
ENV_FILE_DEV="$ROOT_DIR/.env.development"
ENV_FILE_LOCAL="$ROOT_DIR/.env.local"
ENV_FILE="$ROOT_DIR/.env"
IMAGE_TAG="zeke-engine:local"

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

# Fallbacks for missing API keys: try repo root envs if not defined in engine/.env.*
if [[ -z "${YOUTUBE_API_KEY:-}" ]]; then
  # Prefer engine/.env.production (may hold real API key)
  if [[ -f "$ROOT_DIR/.env.production" ]]; then set -a; source "$ROOT_DIR/.env.production"; set +a; fi
fi
if [[ -z "${YOUTUBE_API_KEY:-}" ]]; then
  if [[ -f "$REPO_ROOT/.env.development" ]]; then set -a; source "$REPO_ROOT/.env.development"; set +a; fi
fi
if [[ -z "${YOUTUBE_API_KEY:-}" ]]; then
  if [[ -f "$REPO_ROOT/.env.production" ]]; then set -a; source "$REPO_ROOT/.env.production"; set +a; fi
fi
if [[ -z "${YOUTUBE_API_KEY:-}" ]]; then
  if [[ -f "$REPO_ROOT/.env" ]]; then set -a; source "$REPO_ROOT/.env"; set +a; fi
fi

# Ensure WORKER_DB_PASSWORD exists. If absent/empty, generate a random one for this session.
if [[ -z "${WORKER_DB_PASSWORD:-}" ]]; then
  WORKER_DB_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "worker_password")
  echo "[info] Generated ephemeral WORKER_DB_PASSWORD for this session"
fi

: "${DATABASE_URL:?Set DATABASE_URL in engine/.env or env (use Direct URL)}" \
  "${BOSS_SCHEMA:=pgboss}" \
  "${BOSS_CRON_TZ:=UTC}" \
  "${BOSS_MIGRATE:=true}" \
  "${PORT:=8080}"

# Re-apply caller override for PORT if provided
if [[ -n "$PRESET_PORT" ]]; then
  PORT="$PRESET_PORT"
fi

# Container name is port-specific to avoid collisions
CONTAINER_NAME="zeke-engine-local-$PORT"

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

# Ensure DATABASE_URL contains a password for the worker DB user
DOCKER_DATABASE_URL="$DATABASE_URL"
if echo "$DOCKER_DATABASE_URL" | grep -qE 'postgresql://worker:@'; then
  DOCKER_DATABASE_URL=$(echo "$DOCKER_DATABASE_URL" | sed -E "s#(postgresql://worker:)[^@]*@#\1${WORKER_DB_PASSWORD}@#")
fi

# Rewrite localhost in DATABASE_URL so the container can reach the host DB
if [[ "$DOCKER_DATABASE_URL" == *"127.0.0.1"* || "$DOCKER_DATABASE_URL" == *"localhost"* ]]; then
  DOCKER_DATABASE_URL=$(echo "$DOCKER_DATABASE_URL" | sed -E 's/(postgresql:\/\/[^@]*@)(127\.0\.0\.1|localhost)/\1host.docker.internal/')
  echo "[info] Rewriting DATABASE_URL host for Docker: host.docker.internal"
fi

# Preflight: ensure the local Postgres has the 'worker' role with the expected password
if command -v psql >/dev/null 2>&1; then
  if ! PGPASSWORD="$WORKER_DB_PASSWORD" psql "postgresql://worker@127.0.0.1:54322/postgres" -c "select 'ok'" >/dev/null 2>&1; then
    echo "[info] Setting/repairing local 'worker' role password via scripts/fix-worker-role.sh"
    DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" WORKER_PASS="$WORKER_DB_PASSWORD" bash "$REPO_ROOT/scripts/fix-worker-role.sh" || true
  fi
fi

echo "[info] Building Docker image $IMAGE_TAG (full deps)"
# Copy pnpm-lock.yaml to engine directory temporarily
echo "[info] Copying pnpm-lock.yaml from $REPO_ROOT to $ROOT_DIR"
cp "$REPO_ROOT/pnpm-lock.yaml" "$ROOT_DIR/pnpm-lock.yaml"
# Build from engine directory
docker build -t "$IMAGE_TAG" "$ROOT_DIR"
# Clean up temporary file
rm -f "$ROOT_DIR/pnpm-lock.yaml"

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
