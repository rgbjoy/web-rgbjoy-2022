/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:  process.env.REMOTE_HOSTNAME,
      },
    ],
  },
}

module.exports = nextConfig
