import type { NextConfig } from 'next';

/**
 * AGGRESSIVE development configuration
 * Philosophy: "Fuck it, ship fast" - disable everything that's not essential
 * 
 * Use this when you want maximum development speed and don't care about
 * production-like behavior. Perfect for rapid prototyping and debugging.
 */
export const getAggressiveDevConfig = (): Partial<NextConfig> => {
  if (process.env.NODE_ENV !== 'development') {
    return {};
  }

  return {
    // SPEED OVER EVERYTHING
    
    // No source maps at all
    productionBrowserSourceMaps: false,
    
    // No minification
    swcMinify: false,
    
    // No image optimization - just serve files
    images: {
      unoptimized: true,
      dangerouslyAllowSVG: true, // YOLO
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    
    // Skip type checking - let your editor handle it
    typescript: {
      ignoreBuildErrors: true,
    },
    
    // Skip linting - run it separately when you want
    eslint: {
      ignoreDuringBuilds: true,
    },
    
    // Minimal experimental features
    experimental: {
      // Only enable what actually helps development
      optimizePackageImports: ['lucide-react'], // Just the heavy ones
      
      // Disable everything else
      optimizeCss: false,
      bundlePagesRouterDependencies: false,
      webpackBuildWorker: false,
      turbo: {
        // Minimal turbopack config
        memoryLimit: 1024, // 1GB max
      },
    },
    
    // Minimal webpack config
    webpack: (config, { dev, isServer }) => {
      if (!dev) return config;
      
      // AGGRESSIVE: Disable most optimizations
      config.optimization = {
        ...config.optimization,
        minimize: false,
        splitChunks: false, // No chunking in dev
        removeAvailableModules: false,
        removeEmptyChunks: false,
        mergeDuplicateChunks: false,
      };
      
      // Minimal caching
      config.cache = false;
      
      // No parallel processing
      config.parallelism = 1;
      
      // Ignore warnings that don't matter in dev
      config.ignoreWarnings = [
        /Module not found/,
        /Critical dependency/,
        /@opentelemetry/,
        /node_modules/,
      ];
      
      // Disable source maps completely
      config.devtool = false;
      
      return config;
    },
    
    // Minimal redirects/rewrites
    async redirects() {
      return []; // No redirects in dev
    },
    
    async rewrites() {
      return []; // No rewrites in dev (except essential ones)
    },
    
    // Disable trailing slash handling
    trailingSlash: false,
    skipTrailingSlashRedirect: true,
    
    // Minimal logging
    logging: {
      fetches: {
        fullUrl: false,
      },
    },
    
    // No compression
    compress: false,
    
    // Minimal headers
    async headers() {
      return [];
    },
  };
};

/**
 * Check if aggressive mode should be enabled
 */
export const shouldUseAggressiveMode = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' &&
    (process.env.DEV_MODE === 'aggressive' || process.env.FAST_DEV === 'true')
  );
};

/**
 * Environment variables for aggressive mode
 */
export const getAggressiveEnvVars = (): Record<string, string> => {
  if (!shouldUseAggressiveMode()) {
    return {};
  }
  
  return {
    // Disable all the things
    DISABLE_SENTRY: 'true',
    DISABLE_ARCJET: 'true',
    DISABLE_LOGTAIL: 'true',
    DISABLE_ANALYTICS: 'true',
    DISABLE_POSTHOG: 'true',
    DISABLE_STRIPE_WEBHOOKS: 'true',
    DISABLE_EMAIL_SENDING: 'true',
    DISABLE_PERFORMANCE_MONITORING: 'true',
    
    // Minimal logging
    LOG_LEVEL: 'error',
    DEBUG: 'false',
    
    // Fast builds
    NEXT_DISABLE_SOURCEMAPS: 'true',
    NEXT_DISABLE_SWC_MINIFY: 'true',
    NEXT_SKIP_TYPE_CHECK: 'true',
    NEXT_SKIP_LINT: 'true',
    
    // Memory limits
    NODE_OPTIONS: '--max-old-space-size=2048 --max-semi-space-size=64',
    TURBOPACK_MEMORY_LIMIT: '1024',
  };
};
