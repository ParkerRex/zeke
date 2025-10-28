---
status: resolved
priority: p2
issue_id: "005"
tags: [security, ddos, performance, api]
dependencies: []
---

# Missing Rate Limiting on Critical Health Endpoints

## Problem Statement
While protected routes have rate limiting (100 req/10min), critical health check endpoints lack rate limiting. This creates a DDoS vulnerability where attackers could overwhelm the system by repeatedly hitting these unprotected endpoints.

## Findings
- Protected routes have rate limiting configured
- Missing rate limiting on:
  - `/health` endpoint (line 46)
  - `/health/pools` endpoint (line 63)
  - `/health/db` endpoint (line 118)
- Location: `apps/api/src/index.ts`
- Health endpoints can be expensive (DB queries)
- Could cause resource exhaustion

## Proposed Solutions

### Option 1: Add Rate Limiting to Health Endpoints (Recommended)
- **Implementation**: Apply rate limiter middleware to health routes
  ```typescript
  app.get("/health", rateLimiter, async (c) => {...});
  ```
- **Pros**:
  - Consistent protection across all endpoints
  - Prevents resource exhaustion
  - Simple to implement
  - Uses existing rate limiter
- **Cons**:
  - May affect legitimate monitoring
- **Effort**: Small (< 1 hour)
- **Risk**: Low

### Option 2: Separate Rate Limits for Health
- **Implementation**: Create specific rate limits for health checks
- **Pros**:
  - More granular control
  - Higher limits for monitoring tools
- **Cons**:
  - More complex configuration
  - Additional middleware setup
- **Effort**: Small
- **Risk**: Low

### Option 3: Implement Caching
- **Implementation**: Cache health check results
- **Pros**:
  - Reduces computation per request
  - Better performance
- **Cons**:
  - Stale health data
  - More complex
- **Effort**: Medium
- **Risk**: Medium

## Recommended Action
Add existing rate limiter to all health endpoints

## Technical Details
- **Affected Files**:
  - `apps/api/src/index.ts`
- **Related Components**: Health check endpoints, monitoring
- **Database Changes**: No

## Resources
- Rate limiting best practices
- DDoS prevention strategies

## Acceptance Criteria
- [ ] Rate limiting applied to /health endpoint
- [ ] Rate limiting applied to /health/pools endpoint
- [ ] Rate limiting applied to /health/db endpoint
- [ ] Appropriate limits set (consider monitoring needs)
- [ ] Test rate limiting works correctly
- [ ] Monitoring tools can still access endpoints
- [ ] Document rate limits for ops team

## Work Log

### 2025-10-28 - Initial Discovery
**By:** Claude Triage System
**Actions:**
- Identified unprotected health endpoints
- Found existing rate limiter not applied
- Categorized as P2 security issue

**Learnings:**
- Health endpoints often overlooked for protection
- Even simple endpoints need rate limiting
- Consistency in security controls important

## Notes
Source: Security analysis triage session on 2025-10-28
Important for DDoS prevention and system stability