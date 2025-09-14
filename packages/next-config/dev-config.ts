import type { NextConfig } from 'next';

/**
 * Development-specific Next.js configuration optimizations
 * Philosophy: If it's not essential for coding, disable it in dev
 * Prioritizes: Speed > Features, Memory > Optimization, Simple > Complex
 */
export const getDevConfig = (): Partial<NextConfig> => {
  // Only apply in development
  if (process.env.NODE_ENV !== 'development') {
    return {};
  }

  return {
    // AGGRESSIVE: Disable everything that slows down development

    // No source maps - use browser devtools instead
    productionBrowserSourceMaps: false,

    // No minification - we want readable code anyway
    swcMinify: false,

    // No image optimization - just serve images as-is
    images: {
      unoptimized: true,
    },

    // No TypeScript checking during build - let your editor handle it
    typescript: {
      ignoreBuildErrors: true,
    },

    // No ESLint during build - run it separately
    eslint: {
      ignoreDuringBuilds: true,
    },
    
    // Experimental optimizations for development
    experimental: {
      // Optimize package imports to reduce bundle size
      optimizePackageImports: [
        'lucide-react',
        '@remixicon/react',
        'react-icons',
        'date-fns',
      ],
      
      // Disable memory-intensive features in development
      optimizeCss: false,
      bundlePagesRouterDependencies: false,
      
      // Reduce memory usage with smaller chunks
      webpackBuildWorker: false,
    },
    
    // Webpack optimizations for development
    webpack: (config, { dev, isServer }) => {
      if (dev) {
        // Reduce memory usage by limiting parallel processing
        config.parallelism = 1;
        
        // Optimize chunk splitting for development
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 244000,
            cacheGroups: {
              default: false,
              vendors: false,
              // Create smaller, more manageable chunks
              framework: {
                chunks: 'all',
                name: 'framework',
                test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
                priority: 40,
                enforce: true,
              },
              lib: {
                test: /[\\/]node_modules[\\/]/,
                name: 'lib',
                priority: 30,
                chunks: 'all',
              },
            },
          },
        };
        
        // Reduce memory usage in development
        config.cache = {
          type: 'memory',
          maxGenerations: 1,
        };
        
        // Disable unnecessary plugins in development
        if (!isServer) {
          config.resolve.alias = {
            ...config.resolve.alias,
            // Reduce bundle size by aliasing heavy libraries
            '@sentry/nextjs': process.env.DISABLE_SENTRY === 'true' ? false : '@sentry/nextjs',
          };
        }
      }
      
      return config;
    },
    
    // Reduce logging in development
    logging: {
      fetches: {
        fullUrl: false,
      },
    },
    
    // Disable analytics and tracking in development
    ...(process.env.DISABLE_ANALYTICS === 'true' && {
      experimental: {
        instrumentationHook: false,
      },
    }),
  };
};

/**
 * Check if development optimizations should be applied
 */
export const shouldOptimizeForDev = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_REDUCE_MEMORY === 'true'
  );
};

/**
 * Get memory optimization flags for Node.js
 */
export const getNodeMemoryFlags = (): string[] => {
  if (!shouldOptimizeForDev()) {
    return [];
  }
  
  return [
    '--max-old-space-size=4096',
    '--max-semi-space-size=128',
    '--gc-interval=100',
  ];
};
