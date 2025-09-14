import { checkAuth, withAuth } from '@/lib/auth/middleware-helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase auth
vi.mock('@zeke/auth', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@zeke/supabase/queries', () => ({
  getAdminFlag: vi.fn(),
}));

describe('Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkAuth', () => {
    it('should allow public access', async () => {
      const result = await checkAuth('public');
      expect(result.success).toBe(true);
    });

    it('should reject unauthenticated requests for authenticated routes', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      };

      vi.mocked(createSupabaseServerClient).mockResolvedValue(
        mockSupabase as any
      );

      const result = await checkAuth('authenticated');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(result.response).toBeDefined();
    });

    it('should allow authenticated users', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'user-123' },
              },
            },
          }),
        },
      };

      vi.mocked(createSupabaseServerClient).mockResolvedValue(
        mockSupabase as any
      );

      const result = await checkAuth('authenticated');
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should reject non-admin users for admin routes', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const { getAdminFlag } = await import('@zeke/supabase/queries');

      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'user-123' },
              },
            },
          }),
        },
      };

      vi.mocked(createSupabaseServerClient).mockResolvedValue(
        mockSupabase as any
      );
      vi.mocked(getAdminFlag).mockResolvedValue({
        isAdmin: false,
        userId: 'user-123',
      });

      const result = await checkAuth('admin');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin access required');
    });

    it('should allow admin users for admin routes', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const { getAdminFlag } = await import('@zeke/supabase/queries');

      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'admin-123' },
              },
            },
          }),
        },
      };

      vi.mocked(createSupabaseServerClient).mockResolvedValue(
        mockSupabase as any
      );
      vi.mocked(getAdminFlag).mockResolvedValue({
        isAdmin: true,
        userId: 'admin-123',
      });

      const result = await checkAuth('admin');
      expect(result.success).toBe(true);
      expect(result.userId).toBe('admin-123');
      expect(result.isAdmin).toBe(true);
    });
  });

  describe('withAuth wrapper', () => {
    it('should call handler with auth result for successful auth', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'user-123' },
              },
            },
          }),
        },
      };

      vi.mocked(createSupabaseServerClient).mockResolvedValue(
        mockSupabase as any
      );

      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withAuth('authenticated', mockHandler);

      const response = await wrappedHandler('test-arg');

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          userId: 'user-123',
        }),
        'test-arg'
      );
      expect(response).toBeInstanceOf(Response);
    });

    it('should return auth error response for failed auth', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      };

      vi.mocked(createSupabaseServerClient).mockResolvedValue(
        mockSupabase as any
      );

      const mockHandler = vi.fn();
      const wrappedHandler = withAuth('authenticated', mockHandler);

      const response = await wrappedHandler();

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });
  });
});
