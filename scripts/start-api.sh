#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../apps/api"
echo "Starting API on port 3003..."
TZ=UTC PORT=3003 bun --hot ./src/index.ts
