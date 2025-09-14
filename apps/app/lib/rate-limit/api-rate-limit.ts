import type { AuthResult } from '@/lib/auth/middleware-helpers';
import { createRateLimiter, slidingWindow } from '@zeke/rate-limit';
import { NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/monitoring/sentry-config';

// Rate limit configurations for different endpoint types
export const RATE_LIMITS = {
  // General API endpoints
  api: slidingWindow(100, '1 m'), // 100 requests per minute

  // Admin endpoints (more restrictive)
  admin: slidingWindow(50, '1 m'), // 50 requests per minute

  // Story endpoints (moderate)
  stories: slidingWindow(200, '1 m'), // 200 requests per minute

  // Share endpoints (more permissive for public sharing)
  share: slidingWindow(20, '1 m'), // 20 requests per minute

  // Webhook endpoints (very permissive, Stripe handles their own limits)
  webhooks: slidingWindow(1000, '1 m'), // 1000 requests per minute
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Apply rate limiting to an API endpoint
 */
export async function applyRateLimit(
  type: RateLimitType,
  identifier: string,
  _request: Request
): Promise<{ success: boolean; response?: Response }> {
  try {
    const rateLimiter = createRateLimiter({
      limiter: RATE_LIMITS[type],
      prefix: `zeke-api-${type}`,
    });

    const { success, limit, remaining, reset } =
      await rateLimiter.limit(identifier);

    if (!success) {
      // Log rate limit exceeded event
      logSecurityEvent('rate_limit_exceeded', {
        identifier,
        type,
        limit,
        reset,
      });

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Rate limit exceeded',
            limit,
            remaining: 0,
            reset,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }

    return { success: true };
  } catch (_error) {
    return { success: true };
  }
}

/**
 * Higher-order function to wrap API routes with rate limiting
 */
export function withRateLimit<T extends any[]>(
  type: RateLimitType,
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const request = args.find((arg) => arg instanceof Request) as Request;
    if (!request) {
      return handler(...args);
    }

    // Generate identifier from IP or user info
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const identifier = `ip:${ip}`;

    const rateLimitResult = await applyRateLimit(type, identifier, request);

    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    return handler(...args);
  };
}

/**
 * Combined auth and rate limiting wrapper
 */
export function withAuthAndRateLimit<T extends any[]>(
  authLevel: 'public' | 'authenticated' | 'admin',
  rateLimitType: RateLimitType,
  handler: (auth: AuthResult, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const request = args.find((arg) => arg instanceof Request) as Request;
    if (!request) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Import auth helper dynamically to avoid circular dependencies
    const { checkAuth, getRateLimitKey } = await import(
      '@/lib/auth/middleware-helpers'
    );

    // Check authentication first
    const auth = await checkAuth(authLevel);
    if (!auth.success && auth.response) {
      return auth.response;
    }

    // Apply rate limiting with user-specific or IP-based key
    const identifier = getRateLimitKey(auth, request);
    const rateLimitResult = await applyRateLimit(
      rateLimitType,
      identifier,
      request
    );

    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    return handler(auth, ...args);
  };
}
