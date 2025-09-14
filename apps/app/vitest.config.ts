import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@zeke/analytics': resolve(__dirname, '../../packages/analytics'),
      '@zeke/auth': resolve(__dirname, '../../packages/auth'),
      '@zeke/cms': resolve(__dirname, '../../packages/cms'),
      '@zeke/email': resolve(__dirname, '../../packages/email'),
      '@zeke/next-config': resolve(__dirname, '../../packages/next-config'),
      '@zeke/observability': resolve(__dirname, '../../packages/observability'),
      '@zeke/rate-limit': resolve(__dirname, '../../packages/rate-limit'),
      '@zeke/security': resolve(__dirname, '../../packages/security'),
      '@zeke/supabase': resolve(__dirname, '../../packages/supabase/src'),
      '@zeke/supabase/keys': resolve(__dirname, '../../packages/supabase/keys.ts'),
      '@zeke/supabase/queries': resolve(__dirname, '../../packages/supabase/src/queries'),
      '@zeke/supabase/types': resolve(__dirname, '../../packages/supabase/src/types'),
      '@zeke/design-system': resolve(__dirname, '../../packages/design-system'),
      '@sentry/nextjs': resolve(__dirname, './__mocks__/@sentry/nextjs.ts'),
      '@t3-oss/env-nextjs': resolve(__dirname, './__mocks__/@t3-oss/env-nextjs.ts'),
    },
  },
});
