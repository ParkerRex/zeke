#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🔨 Building Docker images..."
docker build -t zeke-api:local -f apps/api/Dockerfile .
docker build -t zeke-dashboard:local -f apps/dashboard/Dockerfile .
docker build -t zeke-website:local -f apps/website/Dockerfile .
docker build -t zeke-engine:local -f apps/engine/Dockerfile .

echo "🚀 Starting containers..."
cd deploy
ENVIRONMENT=local \
DASHBOARD_IMAGE=zeke-dashboard:local \
WEBSITE_IMAGE=zeke-website:local \
API_IMAGE=zeke-api:local \
ENGINE_IMAGE=zeke-engine:local \
docker compose --profile staging up -d

echo "✅ Stack running. Check logs: docker compose --profile staging logs -f"
