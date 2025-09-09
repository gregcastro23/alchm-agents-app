/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix workspace root detection
  outputFileTracingRoot: '/Users/GregCastro/Desktop/planetary-agents',
  // Enhanced webpack configuration for better module resolution
  webpack: (config, { dev, isServer }) => {
    // Improved module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Fix react-remove-scroll module resolution issue
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-remove-scroll-bar/constants': 'react-remove-scroll-bar/dist/es2015/constants',
    };

    // Better error handling in development
    if (dev) {
      // Optimize watch options for better performance
      config.watchOptions = {
        poll: 3000, // Less aggressive polling
        aggregateTimeout: 1000, // Longer debounce
        ignored: [
          '**/node_modules',
          '**/.next',
          '**/.git',
          '**/coverage',
          '**/*.log'
        ],
      };

      // Enable webpack optimizations for dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };

      // Add cache configuration for better rebuild performance
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [import.meta.url],
        },
      };
    }

    return config;
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-*',
      'recharts',
      'react-hook-form'
    ],
    // Enable faster refresh
    swcPlugins: [],
  },
  // Optimize dev server
  fastRefresh: true,
  // Reduce bundle analysis overhead
  webpackDevMiddleware: {
    stats: {
      preset: 'minimal',
      moduleTrace: false,
      errorDetails: false,
    },
  },
}

export default nextConfig
