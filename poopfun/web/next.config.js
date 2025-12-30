/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['*'], // Allow all domains for token images
  },
};

module.exports = nextConfig;