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
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    prependData: `@import "./styles/variables.scss";`
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.pdf$/,
      use: {
        loader: 'file-loader',
      },
    });

    return config;
  },
}

module.exports = nextConfig
