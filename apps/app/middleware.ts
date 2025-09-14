import { env } from '@/env';
import { logSecurityEvent } from '@/lib/monitoring/sentry-config';
import { updateSession } from '@zeke/auth/middleware';
import { parseError } from '@zeke/observability/error';
import { secure } from '@zeke/security';
import {
  noseconeMiddleware,
  noseconeOptions,
  noseconeOptionsWithToolbar,
} from '@zeke/security/middleware';
import {
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (Stripe webhooks need raw body)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

const securityHeaders = env.ARCJET_KEY
  ? noseconeMiddleware(noseconeOptionsWithToolbar)
  : noseconeMiddleware(noseconeOptions);

const middleware: NextMiddleware = async (request: NextRequest) => {
  // First, update the session
  const sessionResponse = await updateSession(request);

  // Skip Arcjet for webhook endpoints that need raw body
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    return securityHeaders();
  }

  // Skip Arcjet processing in development to reduce memory overhead
  if (process.env.NODE_ENV === 'development') {
    return securityHeaders();
  }

  if (!env.ARCJET_KEY) {
    return securityHeaders();
  }

  try {
    // Different bot policies for different routes
    const allowedBots = request.nextUrl.pathname.startsWith('/api/')
      ? [] // Strict for API routes
      : [
          'CATEGORY:SEARCH_ENGINE', // Allow search engines for pages
          'CATEGORY:PREVIEW', // Allow preview links
          'CATEGORY:MONITOR', // Allow uptime monitoring
        ];

    await secure(allowedBots as any, request);
    return securityHeaders();
  } catch (error) {
    const message = parseError(error);

    // Log security event
    logSecurityEvent('suspicious_activity', {
      path: request.nextUrl.pathname,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      reason: message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ error: message }, { status: 403 });
  }
};

export default middleware;
