#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Rebuild + Run Docker worker (dev)${NC}"

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not installed or not running${NC}"
  exit 1
fi

# Prefer worker/.env.development, then .env.local, then .env
ENV_DEV="worker/.env.development"
ENV_LOCAL="worker/.env.local"
ENV_FALLBACK="worker/.env"

if [ -f "$ENV_DEV" ]; then
  echo -e "${BLUE}📥 Loading env from $ENV_DEV${NC}"
  set -a; source "$ENV_DEV"; set +a
elif [ -f "$ENV_LOCAL" ]; then
  echo -e "${BLUE}📥 Loading env from $ENV_LOCAL${NC}"
  set -a; source "$ENV_LOCAL"; set +a
elif [ -f "$ENV_FALLBACK" ]; then
  echo -e "${BLUE}📥 Loading env from $ENV_FALLBACK${NC}"
  set -a; source "$ENV_FALLBACK"; set +a
else
  echo -e "${RED}❌ Missing worker env file. Create worker/.env.development with DATABASE_URL and API keys.${NC}"
  exit 1
fi

# Caller PORT overrides env file
PORT=${PORT:-8082}
IMAGE_TAG=${IMAGE_TAG:-zeke-worker:local}
CONTAINER_NAME=${CONTAINER_NAME:-zeke-worker-local-${PORT}}

echo -e "${BLUE}🔗 Preparing DATABASE_URL for Docker networking${NC}"
DOCKER_DATABASE_URL="$DATABASE_URL"
if [[ "$DOCKER_DATABASE_URL" == *"127.0.0.1"* || "$DOCKER_DATABASE_URL" == *"localhost"* ]]; then
  DOCKER_DATABASE_URL=$(echo "$DOCKER_DATABASE_URL" | sed -E 's/(postgresql:\/\/[^@]*@)(127\.0\.0\.1|localhost)/\1host.docker.internal/')
  echo -e "${YELLOW}↪️  Rewrote DB host to host.docker.internal${NC}"
fi

echo -e "${BLUE}🧱 Building image (no cache): ${IMAGE_TAG}${NC}"
docker build --no-cache -t "$IMAGE_TAG" worker

echo -e "${BLUE}🗑️  Removing any old container named ${CONTAINER_NAME}${NC}"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
# Clean up legacy default names too
docker rm -f zeke-worker-local >/dev/null 2>&1 || true
docker rm -f zeke-worker-local-8082 >/dev/null 2>&1 || true

echo -e "${BLUE}🚀 Starting container on http://localhost:${PORT}${NC}"
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:$PORT" \
  -e NODE_ENV=production \
  -e PORT="$PORT" \
  -e DATABASE_URL="$DOCKER_DATABASE_URL" \
  -e BOSS_SCHEMA="${BOSS_SCHEMA:-pgboss}" \
  -e BOSS_CRON_TZ="${BOSS_CRON_TZ:-UTC}" \
  -e BOSS_MIGRATE=true \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  -e YOUTUBE_API_KEY="${YOUTUBE_API_KEY:-}" \
  "$IMAGE_TAG" >/dev/null

echo -e "${GREEN}✅ Worker container started${NC}"

echo -e "${BLUE}🧪 Health check:${NC}"
sleep 1
if curl -fsS "http://localhost:${PORT}/healthz" >/dev/null; then
  echo -e "${GREEN}ok${NC}"
else
  echo -e "${YELLOW}⚠️  Health endpoint not responding yet${NC}"
fi

echo -e "${BLUE}📊 Status snapshot (if ready):${NC}"
curl -fsS "http://localhost:${PORT}/debug/status" || true

echo -e "\n${BLUE}✅ Done.${NC}"
echo -e "${YELLOW}Tip:${NC} Open http://localhost:3000/testing to view the live dashboard."
