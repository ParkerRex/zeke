# @zeke/cache

Redis-based caching layer for Zeke application.

## Overview

This package provides a unified Redis caching interface for various application data including:
- User data (`user-cache.ts`)
- Team access permissions (`team-cache.ts`)
- Team permissions (`team-permissions-cache.ts`)
- Replication state (`replication-cache.ts`)
- Chat context (`chat-cache.ts`)
- Suggested actions (`suggested-actions-cache.ts`)

## Setup

### Local Development

Redis runs automatically when you start the dev server:

```bash
bun dev  # Starts Redis via docker-compose, then starts all services
```

Manual Redis commands:

```bash
bun run redis:start  # Start Redis container
bun run redis:stop   # Stop Redis container
bun run redis:logs   # View Redis logs
```

### Environment Variables

Required environment variable in `.env.local`:

```bash
REDIS_URL="redis://localhost:6379"
```

For production, use a managed Redis service (Upstash, Redis Cloud, etc.) and update `REDIS_URL` accordingly.

## Architecture

All caches extend the `RedisCache` class (`redis-client.ts`) which provides:
- Automatic connection management with reconnection logic
- Graceful degradation (returns `undefined` when Redis unavailable in dev)
- JSON serialization/deserialization
- Configurable TTL (time-to-live) per cache type
- IPv6 support for production (Fly.io)

### Cache Keys

Cache keys follow this pattern: `{prefix}:{key}`

Example:
- Team access: `team:user:{userId}:team:{teamId}`
- User data: `user:{userId}`

## Usage

```typescript
import { teamCache } from "@zeke/cache/team-cache";
import { userCache } from "@zeke/cache/user-cache";

// Set cache with default TTL (30 minutes for team cache)
await teamCache.set("user:123:team:456", true);

// Get from cache
const hasAccess = await teamCache.get("user:123:team:456");

// Delete from cache
await teamCache.delete("user:123:team:456");

// Custom TTL (in seconds)
await userCache.set("user:123", userData, 60 * 60); // 1 hour
```

## Development Notes

- **Caching is now enabled in development** for better performance and production parity
- Redis is **automatically started** when you run `bun dev`
- If Redis is unavailable, cache operations gracefully degrade (no-op) with warnings
- Redis is **required** in production for proper caching and team access validation
- Cache misses automatically query the database and populate the cache
- All cache operations are non-blocking and fail gracefully

## Docker Compose Configuration

The Redis container is configured in the root `docker-compose.yml`:

- **Image**: `redis:7-alpine`
- **Port**: `6379`
- **Memory**: 256MB with LRU eviction
- **Persistence**: Enabled with AOF (append-only file)
- **Health checks**: Every 5 seconds

## Production Deployment

**Self-Hosted on VPS:**

Zeke runs Redis as a Docker container on our VPS alongside other application services. This gives us full control, reduces external dependencies, and simplifies our infrastructure.

### VPS Docker Setup

The same `docker-compose.yml` is used in production with environment-specific overrides:

```yaml
# docker-compose.prod.yml (example override)
services:
  redis:
    restart: always
    volumes:
      - /var/lib/redis-data:/data  # Persistent storage on VPS
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru --requirepass ${REDIS_PASSWORD}
```

**Production Configuration:**
1. **Persistence**: AOF (append-only file) enabled for data durability
2. **Memory**: Allocated based on VPS resources (recommend 1-2GB)
3. **Security**: Password-protected (`--requirepass`)
4. **Restart Policy**: `always` for automatic recovery
5. **Monitoring**: Health checks + application metrics
6. **Backups**: Regular AOF file backups to external storage

**Connection String:**
```bash
REDIS_URL="redis://:${REDIS_PASSWORD}@localhost:6379"
```

### High Availability (Optional)

For critical production workloads:
- **Redis Sentinel**: Automatic failover with master-replica setup
- **Separate Container**: Run Redis on dedicated VPS for resource isolation
- **Monitoring**: Prometheus + Grafana for cache metrics

### Alternative: Managed Services

While we self-host, you can alternatively use:
- **Upstash Redis**: Serverless Redis with REST API
- **Redis Cloud**: Managed Redis by Redis Inc.
- **DigitalOcean Managed Redis**: VPS-friendly managed option

Simply update `REDIS_URL` to point to the managed instance.
