import { GET } from '@/app/api/stories/route';
import type { EmbedKind, Overlays } from '@zeke/supabase/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@zeke/supabase/queries', () => ({
  listStories: vi.fn(),
}));

vi.mock('@zeke/auth', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@zeke/rate-limit', () => ({
  createRateLimiter: vi.fn(),
  slidingWindow: vi.fn(),
}));

describe('/api/stories Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Middleware', () => {
    it('should have proper authentication checking logic', async () => {
      const { checkAuth } = await import('@/lib/auth/middleware-helpers');

      // Mock Supabase to return no session
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
    });

    it('should allow authenticated requests', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const { listStories } = await import('@zeke/supabase/queries');
      const { createRateLimiter } = await import('@zeke/rate-limit');

      // Mock authentication
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

      // Mock rate limiting
      const mockRateLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 200,
          remaining: 199,
          reset: Date.now() + 60000,
        }),
      };
      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);

      // Mock stories data with proper types
      const mockOverlays: Overlays = {
        whyItMatters: 'This is a test story for integration testing',
        chili: 3,
        confidence: 85,
        sources: [
          {
            title: 'Test Source',
            url: 'https://example.com/source',
            domain: 'example.com',
          },
        ],
      };

      const mockStoriesResult = {
        stories: [
          {
            id: 'story-1',
            title: 'Test Story',
            primaryUrl: 'https://example.com',
            embedKind: 'article' as EmbedKind,
            embedUrl: 'https://example.com',
            overlays: mockOverlays,
          },
        ],
        totalCount: 1,
        hasMore: false,
      };
      vi.mocked(listStories).mockResolvedValue(mockStoriesResult);

      const request = new Request('http://localhost/api/stories');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.stories).toHaveLength(1);
      expect(body.pagination).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should block requests when rate limit exceeded', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const { createRateLimiter } = await import('@zeke/rate-limit');

      // Mock authentication
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

      // Mock rate limiting - exceeded
      const mockRateLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: false,
          limit: 200,
          remaining: 0,
          reset: Date.now() + 60000,
        }),
      };
      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);

      const request = new Request('http://localhost/api/stories');
      const response = await GET(request);

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toBe('Rate limit exceeded');
    });
  });

  describe('Query Parameter Validation', () => {
    beforeEach(async () => {
      // Setup successful auth and rate limiting for these tests
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const { createRateLimiter } = await import('@zeke/rate-limit');

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

      const mockRateLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 200,
          remaining: 199,
          reset: Date.now() + 60000,
        }),
      };
      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);
    });

    it('should validate and apply query parameters', async () => {
      const { listStories } = await import('@zeke/supabase/queries');

      const mockStoriesResult = {
        stories: [],
        totalCount: 0,
        hasMore: false,
      };
      vi.mocked(listStories).mockResolvedValue(mockStoriesResult);

      const request = new Request(
        'http://localhost/api/stories?limit=10&kind=youtube&q=test'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(listStories).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        kind: 'youtube',
        search: 'test',
        userId: 'user-123',
      });
    });

    it('should reject invalid query parameters', async () => {
      const request = new Request(
        'http://localhost/api/stories?limit=1000&kind=invalid'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid query parameters');
    });

    it('should apply default values for missing parameters', async () => {
      const { listStories } = await import('@zeke/supabase/queries');

      const mockStoriesResult = {
        stories: [],
        totalCount: 0,
        hasMore: false,
      };
      vi.mocked(listStories).mockResolvedValue(mockStoriesResult);

      const request = new Request('http://localhost/api/stories');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(listStories).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        kind: 'all',
        search: undefined,
        userId: 'user-123',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { createSupabaseServerClient } = await import('@zeke/auth');
      const { listStories } = await import('@zeke/supabase/queries');
      const { createRateLimiter } = await import('@zeke/rate-limit');

      // Mock authentication
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

      // Mock rate limiting
      const mockRateLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 200,
          remaining: 199,
          reset: Date.now() + 60000,
        }),
      };
      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);

      // Mock database error
      vi.mocked(listStories).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new Request('http://localhost/api/stories');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to fetch stories');
    });
  });
});
