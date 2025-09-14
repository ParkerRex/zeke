#!/usr/bin/env bash
set -euo pipefail

# Development Environment Optimization Script
# This script optimizes the development environment to reduce memory usage

echo "🚀 Optimizing development environment for memory efficiency..."

# Set memory optimization environment variables
export NODE_ENV=development
export NEXT_DISABLE_SOURCEMAPS=true
export NEXT_DISABLE_SWC_MINIFY=true
export NEXT_REDUCE_MEMORY=true
export TURBOPACK_MEMORY_LIMIT=2048
export DISABLE_SENTRY=true
export DISABLE_ARCJET=true
export DISABLE_LOGTAIL=true
export DISABLE_ANALYTICS=true
export LOG_LEVEL=error

# Node.js memory optimization flags
export NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128"

# Reduce garbage collection frequency to improve performance
export NODE_OPTIONS="$NODE_OPTIONS --gc-interval=100"

# Enable experimental memory optimizations
export NODE_OPTIONS="$NODE_OPTIONS --experimental-vm-modules"

echo "✅ Development environment optimized for memory efficiency"
echo "📊 Memory settings:"
echo "   - Node.js max memory: 4GB"
echo "   - Turbopack memory limit: 2GB"
echo "   - Source maps: disabled"
echo "   - Sentry: disabled"
echo "   - Arcjet: disabled"
echo "   - Logtail: disabled"
echo ""
echo "🔧 To use these optimizations, source this script before running dev:"
echo "   source scripts/dev-optimize.sh && pnpm dev"
