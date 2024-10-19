/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      rules: {
        '*.module.scss': {
          loaders: ['sass-loader'],
          as: '*.module.css',
        },
        '*.scss': {
          loaders: ['sass-loader'],
          as: '*.css',
        },
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.REMOTE_HOSTNAME,
      },
    ],
  },
}

module.exports = nextConfig
