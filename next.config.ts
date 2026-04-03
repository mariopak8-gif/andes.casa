import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler for maximum performance
  reactCompiler: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // Experimental features for speed
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: [
      '@clerk/nextjs',
      'lucide-react',
      'date-fns',
      'react-hot-toast',
      'sonner'
    ],
  },

  // Enable typed routes
  // typedRoutes: true,

  // Ensure Turbopack path is valid even when webpack config exists
  turbopack: {},

  // Bundle analysis
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        convex: {
          test: /[\\/]node_modules[\\/]convex[\\/]/,
          name: 'convex',
          chunks: 'all',
          priority: 20,
        },
        ui: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]|lucide-react/,
          name: 'ui',
          chunks: 'all',
          priority: 15,
        },
      };
    }

    // Add bundle analyzer when ANALYZE=true
    if (process.env.ANALYZE && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-analyzer-report.html',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Output optimization
  output: 'standalone',

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
