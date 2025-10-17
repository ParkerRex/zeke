#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../apps/desktop"
echo "Starting Desktop..."
bun run dev
