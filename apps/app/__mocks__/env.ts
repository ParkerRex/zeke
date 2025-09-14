// Mock for env.ts
export const env = {
  // Mock environment variables for testing
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_WEB_URL: 'http://localhost:3001',
  NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
  UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
  RESEND_TOKEN: 'test-resend-token',
  ARCJET_KEY: 'test-arcjet-key',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54322/postgres',
  WORKER_DB_PASSWORD: 'test-worker-password',
};
