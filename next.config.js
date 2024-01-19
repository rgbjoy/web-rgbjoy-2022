/** @type {import('next').NextConfig} */
const path = require('path');

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
