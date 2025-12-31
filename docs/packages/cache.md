# Cache Package

Redis distributed caching layer.

## Overview

| Property | Value |
|----------|-------|
| Package | `@zeke/cache` |
| Backend | Redis |
| Default TTL | 30 minutes |

## Exports

```typescript
import { redis } from "@zeke/cache/redis-client";
import { apiKeyCache } from "@zeke/cache/api-key-cache";
import { userCache } from "@zeke/cache/user-cache";
import { teamCache } from "@zeke/cache/team-cache";
```

| Export | Description | TTL |
|--------|-------------|-----|
| `./redis-client` | Base Redis client | - |
| `./api-key-cache` | API key lookups | 30 min |
| `./user-cache` | User data | 30 min |
| `./team-cache` | Team access | 30 min |
| `./team-permissions-cache` | Permissions | 30 min |
| `./replication-cache` | Read consistency | 10 sec |
| `./chat-cache` | Chat context | varies |

## Redis Client

```typescript
import { redis } from "@zeke/cache/redis-client";

// Basic operations
await redis.set("key", "value");
const value = await redis.get("key");
await redis.del("key");

// With expiry
await redis.setex("key", 3600, "value");  // 1 hour

// JSON
await redis.set("user:123", JSON.stringify(user));
const user = JSON.parse(await redis.get("user:123"));
```

## Cache Helpers

### API Key Cache

```typescript
import { apiKeyCache } from "@zeke/cache/api-key-cache";

// Get cached or fetch
const apiKey = await apiKeyCache.get(keyHash, async () => {
  return await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });
});

// Invalidate
await apiKeyCache.invalidate(keyHash);
```

### User Cache

```typescript
import { userCache } from "@zeke/cache/user-cache";

const user = await userCache.get(userId, async () => {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
});
```

### Team Cache

```typescript
import { teamCache } from "@zeke/cache/team-cache";

const team = await teamCache.get(teamId, async () => {
  return await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });
});
```

## Cache Key Pattern

Keys follow the pattern: `{prefix}:{identifier}`:

```
api-key:{keyHash}
user:{userId}
team:{teamId}
team:user:{userId}:team:{teamId}
```

## Replication Cache

For read-after-write consistency:

```typescript
import { replicationCache } from "@zeke/cache/replication-cache";

// After write, cache briefly
await replicationCache.set(`story:${storyId}`, story);

// On read, check cache first
const cached = await replicationCache.get(`story:${storyId}`);
if (cached) return cached;

// Otherwise read from database
return await db.query.stories.findFirst(...);
```

## Configuration

### Development

```typescript
const redis = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});
```

### Production (Fly.io)

```typescript
const redis = new Redis(process.env.REDIS_URL, {
  family: 6,  // IPv6
  maxRetriesPerRequest: 10,
  connectTimeout: 10000,
  tls: {},
});
```

## Environment Variables

```bash
# Development
REDIS_URL=redis://localhost:6379

# Production (with auth)
REDIS_URL=redis://:password@redis-host:6379
```

## Docker Setup

```bash
# Start Redis
docker compose up -d redis

# Test connection
redis-cli -h localhost -p 6379 PING
```

## Cache Invalidation

```typescript
// Single key
await redis.del("user:123");

// Pattern (careful in production)
const keys = await redis.keys("team:123:*");
if (keys.length > 0) {
  await redis.del(...keys);
}

// Full flush (development only)
await redis.flushall();
```

## Monitoring

```bash
# Monitor commands in real-time
redis-cli MONITOR

# Memory usage
redis-cli INFO memory

# Key count
redis-cli DBSIZE
```

## Related

- [API Application](../apps/api.md)
- [Database Package](./database.md)
