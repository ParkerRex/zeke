import { env } from '@/env';
import * as Sentry from '@sentry/nextjs';

export const initSentry = () => {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.VERCEL_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: env.VERCEL_ENV === 'production' ? 0.1 : 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;

      if (error instanceof Error) {
        // Skip network errors that are likely user-related
        if (
          error.message.includes('NetworkError') ||
          error.message.includes('Failed to fetch')
        ) {
          return null;
        }

        // Skip authentication errors (these are expected)
        if (
          error.message.includes('Authentication required') ||
          error.message.includes('Admin access required')
        ) {
          return null;
        }

        // Skip rate limit errors (these are expected)
        if (error.message.includes('Rate limit exceeded')) {
          return null;
        }
      }

      return event;
    },

    // Security and privacy
    beforeSendTransaction(event) {
      // Remove sensitive data from transactions
      if (event.request?.headers) {
        event.request.headers.authorization = undefined;
        event.request.headers.cookie = undefined;
        event.request.headers['stripe-signature'] = undefined;
      }

      return event;
    },

    // Integration configuration
    integrations: [
      new Sentry.BrowserTracing({
        // Capture interactions
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
    ],

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Debug mode for development
    debug: env.VERCEL_ENV === 'development',
  });
};

// Security event logging
export const logSecurityEvent = (
  event:
    | 'auth_failure'
    | 'rate_limit_exceeded'
    | 'admin_access_attempt'
    | 'suspicious_activity',
  details: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    category: 'security',
    message: `Security event: ${event}`,
    level: 'warning',
    data: {
      event,
      ...details,
      timestamp: new Date().toISOString(),
    },
  });

  // For critical security events, create an issue
  if (event === 'suspicious_activity' || event === 'admin_access_attempt') {
    Sentry.captureMessage(`Security Alert: ${event}`, {
      level: 'warning',
      tags: {
        security: true,
        event_type: event,
      },
      extra: details,
    });
  }
};

// API error logging with context
export const logApiError = (
  error: Error,
  context: {
    endpoint: string;
    method: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }
) => {
  Sentry.withScope((scope) => {
    scope.setTag('api_error', true);
    scope.setContext('api_request', {
      endpoint: context.endpoint,
      method: context.method,
      timestamp: new Date().toISOString(),
    });

    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context.ip) {
      scope.setTag('ip_address', context.ip);
    }

    if (context.userAgent) {
      scope.setTag('user_agent', context.userAgent);
    }

    Sentry.captureException(error);
  });
};

// Database error logging
export const logDatabaseError = (
  error: Error,
  context: {
    operation: string;
    table?: string;
    userId?: string;
  }
) => {
  Sentry.withScope((scope) => {
    scope.setTag('database_error', true);
    scope.setContext('database_operation', {
      operation: context.operation,
      table: context.table,
      timestamp: new Date().toISOString(),
    });

    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    Sentry.captureException(error);
  });
};

// Performance monitoring for critical operations
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  const transaction = Sentry.startTransaction({
    name: operation,
    op: 'function',
    data: context,
  });

  try {
    const result = await fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
};

// User feedback collection
export const collectUserFeedback = (
  _userId: string,
  feedback: {
    message: string;
    email?: string;
    name?: string;
  }
) => {
  Sentry.captureUserFeedback({
    event_id: Sentry.lastEventId(),
    name: feedback.name || 'Anonymous',
    email: feedback.email || 'unknown@example.com',
    comments: feedback.message,
  });
};

// Error boundary helper
export const createErrorBoundary = (fallback: React.ComponentType<any>) => {
  return Sentry.withErrorBoundary(fallback, {
    fallback: ({ error, resetError }) => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className=Something<"mb-4 text-2xl font-bold" went wrong</h2>
          <_p _className="mb-4 text-gray-600">
            We've been notified about this error and will fix it soon.
          </_p>
          <_button
            _onClick={resetError}
            _className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Try again
          </_button>
        </_div>
      </div>
    ),
    beforeCapture
  : (scope, error, errorInfo) => 
      scope.setTag('error_boundary', true)
  scope.setContext('error_info', errorInfo)
  ,
};
)
}
