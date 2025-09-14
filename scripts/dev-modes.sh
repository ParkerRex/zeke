#!/usr/bin/env bash
set -euo pipefail

# Development Mode Selector
# Choose your development experience based on what you're doing

show_help() {
    echo "🚀 ZEKE Development Modes"
    echo ""
    echo "Usage: bash scripts/dev-modes.sh [mode]"
    echo ""
    echo "Modes:"
    echo "  normal      - Balanced development (default)"
    echo "  fast        - Optimized for speed, some features disabled"
    echo "  aggressive  - Maximum speed, most features disabled"
    echo "  debug       - Full features enabled for debugging"
    echo ""
    echo "Examples:"
    echo "  bash scripts/dev-modes.sh fast && pnpm dev"
    echo "  bash scripts/dev-modes.sh aggressive && pnpm dev:next"
}

set_normal_mode() {
    echo "🔧 Setting NORMAL development mode..."
    export NODE_ENV=development
    export DEV_MODE=normal
    export NEXT_REDUCE_MEMORY=true
    export DISABLE_SENTRY=true
    export DISABLE_ARCJET=true
    export LOG_LEVEL=info
    export NODE_OPTIONS="--max-old-space-size=4096"
    echo "✅ Normal mode: Balanced performance and features"
}

set_fast_mode() {
    echo "⚡ Setting FAST development mode..."
    export NODE_ENV=development
    export DEV_MODE=fast
    export NEXT_REDUCE_MEMORY=true
    export FAST_DEV=true
    
    # Disable more stuff
    export DISABLE_SENTRY=true
    export DISABLE_ARCJET=true
    export DISABLE_LOGTAIL=true
    export DISABLE_ANALYTICS=true
    export DISABLE_PERFORMANCE_MONITORING=true
    
    # Build optimizations
    export NEXT_DISABLE_SOURCEMAPS=true
    export NEXT_SKIP_TYPE_CHECK=true
    
    # Memory settings
    export LOG_LEVEL=error
    export NODE_OPTIONS="--max-old-space-size=3072"
    export TURBOPACK_MEMORY_LIMIT=1536
    
    echo "✅ Fast mode: Optimized for speed, some features disabled"
}

set_aggressive_mode() {
    echo "🔥 Setting AGGRESSIVE development mode..."
    export NODE_ENV=development
    export DEV_MODE=aggressive
    export FAST_DEV=true
    
    # Disable ALL the things
    export DISABLE_SENTRY=true
    export DISABLE_ARCJET=true
    export DISABLE_LOGTAIL=true
    export DISABLE_ANALYTICS=true
    export DISABLE_POSTHOG=true
    export DISABLE_STRIPE_WEBHOOKS=true
    export DISABLE_EMAIL_SENDING=true
    export DISABLE_PERFORMANCE_MONITORING=true
    
    # Aggressive build settings
    export NEXT_DISABLE_SOURCEMAPS=true
    export NEXT_DISABLE_SWC_MINIFY=true
    export NEXT_SKIP_TYPE_CHECK=true
    export NEXT_SKIP_LINT=true
    
    # Minimal logging
    export LOG_LEVEL=error
    export DEBUG=false
    
    # Tight memory limits
    export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=64"
    export TURBOPACK_MEMORY_LIMIT=1024
    
    echo "✅ Aggressive mode: MAXIMUM SPEED - most features disabled"
    echo "⚠️  Use this for rapid prototyping only!"
}

set_debug_mode() {
    echo "🐛 Setting DEBUG development mode..."
    export NODE_ENV=development
    export DEV_MODE=debug
    
    # Enable more features for debugging
    export DISABLE_SENTRY=false
    export DISABLE_ARCJET=false
    export LOG_LEVEL=debug
    export DEBUG=true
    
    # More memory for debugging
    export NODE_OPTIONS="--max-old-space-size=6144 --inspect"
    export TURBOPACK_MEMORY_LIMIT=3072
    
    echo "✅ Debug mode: Full features enabled for debugging"
    echo "🔍 Chrome DevTools available at chrome://inspect"
}

# Main logic
case "${1:-normal}" in
    "normal")
        set_normal_mode
        ;;
    "fast")
        set_fast_mode
        ;;
    "aggressive")
        set_aggressive_mode
        ;;
    "debug")
        set_debug_mode
        ;;
    "help"|"-h"|"--help")
        show_help
        exit 0
        ;;
    *)
        echo "❌ Unknown mode: $1"
        show_help
        exit 1
        ;;
esac

echo ""
echo "🎯 Mode set! Now run:"
echo "   pnpm dev              # Start all services"
echo "   pnpm dev:next         # Start main app only"
echo "   pnpm dev:web          # Start marketing site only"
