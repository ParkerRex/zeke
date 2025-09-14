import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkAuth, withAuth } from '@/lib/auth/middleware-helpers';
import { applyRateLimit } from '@/lib/rate-limit/api-rate-limit';
import { validateBody, createSourceSchema } from '@/lib/validation/api-schemas';

// Mock dependencies
vi.mock('@zeke/auth', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@zeke/supabase/queries', () => ({
  getAdminFlag: vi.fn(),
}));

vi.mock('@zeke/rate-limit', () => ({
  createRateLimiter: vi.fn(),
  slidingWindow: vi.fn(),
}));

describe('Security Middleware Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should properly authenticate valid users', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { 
              session: { 
                user: { id: 'user-123' } 
              } 
            },
          }),
        },
      };
      
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const result = await checkAuth('authenticated');

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should reject unauthenticated users', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      };
      
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const result = await checkAuth('authenticated');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should handle admin authentication', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const { getAdminFlag } = await import('@zeke/supabase/queries');
      
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { 
              session: { 
                user: { id: 'admin-123' } 
              } 
            },
          }),
        },
      };
      
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(getAdminFlag).mockResolvedValue({ isAdmin: true, userId: 'admin-123' });

      const result = await checkAuth('admin');

      expect(result.success).toBe(true);
      expect(result.userId).toBe('admin-123');
      expect(result.isAdmin).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const { createRateLimiter } = await import('@zeke/rate-limit');
      const mockRateLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 60000,
        }),
      };
      
      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);

      const request = new Request('http://localhost/test');
      const result = await applyRateLimit('api', 'test-user', request);

      expect(result.success).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should block requests exceeding rate limit', async () => {
      const { createRateLimiter } = await import('@zeke/rate-limit');
      const mockRateLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: false,
          limit: 100,
          remaining: 0,
          reset: Date.now() + 60000,
        }),
      };
      
      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);

      const request = new Request('http://localhost/test');
      const result = await applyRateLimit('api', 'test-user', request);

      expect(result.success).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response!.status).toBe(429);
    });
  });

  describe('Input Validation', () => {
    it('should validate correct source data', () => {
      const validSource = {
        kind: 'rss',
        name: 'Test RSS Feed',
        url: 'https://example.com/feed.xml',
        domain: 'example.com',
        active: true,
      };

      const result = validateBody(createSourceSchema, validSource);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining(validSource));
    });

    it('should reject invalid source data', () => {
      const invalidSource = {
        kind: 'invalid-kind',
        name: 'Test Feed',
      };

      const result = validateBody(createSourceSchema, invalidSource);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Middleware Integration', () => {
    it('should properly chain authentication and validation', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { 
              session: { 
                user: { id: 'user-123' } 
              } 
            },
          }),
        },
      };
      
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

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

    it('should handle authentication failures gracefully', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      };
      
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const mockHandler = vi.fn();
      const wrappedHandler = withAuth('authenticated', mockHandler);

      const response = await wrappedHandler();
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      
      vi.mocked(createSupabaseServerClient).mockRejectedValue(new Error('Database connection failed'));

      const result = await checkAuth('authenticated');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication check failed');
    });

    it('should handle rate limiter errors gracefully', async () => {
      const { createRateLimiter } = await import('@zeke/rate-limit');
      const mockRateLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
      };
      
      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);

      const request = new Request('http://localhost/test');
      const result = await applyRateLimit('api', 'test-user', request);

      // Should allow request when rate limiting fails
      expect(result.success).toBe(true);
      expect(result.response).toBeUndefined();
    });
  });
});
