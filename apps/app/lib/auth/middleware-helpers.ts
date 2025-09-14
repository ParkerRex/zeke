import { createSupabaseServerClient } from '@zeke/auth';
import { getAdminFlag } from '@zeke/supabase/queries';
import { NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/monitoring/sentry-config';

export type AuthLevel = 'public' | 'authenticated' | 'admin';

export interface AuthResult {
  success: boolean;
  userId?: string;
  isAdmin?: boolean;
  error?: string;
  response?: Response;
}

/**
 * Middleware helper to check authentication level for API routes
 */
export async function checkAuth(level: AuthLevel): Promise<AuthResult> {
  try {
    if (level === 'public') {
      return { success: true };
    }

    const supabase = await createSupabaseServerClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    const userId = session?.user?.id;

    if (!userId) {
      logSecurityEvent('auth_failure', {
        level: level,
        reason: 'No user session found',
      });

      return {
        success: false,
        error: 'Authentication required',
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    if (level === 'authenticated') {
      return { success: true, userId };
    }

    if (level === 'admin') {
      const { isAdmin } = await getAdminFlag();
      if (!isAdmin) {
        logSecurityEvent('admin_access_attempt', {
          userId: userId,
          reason: 'Non-admin user attempted admin access',
        });

        return {
          success: false,
          error: 'Admin access required',
          response: NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          ),
        };
      }
      return { success: true, userId, isAdmin: true };
    }

    return { success: false, error: 'Invalid auth level' };
  } catch (_error) {
    return {
      success: false,
      error: 'Authentication check failed',
      response: NextResponse.json(
        { error: 'Authentication check failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function withAuth<T extends any[]>(
  level: AuthLevel,
  handler: (auth: AuthResult, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const auth = await checkAuth(level);
    if (!auth.success && auth.response) {
      return auth.response;
    }
    return handler(auth, ...args);
  };
}

/**
 * Rate limiting helper using user ID or IP
 */
export function getRateLimitKey(auth: AuthResult, request: Request): string {
  if (auth.userId) {
    return `user:${auth.userId}`;
  }

  // Fallback to IP for unauthenticated requests
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}
