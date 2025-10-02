# Cache Package

Redis-based caching layer for Zeke using direct Redis connections (not Upstash REST API).

## Cache Preferences

- **Always** build new caches on top of `RedisCache`; never call `createClient` directly so connection pooling, logging, health checks, and graceful degradation stay centralized.
- Use a clear prefix per domain (`new RedisCache("team", ttl)`), keep TTLs explicit, and document why non-default TTLs are chosen.
- Always type the cache interface (`cache.get<User>`) and serialize only JSON-safe payloads; persist complex types as IDs or strings the consumer can rehydrate.
- Handle cache misses and Redis failures as soft-failures; never let them bubble into user-facing errors. Log with relevant key context and reset the cached client on error like existing helpers.
- **Caching is enabled in all environments** (dev, staging, production) for production parity. The `redis-client.ts` gracefully degrades when Redis is unavailable in development.
- Invalidate keys as part of the mutation flow that makes cached data stale; prefer small, scoped keys over broad flushes.
- Never bypass caching based on `NODE_ENV` checks - let `RedisCache` handle graceful degradation automatically.
- Add lightweight test coverage with the Bun script before shipping changes that modify connection logic or serialization rules.

## Development Setup

Redis runs via Docker Compose and starts automatically with `bun dev`:

```bash
bun dev                   # Starts Redis + all services automatically
bun run redis:start       # Start Redis manually
bun run redis:stop        # Stop Redis
bun run redis:logs        # View Redis logs
docker exec zeke-redis redis-cli ping  # Test connection
```

**Environment Variables:**
- `REDIS_URL="redis://localhost:6379"` (required, auto-added to `.env.local`)
- Local dev uses IPv4, production uses IPv6 for Fly.io
- Graceful degradation: if `REDIS_URL` is missing in dev, cache operations return `undefined` with warnings

**Docker Compose Configuration** (root `docker-compose.yml`):
- Image: `redis:7-alpine`
- Port: `6379`
- Memory: 256MB with LRU eviction
- Persistence: AOF (append-only file)
- Health checks every 5 seconds

## Layout Guide

```
packages/cache/
├── package.json                 # Exports cache helpers, depends on redis@^5.8.2 (not @upstash)
├── tsconfig.json                # TypeScript build config
├── README.md                    # User documentation with setup, usage examples, production deployment
├── AGENTS.md                    # This file - architecture and development guidelines
└── src/
    ├── redis-client.ts          # Core RedisCache class: connections, namespacing, TTLs, graceful degradation
    ├── user-cache.ts            # User data cache (30min TTL)
    ├── team-cache.ts            # Team access boolean cache (30min TTL)
    ├── team-permissions-cache.ts# Team permission strings (30min TTL)
    ├── chat-cache.ts            # Chat user context cache (30min TTL) - NOW ENABLED IN DEV
    ├── suggested-actions-cache.ts# Action usage tracking (24hr TTL)
    ├── replication-cache.ts     # Write replication lag windows (10s TTL)
    ├── health.ts                # Redis health check via ping
    └── test-redis.ts            # Manual test script for all cache operations
```

## Key Implementation Details

### RedisCache Class (`redis-client.ts`)

**Connection Management:**
- Lazy connection: creates Redis client on first operation
- IPv4 for local dev, IPv6 for Fly.io production
- Ping interval: 4 minutes (proven stable)
- Auto-reconnect with connection reset on errors

**Graceful Degradation in Development:**
```typescript
if (!redisUrl && isDev) {
  console.warn("⚠️  REDIS_URL not configured");
  throw new Error("REDIS_UNAVAILABLE_DEV");
}
```
- All cache operations catch this error and return `undefined` (get) or no-op (set/delete)
- Allows app to run without Redis in emergency, but `bun dev` starts it automatically

**Key Namespacing:**
- Pattern: `{prefix}:{key}` (e.g., `team:user:123:team:456`)
- Each cache instance has its own prefix for isolation

**Serialization:**
- JSON.stringify for complex objects
- Strings pass through unchanged for backwards compatibility
- Always type your cache operations: `cache.get<YourType>(key)`

### Cache Usage in Application

**Team Access** (`apps/api/src/auth/team.ts`):
```typescript
const cacheKey = `user:${userId}:team:${teamId}`;
let hasAccess = await teamCache.get(cacheKey);
if (hasAccess === undefined) {
  // Query DB, compute access, cache result
  hasAccess = computeAccess();
  await teamCache.set(cacheKey, hasAccess);
}
```

**Chat Context** (`apps/api/src/ai/utils/get-user-context.ts`):
- Previously bypassed in development - **now active in all environments**
- Caches user context for AI chat to avoid repeated DB queries

**Replication Lag** (`apps/api/src/trpc/middleware/primary-read-after-write.ts`):
- Short-lived cache (10s) to force primary DB reads after writes
- Prevents stale data from read replicas

## Migration Notes

**Previous State:**
- `chat-cache.ts` had `if (isDevelopment) return Promise.resolve(undefined)` bypass
- Comment said "Disable caching in development"
- Caused production-dev behavior mismatch

**Current State:**
- All caches work in all environments
- `RedisCache` handles missing Redis gracefully in dev
- Better production parity
- Docker Compose manages Redis locally
- `bun dev` starts Redis automatically

**Deployment Strategy:**
- **Production**: Self-hosted Redis on VPS via Docker Compose
- **Development**: Local Docker container (same image as production)
- Package uses native `redis` package (binary protocol, not REST API)
- `UPSTASH_REDIS_REST_URL` env vars exist but unused (legacy from planning phase)
- Connection string format: `redis://:${REDIS_PASSWORD}@host:6379` (production) or `redis://localhost:6379` (dev)

**Production VPS Setup:**
- Same `docker-compose.yml` with production overrides
- Password-protected (`--requirepass`)
- Persistent storage on VPS disk (`/var/lib/redis-data`)
- 1-2GB memory allocation with LRU eviction
- Automatic restart policy for reliability