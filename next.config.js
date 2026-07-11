/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Disable static page generation to avoid memory issues
  output: 'standalone',
};

module.exports = nextConfig;
