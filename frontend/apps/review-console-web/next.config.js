/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/types', '@workspace/api-client', '@workspace/hooks', '@workspace/ui-kit'],
  async rewrites() {
    let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    if (apiBaseUrl.endsWith('/')) apiBaseUrl = apiBaseUrl.slice(0, -1);
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBaseUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
