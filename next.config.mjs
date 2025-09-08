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
  // Enhanced webpack configuration for better module resolution
  webpack: (config, { dev, isServer }) => {
    // Improved module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Better error handling in development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*'],
  },
}

export default nextConfig
