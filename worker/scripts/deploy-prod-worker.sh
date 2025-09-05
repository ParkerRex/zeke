#!/usr/bin/env bash
set -euo pipefail

# Production deploy to Cloud Run using envs from worker/.env (no secrets).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${PROJECT_ID:?Set PROJECT_ID in worker/.env or env}" \
  "${REGION:=us-central1}" \
  "${SERVICE:=zeke-worker}" \
  "${DATABASE_URL:=}" \
  "${DATABASE_URL_POOLER:=}" \
  "${BOSS_SCHEMA:=pgboss}" \
  "${BOSS_CRON_TZ:=UTC}" \
  "${BOSS_MIGRATE:=false}" \
  "${OPENAI_API_KEY:=}"

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

gcloud run deploy "$SERVICE" \
  --source "$ROOT_DIR" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --min-instances=1 \
  --cpu=1 --memory=1Gi \
  --set-env-vars "$ENV_VARS" \
  --no-allow-unauthenticated
