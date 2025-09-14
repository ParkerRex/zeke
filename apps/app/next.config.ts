import { env } from '@/env';
import { config, withAnalyzer } from '@zeke/next-config';
import { withLogging, withSentry } from '@zeke/observability/next-config';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = withLogging(config);

// Development-specific optimizations
if (process.env.NODE_ENV === 'development') {
  nextConfig = {
    ...nextConfig,
    // Disable source maps in development to reduce memory usage
    productionBrowserSourceMaps: false,
    // Optimize for faster builds
    swcMinify: false,
    // Reduce memory usage
    experimental: {
      ...nextConfig.experimental,
      // Disable memory-intensive features in development
      optimizeCss: false,
      // Reduce bundle analysis overhead
      bundlePagesRouterDependencies: false,
    },
  };
}

// Only enable Sentry in production or when explicitly requested
if (env.VERCEL && process.env.NODE_ENV === 'production') {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
