#!/usr/bin/env bash

echo "Stopping all Zeke services..."

# Stop Node/Bun processes running our apps
pkill -f "apps/api" || true
pkill -f "apps/dashboard" || true
pkill -f "apps/website" || true
pkill -f "apps/desktop" || true

# Stop Redis
docker stop zeke-redis 2>/dev/null || true

echo "✓ All services stopped"
