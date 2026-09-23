/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/api/graphql',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
