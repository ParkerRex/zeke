#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(dirname "$0")"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting Zeke development environment..."
echo ""

# Load root env vars if present so child apps get required config
if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    source "$ROOT_DIR/.env"
    set +a
fi

# Start all Docker services (Postgres, Redis, MinIO)
echo "📦 Starting Docker services..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d postgres redis minio 2>/dev/null || {
    echo "⚠️  Docker compose failed. Make sure Docker is running."
    exit 1
}

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=30
while [ $timeout -gt 0 ]; do
    pg_ready=$(docker compose exec -T postgres pg_isready -U zeke 2>/dev/null && echo "yes" || echo "no")
    redis_ready=$(docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG && echo "yes" || echo "no")
    minio_ready=$(curl -sf http://localhost:9000/minio/health/live 2>/dev/null && echo "yes" || echo "no")

    if [ "$pg_ready" = "yes" ] && [ "$redis_ready" = "yes" ] && [ "$minio_ready" = "yes" ]; then
        break
    fi

    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "⚠️  Timeout waiting for services. Check docker compose logs."
fi

echo "✅ Docker services ready"
echo "   PostgreSQL: localhost:5435"
echo "   Redis:      localhost:6379"
echo "   MinIO:      localhost:9000 (console: 9001)"
echo ""

# Start application services
echo "🔧 Starting application services..."

cd "$ROOT_DIR/apps/api" && bun run dev &
API_PID=$!

cd "$ROOT_DIR/apps/dashboard" && bun run dev &
DASH_PID=$!

cd "$ROOT_DIR/apps/engine" && bun run start &
ENGINE_PID=$!

echo ""
echo "✅ All services started"
echo ""
echo "   📡 API:       http://localhost:3003"
echo "   🖥️  Dashboard: http://localhost:3001"
echo "   ⚙️  Engine:    http://localhost:3010"
echo ""
echo "   📦 PostgreSQL: localhost:5435"
echo "   📦 Redis:      localhost:6379"
echo "   📦 MinIO:      localhost:9000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo ''; echo 'Stopping application services...'; kill $API_PID $DASH_PID $ENGINE_PID 2>/dev/null; echo 'Done. Docker services still running (use: docker compose down)'; exit" INT TERM

wait
