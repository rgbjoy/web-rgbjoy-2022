/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    prependData: `@import "./src/styles/variables.scss";`
  },
  webpack(config, options) {
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