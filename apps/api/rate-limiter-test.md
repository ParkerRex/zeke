# Rate Limiter Implementation for Health Endpoints

## Changes Made

### 1. Added rate limiter import
- Location: `/apps/api/src/index.ts` line 8
- Imported `rateLimiter` from `hono-rate-limiter`

### 2. Created health endpoint rate limiter configuration
- Location: `/apps/api/src/index.ts` lines 47-55
- Configuration:
  - Window: 1 minute (60,000ms)
  - Limit: 60 requests per minute per IP
  - Key generator: Uses X-Forwarded-For or X-Real-IP headers
  - Status code: 429 (Too Many Requests)
  - Custom error message: "Rate limit exceeded for health endpoint"

### 3. Applied rate limiter to health endpoints

#### `/health` endpoint
- Location: Line 57
- Added `healthRateLimiter` middleware

#### `/health/pools` endpoint
- Location: Line 74
- Added `healthRateLimiter` middleware

#### `/health/db` endpoint
- Location: Line 129
- Added `healthRateLimiter` middleware

## Rate Limit Configuration Rationale

The health endpoints are configured with more generous limits than other public endpoints because:

1. **Monitoring Tools**: Health checks are typically polled frequently by monitoring systems
2. **60 requests/minute**: Allows for monitoring intervals of 1 second while leaving headroom
3. **IP-based**: Prevents DDoS attacks from distributed sources while allowing legitimate monitoring
4. **1-minute window**: Short enough to prevent sustained abuse, long enough for typical monitoring needs

## Comparison with Other Rate Limiters

### Protected Routes (User-based)
- Window: 10 minutes
- Limit: 100 requests
- Key: User ID

### OAuth Routes (IP-based)
- Window: 15 minutes
- Limit: 20 requests
- Key: IP address

### Health Routes (IP-based) - NEW
- Window: 1 minute
- Limit: 60 requests
- Key: IP address

## Testing

To test the rate limiting:

1. Start the API server:
   ```bash
   bun run dev
   ```

2. Test normal access (should succeed):
   ```bash
   curl http://localhost:3003/health
   ```

3. Test rate limiting (after 60 requests in 1 minute):
   ```bash
   for i in {1..65}; do curl -w "\nRequest $i: %{http_code}\n" http://localhost:3003/health; done
   ```

Expected behavior:
- First 60 requests: HTTP 200
- Requests 61+: HTTP 429 with message "Rate limit exceeded for health endpoint"

## Security Benefits

1. **DDoS Protection**: Prevents attackers from overwhelming the system via health endpoints
2. **Resource Conservation**: Limits expensive database queries from health checks
3. **Maintains Availability**: Ensures legitimate monitoring can still function
4. **Consistent Security**: All public endpoints now have rate limiting
