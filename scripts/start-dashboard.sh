#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../apps/dashboard"
echo "Starting Dashboard..."
bun run dev
