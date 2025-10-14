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
export ENVIRONMENT=local
export DASHBOARD_IMAGE=zeke-dashboard:local
export WEBSITE_IMAGE=zeke-website:local
export API_IMAGE=zeke-api:local
export ENGINE_IMAGE=zeke-engine:local
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile local up -d

echo "✅ Stack running!"
echo ""
echo "Services available at:"
echo "  - Website:   http://localhost:3000"
echo "  - Dashboard: http://localhost:3001"
echo "  - API:       http://localhost:3003"
echo "  - Engine:    http://localhost:3010"
echo "  - Redis:     localhost:6379"
echo ""
echo "View logs: cd deploy && docker compose --profile local logs -f"
echo "Stop stack: cd deploy && docker compose --profile local down"
