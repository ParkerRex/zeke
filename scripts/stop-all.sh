#!/usr/bin/env bash

echo "Stopping Zeke services..."

# Stop Node/Bun processes running our apps
pkill -f "apps/api" 2>/dev/null || true
pkill -f "apps/dashboard" 2>/dev/null || true
pkill -f "apps/website" 2>/dev/null || true
pkill -f "apps/engine" 2>/dev/null || true

echo "✅ Application services stopped"

# Check for --docker flag to also stop Docker services
if [ "$1" = "--docker" ] || [ "$1" = "-d" ]; then
    echo "Stopping Docker services..."
    docker compose down 2>/dev/null || true
    echo "✅ Docker services stopped"
else
    echo ""
    echo "ℹ️  Docker services still running. To stop them too, use:"
    echo "   bun run stop -- --docker"
    echo "   # or: docker compose down"
fi
