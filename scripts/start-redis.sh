#!/usr/bin/env bash
set -e

echo "Starting Redis..."
docker run -d --name zeke-redis -p 6379:6379 redis:7-alpine || docker start zeke-redis
echo "Redis running on port 6379"
