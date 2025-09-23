/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/casapp',
  experimental: {
    typedRoutes: true
  }
};

module.exports = nextConfig;
