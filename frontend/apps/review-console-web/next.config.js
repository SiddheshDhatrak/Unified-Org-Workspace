/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/types', '@workspace/api-client', '@workspace/hooks', '@workspace/ui-kit'],
};

module.exports = nextConfig;
