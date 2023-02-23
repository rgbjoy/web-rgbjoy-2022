/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  env: {
    REVALIDATION_TOKEN: process.env.REVALIDATION_TOKEN
  },
  experimental: {
    typedRoutes: true,
  },
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
    prependData: `@import "./src/styles/variables.scss";`
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: {
        loader: "file-loader",
      },
    });

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