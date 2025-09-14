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
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@zeke/auth': resolve(__dirname, '../../packages/auth'),
      '@zeke/supabase': resolve(__dirname, '../../packages/supabase'),
      '@zeke/rate-limit': resolve(__dirname, '../../packages/rate-limit'),
      '@zeke/design-system': resolve(__dirname, '../../packages/design-system'),
      '@zeke/observability': resolve(__dirname, '../../packages/observability'),
      '@zeke/security': resolve(__dirname, '../../packages/security'),
    },
  },
});
