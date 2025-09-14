import { applyRateLimit, withRateLimit } from '@/lib/rate-limit/api-rate-limit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the rate limit package
vi.mock('@zeke/rate-limit', () => ({
  createRateLimiter: vi.fn(),
  slidingWindow: vi.fn(),
}));

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applyRateLimit', () => {
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
      expect(mockRateLimiter.limit).toHaveBeenCalledWith('test-user');
    });

    it('should block requests exceeding rate limit', async () => {
      const { createRateLimiter } = await import('@zeke/rate-limit');
      const resetTime = Date.now() + 60000;
      const mockRateLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: false,
          limit: 100,
          remaining: 0,
          reset: resetTime,
        }),
      };

      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);

      const request = new Request('http://localhost/test');
      const result = await applyRateLimit('api', 'test-user', request);

      expect(result.success).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(429);

      const responseBody = await result.response?.json();
      expect(responseBody.error).toBe('Rate limit exceeded');
      expect(responseBody.limit).toBe(100);
      expect(responseBody.remaining).toBe(0);
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

  describe('withRateLimit wrapper', () => {
    it('should call handler when rate limit allows', async () => {
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

      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withRateLimit('api', mockHandler);

      const request = new Request('http://localhost/test');
      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(response).toBeInstanceOf(Response);
      expect(await response.text()).toBe('success');
    });

    it('should return rate limit response when limit exceeded', async () => {
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

      const mockHandler = vi.fn();
      const wrappedHandler = withRateLimit('api', mockHandler);

      const request = new Request('http://localhost/test');
      const response = await wrappedHandler(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(429);
    });

    it('should handle missing request gracefully', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withRateLimit('api', mockHandler);

      // Call without request object
      const _response = await wrappedHandler('not-a-request');

      expect(mockHandler).toHaveBeenCalledWith('not-a-request');
    });
  });

  describe('Rate limit configurations', () => {
    it('should use correct limits for different endpoint types', async () => {
      const { createRateLimiter } = await import('@zeke/rate-limit');
      const mockRateLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 50,
          remaining: 49,
          reset: Date.now() + 60000,
        }),
      };

      vi.mocked(createRateLimiter).mockReturnValue(mockRateLimiter as any);

      const request = new Request('http://localhost/test');
      await applyRateLimit('admin', 'test-user', request);

      expect(createRateLimiter).toHaveBeenCalledWith({
        limiter: expect.anything(), // The actual sliding window config
        prefix: 'zeke-api-admin',
      });
    });
  });
});
