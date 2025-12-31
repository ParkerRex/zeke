#!/usr/bin/env bash
set -a
source "$(dirname "$0")/../../../.env" 2>/dev/null || true
source "$(dirname "$0")/../.env" 2>/dev/null || true
set +a
exec pnpm worker:dev "$@"
