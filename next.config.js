/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // Reduce memory usage during build
    workerThreads: false,
    cpus: 1,
  },
  // Disable static page generation to avoid memory issues during build
  output: 'standalone',
  // Disable image optimization to reduce build load
  images: {
    unoptimized: true,
  },
  // Reduce webpack memory usage
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      minimize: false, // Disable minification to save memory
    };
    return config;
  },
};

module.exports = nextConfig;
