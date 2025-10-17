#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Load optional deploy config
if [ -f .env.deploy ]; then
  source .env.deploy
fi

REGISTRY="${REGISTRY:-}"
ACTION="${1:-}"
ENV="${2:-}"

usage() {
  echo "Usage: $0 <build|up|deploy|down|logs> <local|staging|prod>"
  echo ""
  echo "Examples:"
  echo "  $0 build local       - Build all containers for local dev"
  echo "  $0 up local          - Start all containers locally"
  echo "  $0 deploy staging    - Deploy to staging environment"
  echo "  $0 down local        - Stop local containers"
  echo "  $0 logs local        - View local container logs"
  exit 1
}

if [ -z "$ACTION" ] || [ -z "$ENV" ]; then
  usage
fi

# Map environment
case "$ENV" in
  local)
    ENVIRONMENT="local"
    PROFILE="local"
    PROJECT="zeke-local"
    TAG="local"
    ;;
  staging)
    ENVIRONMENT="staging"
    PROFILE="staging"
    PROJECT="zeke-staging"
    TAG="staging"
    ;;
  prod|production)
    ENVIRONMENT="production"
    PROFILE="production"
    PROJECT="zeke-prod"
    TAG="prod"
    ;;
  *)
    echo "Error: Invalid environment '$ENV'"
    usage
    ;;
esac

# Image names
if [ "$ENV" = "local" ]; then
  API_IMAGE="zeke-api:local"
  DASHBOARD_IMAGE="zeke-dashboard:local"
  WEBSITE_IMAGE="zeke-website:local"
  ENGINE_IMAGE="zeke-engine:local"
else
  API_IMAGE="${REGISTRY}zeke-api:${TAG}"
  DASHBOARD_IMAGE="${REGISTRY}zeke-dashboard:${TAG}"
  WEBSITE_IMAGE="${REGISTRY}zeke-website:${TAG}"
  ENGINE_IMAGE="${REGISTRY}zeke-engine:${TAG}"
fi

export ENVIRONMENT API_IMAGE DASHBOARD_IMAGE WEBSITE_IMAGE ENGINE_IMAGE

# Compose files
if [ "$ENV" = "local" ]; then
  COMPOSE_FILES="-f deploy/docker-compose.yml -f deploy/docker-compose.local.yml"
else
  COMPOSE_FILES="-f deploy/docker-compose.yml"
fi

case "$ACTION" in
  build)
    echo "Building images for $ENV..."
    docker build -t "$API_IMAGE" -f apps/api/Dockerfile .
    docker build -t "$DASHBOARD_IMAGE" -f apps/dashboard/Dockerfile .
    docker build -t "$WEBSITE_IMAGE" -f apps/website/Dockerfile .
    docker build -t "$ENGINE_IMAGE" -f apps/engine/Dockerfile .
    
    if [ "$ENV" != "local" ]; then
      echo "Pushing images to registry..."
      docker push "$API_IMAGE"
      docker push "$DASHBOARD_IMAGE"
      docker push "$WEBSITE_IMAGE"
      docker push "$ENGINE_IMAGE"
    fi
    
    echo "✓ Build complete"
    ;;
    
  up|deploy)
    if [ "$ENV" != "local" ] && [ -n "${STAGING_DOCKER_HOST:-}" ] && [ "$ENV" = "staging" ]; then
      export DOCKER_HOST="$STAGING_DOCKER_HOST"
    fi
    if [ "$ENV" != "local" ] && [ -n "${PROD_DOCKER_HOST:-}" ] && [ "$ENV" = "prod" ]; then
      export DOCKER_HOST="$PROD_DOCKER_HOST"
    fi
    
    echo "Starting containers for $ENV..."
    docker compose $COMPOSE_FILES --profile "$PROFILE" -p "$PROJECT" pull || true
    docker compose $COMPOSE_FILES --profile "$PROFILE" -p "$PROJECT" up -d
    
    echo "✓ Containers running"
    docker compose $COMPOSE_FILES --profile "$PROFILE" -p "$PROJECT" ps
    ;;
    
  down)
    echo "Stopping containers for $ENV..."
    docker compose $COMPOSE_FILES --profile "$PROFILE" -p "$PROJECT" down
    echo "✓ Containers stopped"
    ;;
    
  logs)
    docker compose $COMPOSE_FILES --profile "$PROFILE" -p "$PROJECT" logs -f
    ;;
    
  *)
    echo "Error: Invalid action '$ACTION'"
    usage
    ;;
esac
