/** @type {import('next').NextConfig} */

const nextConfig = {
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
