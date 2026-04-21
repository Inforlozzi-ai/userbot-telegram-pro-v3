/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://api:3001'}/api/:path*`,
      },
      {
        source: '/webhooks/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://api:3001'}/webhooks/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
