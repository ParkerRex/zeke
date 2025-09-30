#!/usr/bin/env bash
set -a
source "$(dirname "$0")/../.env"
set +a
exec npx trigger.dev@latest dev "$@"