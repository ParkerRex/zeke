#!/usr/bin/env bash
set -euo pipefail

# Stream Cloud Run service logs to the console using gcloud.
# Usage:
#   bash scripts/logs.sh                 # info+ (default)
#   bash scripts/logs.sh errors          # warnings and errors only
#   SINCE=30m bash scripts/logs.sh       # change lookback window
#   bash scripts/logs.sh "jsonPayload.msg=fetch_content_start OR textPayload:extract_error"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${PROJECT_ID:?Set PROJECT_ID in engine/.env or env}" \
  "${REGION:=us-central1}" \
  "${SERVICE:=zeke-engine}"

# Severity filter: default INFO; use 'errors' to get WARNING+
MIN_SEVERITY="${MIN_SEVERITY:-INFO}"
if [[ "${1:-}" == "errors" || "${1:-}" == "--errors" || "${1:-}" == "-e" ]]; then
  MIN_SEVERITY="WARNING"
  shift || true
fi

FRESHNESS="${FRESHNESS:-15m}"
USER_FILTER="${1:-}"

BASE_FILTER="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE\" AND resource.labels.location=\"$REGION\" AND severity>=$MIN_SEVERITY"
if [[ -n "$USER_FILTER" ]]; then
  LOG_FILTER="$BASE_FILTER AND ($USER_FILTER)"
else
  LOG_FILTER="$BASE_FILTER"
fi

echo "[info] Tailing logs for service=$SERVICE region=$REGION project=$PROJECT_ID severity>=$MIN_SEVERITY freshness=$FRESHNESS"
if [[ -n "$USER_FILTER" ]]; then
  echo "[info] Extra filter: $USER_FILTER"
fi

# Simple, compatible poller using 'gcloud logging read' every INTERVAL seconds.
# Many gcloud versions accept FILTER as a positional argument and prefer --order=desc.
INTERVAL="${INTERVAL:-5}"
while true; do
  clear
  echo "[info] $(date -u) – last $FRESHNESS – severity>=$MIN_SEVERITY"
  gcloud logging read \
    "$LOG_FILTER" \
    --project "$PROJECT_ID" \
    --freshness="$FRESHNESS" \
    --order=desc \
    --limit=200 \
    --format="value(timestamp, severity, resource.labels.revision_name, jsonPayload.msg, textPayload)" | tail -n 200 || true
  sleep "$INTERVAL"
done
