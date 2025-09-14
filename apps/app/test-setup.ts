import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(
      public url: string,
      public init?: RequestInit
    ) {}
    get headers() {
      return new Headers(this.init?.headers);
    }
    get method() {
      return this.init?.method || 'GET';
    }
    json() {
      return Promise.resolve(JSON.parse((this.init?.body as string) || '{}'));
    }
    text() {
      return Promise.resolve((this.init?.body as string) || '');
    }
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    },
    next: (init?: ResponseInit) => new Response(null, init),
    redirect: (url: string, init?: ResponseInit) =>
      new Response(null, { ...init, status: 302, headers: { Location: url } }),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';

// Global test utilities
global.fetch = vi.fn();

// Setup console mocking for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Test utilities are available globally through vitest
