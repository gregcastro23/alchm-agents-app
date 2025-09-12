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
  
  // Transpile packages that need special handling
  transpilePackages: [
    'form-data-encoder',
    'formdata-node',
    'galileo',
    'openai',
    'react-remove-scroll-bar'
  ],
  
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

  // Modern Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    resolveAlias: {
      // Fix react-remove-scroll module resolution issue
      'react-remove-scroll-bar/constants': 'react-remove-scroll-bar/dist/es2015/constants',
    },
    // Configure module resolution for problematic packages
    resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  
  // Minimal webpack config for when Turbopack is not used (production builds)
  webpack: (config, { dev, isServer }) => {
    // Only apply webpack config when not using turbopack
    if (process.env.TURBOPACK) {
      return config;
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
      };
    }

    // Fix react-remove-scroll module resolution issue
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-remove-scroll-bar/constants': 'react-remove-scroll-bar/dist/es2015/constants',
    };

    return config;
  },
}

export default nextConfig
