// Conditionally import bundle analyzer only when needed
const bundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? (await import('@next/bundle-analyzer')).default({
        enabled: true,
      })
    : (config) => config

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
  // Explicitly set workspace root to avoid lockfile detection issues
  outputFileTracingRoot: process.env.DOCKER_BUILD
    ? undefined
    : '/Users/GregCastro/Desktop/planetary-agents',

  // Docker optimization - standalone output (only for production builds)
  ...(process.env.NODE_ENV === 'production' && process.env.DOCKER_BUILD
    ? {
        output: 'standalone',
      }
    : {}),

  // Transpile packages that need special handling
  transpilePackages: [
    'form-data-encoder',
    'formdata-node',
    'galileo',
    'openai',
    'react-remove-scroll-bar',
  ],

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-*',
      'recharts',
      'react-hook-form',
      'd3',
      '@ai-sdk/openai',
    ],
    // Enable faster refresh
    swcPlugins: [],
  },

  // Code splitting optimization
  webpack: (config, { dev, isServer }) => {
    // Only apply webpack config when not using turbopack
    if (process.env.TURBOPACK) {
      return config
    }

    // Basic fallbacks for browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
      }
    }

    // Fix react-remove-scroll module resolution issue
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-remove-scroll-bar/constants': 'react-remove-scroll-bar/dist/es2015/constants',
    }

    // Code splitting for large libraries
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,

        // Separate chunk for heavy AI/ML libraries
        ai: {
          test: /[\\/]node_modules[\\/](@ai-sdk|@anthropic-ai|openai|galileo)[\\/]/,
          name: 'ai-vendors',
          chunks: 'all',
          priority: 10,
        },

        // Separate chunk for chart libraries
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3|victory)[\\/]/,
          name: 'chart-vendors',
          chunks: 'all',
          priority: 10,
        },

        // Separate chunk for UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|tailwindcss)[\\/]/,
          name: 'ui-vendors',
          chunks: 'all',
          priority: 5,
        },

        // Separate chunk for large utility libraries
        utils: {
          test: /[\\/]node_modules[\\/](date-fns|suncalc|@prisma)[\\/]/,
          name: 'utils-vendors',
          chunks: 'all',
          priority: 5,
        },
      }
    }

    return config
  },

  // Modern Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    resolveAlias: {
      // Fix react-remove-scroll module resolution issue
      'react-remove-scroll-bar/constants': 'react-remove-scroll-bar/dist/es2015/constants',
    },
    // Configure module resolution for problematic packages
    resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
}

export default bundleAnalyzer(nextConfig)
