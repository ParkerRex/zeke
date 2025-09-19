#!/usr/bin/env bash
set -euo pipefail

# Production deploy to Cloud Run using envs from engine/.env.production (preferred) or engine/.env.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE_PROD="$ROOT_DIR/.env.production"
ENV_FILE="$ROOT_DIR/.env"
if [[ -f "$ENV_FILE_PROD" ]]; then
  echo "[info] Using $ENV_FILE_PROD"
  set -a; source "$ENV_FILE_PROD"; set +a
elif [[ -f "$ENV_FILE" ]]; then
  echo "[info] Using $ENV_FILE"
  set -a; source "$ENV_FILE"; set +a
fi

: "${PROJECT_ID:?Set PROJECT_ID in engine/.env or env}" \
  "${REGION:=us-central1}" \
  "${SERVICE:=zeke-engine}" \
  "${DATABASE_URL:=}" \
  "${DATABASE_URL_POOLER:=}" \
  "${BOSS_SCHEMA:=pgboss}" \
  "${BOSS_CRON_TZ:=UTC}" \
  "${BOSS_MIGRATE:=false}" \
  "${OPENAI_API_KEY:=}" \
  "${YOUTUBE_API_KEY:=}" \
  "${YOUTUBE_QUOTA_LIMIT:=10000}" \
  "${YOUTUBE_QUOTA_RESET_HOUR:=0}" \
  "${YOUTUBE_RATE_LIMIT_BUFFER:=500}"

# Prefer DATABASE_URL_POOLER if provided
if [[ -n "$DATABASE_URL_POOLER" ]]; then
  DATABASE_URL="$DATABASE_URL_POOLER"
fi

if [[ -z "$DATABASE_URL" ]]; then
  echo "[error] DATABASE_URL (or DATABASE_URL_POOLER) not set"
  exit 1
fi

if [[ "${DATABASE_URL}" != *"pooler.supabase.com"* ]]; then
  echo "[warn] DATABASE_URL does not look like a Session Pooler URL."
  echo "       Expected host like <region>.pooler.supabase.com"
fi

ENV_VARS="DATABASE_URL=$DATABASE_URL,BOSS_SCHEMA=$BOSS_SCHEMA,BOSS_CRON_TZ=$BOSS_CRON_TZ,BOSS_MIGRATE=$BOSS_MIGRATE"

# Add OpenAI API key if provided
if [[ -n "$OPENAI_API_KEY" ]]; then
  ENV_VARS="$ENV_VARS,OPENAI_API_KEY=$OPENAI_API_KEY"
fi

# Add YouTube API configuration if provided
if [[ -n "$YOUTUBE_API_KEY" ]]; then
  ENV_VARS="$ENV_VARS,YOUTUBE_API_KEY=$YOUTUBE_API_KEY"
  ENV_VARS="$ENV_VARS,YOUTUBE_QUOTA_LIMIT=$YOUTUBE_QUOTA_LIMIT"
  ENV_VARS="$ENV_VARS,YOUTUBE_QUOTA_RESET_HOUR=$YOUTUBE_QUOTA_RESET_HOUR"
  ENV_VARS="$ENV_VARS,YOUTUBE_RATE_LIMIT_BUFFER=$YOUTUBE_RATE_LIMIT_BUFFER"
fi

echo "[info] Deploying $SERVICE to $REGION..."
gcloud run deploy "$SERVICE" \
  --source "$ROOT_DIR" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --min-instances=1 \
  --cpu=2 --memory=4Gi \
  --timeout=1800 \
  --concurrency=1 \
  --set-env-vars "$ENV_VARS" \
  --no-allow-unauthenticated
