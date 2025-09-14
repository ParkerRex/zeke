# Development Memory Optimizations

This document outlines the memory leak fixes and optimizations implemented to improve the development experience.

## 🚀 Quick Start

Choose your development mode based on what you're doing:

```bash
# Normal mode - Balanced performance (default)
pnpm dev

# Fast mode - Optimized for speed, some features disabled
pnpm dev:fast

# Aggressive mode - MAXIMUM SPEED, most features disabled
pnpm dev:aggressive

# Debug mode - Full features for debugging production issues
pnpm dev:debug
```

## 🎯 Best Practice: "Disable Everything in Dev"

**Philosophy**: If it's not essential for coding, disable it in development.

### ✅ What Should Be Disabled in Dev:
- **Monitoring**: Sentry, BetterStack, analytics
- **Security**: Arcjet, rate limiting, bot protection
- **Optimizations**: Source maps, minification, image optimization
- **External Services**: Email sending, payment processing
- **Build Features**: Type checking, linting (run separately)

## 🔧 Optimizations Implemented

### 1. Logging Optimizations

**Problem**: BetterStack/Logtail was causing memory leaks in development with excessive console output.

**Solution**:
- Disabled Logtail in development mode
- Created minimal console logger for development
- Added debug level control via `DEBUG` environment variable

**Files Modified**:
- `packages/observability/next-config.ts`
- `packages/observability/log.ts`

### 2. Security Middleware Optimizations

**Problem**: Arcjet security middleware was consuming memory unnecessarily in development.

**Solution**:
- Skip Arcjet processing when `NODE_ENV=development`
- Maintain security headers without the overhead
- Early return in security functions for development

**Files Modified**:
- `packages/security/index.ts`
- `apps/app/middleware.ts`
- `apps/web/middleware.ts`

### 3. Next.js Configuration Optimizations

**Problem**: Production-focused configurations were causing memory overhead in development.

**Solution**:
- Disabled source maps in development
- Optimized webpack chunk splitting
- Reduced parallel processing
- Added memory-efficient experimental flags

**Files Modified**:
- `packages/next-config/index.ts`
- `packages/next-config/dev-config.ts` (new)
- `apps/app/next.config.ts`
- `apps/web/next.config.ts`

### 4. Sentry Optimizations

**Problem**: Sentry instrumentation was causing memory leaks in development.

**Solution**:
- Skip Sentry initialization in development
- Reduced trace sample rates
- Disabled debug mode
- Conditional Sentry loading

**Files Modified**:
- `packages/observability/client.ts`
- `packages/observability/instrumentation.ts`
- `apps/app/lib/monitoring/sentry-config.ts`

### 5. Node.js Memory Flags

**Problem**: Default Node.js memory settings were insufficient for development.

**Solution**:
- Increased max old space size to 4GB
- Optimized garbage collection
- Added memory flags to dev scripts

**Files Modified**:
- `apps/app/package.json`
- `apps/web/package.json`
- `scripts/dev-start.sh`

## 🎛️ Environment Variables

The following environment variables control development optimizations:

```bash
# Core development settings
NODE_ENV=development
NEXT_REDUCE_MEMORY=true
TURBOPACK_MEMORY_LIMIT=2048

# Disable memory-intensive features
DISABLE_SENTRY=true
DISABLE_ARCJET=true
DISABLE_LOGTAIL=true
DISABLE_ANALYTICS=true

# Logging control
LOG_LEVEL=error
DEBUG=false

# Node.js memory settings
NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128 --gc-interval=100"
```

## 📊 Memory Usage Improvements

Expected improvements with these optimizations:

- **Initial Memory**: Reduced by ~30-40%
- **Memory Growth**: Significantly slower accumulation
- **Build Speed**: 20-30% faster in development
- **Hot Reload**: More stable, less memory spikes

## 🛠️ Development Scripts

### New Scripts Added

- `scripts/dev-optimize.sh` - Apply memory optimizations
- `.env.development.example` - Template for development environment

### Modified Scripts

- `scripts/dev-start.sh` - Now includes memory optimizations
- `apps/app/package.json` - Added Node.js memory flags
- `apps/web/package.json` - Added Node.js memory flags

## 🔍 Monitoring Memory Usage

To monitor memory usage during development:

```bash
# Monitor Node.js memory usage
node --inspect apps/app/node_modules/.bin/next dev --turbopack

# Use Chrome DevTools to monitor memory
# Open chrome://inspect in Chrome browser

# Monitor system memory
htop  # or Activity Monitor on macOS
```

## 🚨 Troubleshooting

### If Memory Issues Persist

1. **Check Environment Variables**:
   ```bash
   echo $NODE_OPTIONS
   echo $NEXT_REDUCE_MEMORY
   ```

2. **Verify Optimizations Are Applied**:
   - Check console for "Development optimizations applied" message
   - Verify Sentry/Arcjet are disabled in development

3. **Increase Memory Limits**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=6144"
   ```

4. **Clear Caches**:
   ```bash
   pnpm clean
   rm -rf .next
   rm -rf node_modules/.cache
   ```

### Common Issues

- **Turbopack Memory Errors**: Increase `TURBOPACK_MEMORY_LIMIT`
- **Build Failures**: Temporarily disable optimizations
- **Hot Reload Issues**: Restart dev server with optimizations

## 📝 Notes

- These optimizations are automatically applied when `NODE_ENV=development`
- Production builds are unaffected by these changes
- Some features (Sentry, Arcjet) are disabled in development for performance
- Memory usage should stabilize after initial load and remain relatively constant
