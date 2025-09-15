import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        'coverage/**',
        'dist/**',
        '.next/**',
      ],
    },
    server: {
      deps: {
        external: ['@sentry/nextjs'],
      },
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@zeke/analytics': resolve(__dirname, '../../packages/analytics'),
      '@zeke/analytics/keys': resolve(__dirname, '../../packages/analytics/keys.ts'),
      '@zeke/auth': resolve(__dirname, '../../packages/auth'),
      '@zeke/auth/keys': resolve(__dirname, '../../packages/auth/keys.ts'),
      '@zeke/cms': resolve(__dirname, '../../packages/cms'),
      '@zeke/email': resolve(__dirname, '../../packages/email'),
      '@zeke/email/keys': resolve(__dirname, '../../packages/email/keys.ts'),
      '@zeke/next-config': resolve(__dirname, '../../packages/next-config'),
      '@zeke/next-config/keys': resolve(__dirname, '../../packages/next-config/keys.ts'),
      '@zeke/observability': resolve(__dirname, '../../packages/observability'),
      '@zeke/observability/keys': resolve(__dirname, '../../packages/observability/keys.ts'),
      '@zeke/rate-limit': resolve(__dirname, '../../packages/rate-limit'),
      '@zeke/rate-limit/keys': resolve(__dirname, '../../packages/rate-limit/keys.ts'),
      '@zeke/security': resolve(__dirname, '../../packages/security'),
      '@zeke/security/keys': resolve(__dirname, '../../packages/security/keys.ts'),
      '@zeke/supabase': resolve(__dirname, '../../packages/supabase/src'),
      '@zeke/supabase/keys': resolve(__dirname, '../../packages/supabase/keys.ts'),
      '@zeke/supabase/queries': resolve(__dirname, '../../packages/supabase/src/queries'),
      '@zeke/supabase/types': resolve(__dirname, '../../packages/supabase/src/types'),
      '@zeke/design-system': resolve(__dirname, '../../packages/design-system'),
      '@sentry/nextjs': resolve(__dirname, './__mocks__/@sentry/nextjs.ts'),
      '@t3-oss/env-nextjs': resolve(__dirname, './__mocks__/@t3-oss/env-nextjs.ts'),
      '@/env': resolve(__dirname, './__mocks__/env.ts'),
    },
  },
});
