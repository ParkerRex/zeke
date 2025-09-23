# Cache Package

## Cache Preferences

- Build new caches on top of RedisCache; never call createClient directly so connection pooling, logging, and health checks stay centralized.
- Use a clear prefix per domain (new RedisCache("team", ttl)), keep TTLs explicit, and document why non-default TTLs are chosen.
- Always type the cache interface (cache.get<User>) and serialize only JSON-safe payloads; persist complex types as IDs or strings the consumer can rehydrate.
- Handle cache misses and Redis failures as soft-failures; never let them bubble into user-facing errors. Log with relevant key context and reset the cached client on error like the existing helpers.
- Invalidate keys as part of the mutation flow that makes cached data stale; prefer small, scoped keys over broad flushes.
- Add lightweight test coverage with the Bun script before shipping changes that modify connection logic or serialization rules.

## Layout Guide

```
packages/cache/
├── package.json                 # Package manifest exporting each cache helper and declaring Redis deps.
├── tsconfig.json                # TypeScript configuration for the cache package build.
└── src/
    ├── redis-client.ts          # Shared Redis wrapper handling connections, key namespacing, TTLs, and health checks.
    ├── api-key-cache.ts         # Cache facade for API key records keyed by secret or id.
    ├── user-cache.ts            # Cache facade for user payloads; thin wrapper to store serialized user data.
    ├── team-cache.ts            # Boolean access cache for user-to-team membership checks.
    ├── team-permissions-cache.ts# String-based cache for per-team permission payloads/roles.
    ├── replication-cache.ts     # Short-lived cache tracking replica-safe windows after write operations.
    ├── health.ts                # Health-check helper that pings Redis via `RedisCache`.
    └── test-redis.ts            # Bun script to manually exercise cache helpers against a live Redis instance.
```