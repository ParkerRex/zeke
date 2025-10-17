#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../apps/website"
echo "Starting Website..."
bun run dev
