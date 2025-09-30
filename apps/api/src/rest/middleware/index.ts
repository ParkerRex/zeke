import type { MiddlewareHandler } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { withAuth } from "./auth";
import { withDatabase } from "./db";
import { withPrimaryReadAfterWrite } from "./primary-read-after-write";

/**
 * Public endpoint middleware for research content endpoints
 * Only attaches database with smart routing - no authentication required
 * Used for: content discovery, public research feeds, health checks
 */
export const publicMiddleware: MiddlewareHandler[] = [withDatabase];

/**
 * Protected endpoint middleware for authenticated research operations
 * Supports both API keys and OAuth tokens for research team access
 * Used for: content analysis, story management, team collaboration
 * Note: withAuth must be first to set session in context
 */
export const protectedMiddleware: MiddlewareHandler[] = [
  withDatabase,
  withAuth,
  rateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 100,
    keyGenerator: (c) => {
      return c.get("session")?.user?.id ?? "unknown";
    },
    statusCode: 429,
    message: "Research API rate limit exceeded. Please try again later.",
  }),
  withPrimaryReadAfterWrite,
];

export { withRequiredScope } from "./scope";
