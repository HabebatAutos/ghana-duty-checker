/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'cediduty.com' }],
        destination: 'https://www.cediduty.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig