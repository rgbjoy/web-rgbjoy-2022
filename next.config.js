/** @type {import('next').NextConfig} */
const path = require('path');
const generateRobotsTxt = require("./scripts/generate-robots-txt");
const generateSitemap = require("./scripts/generate-sitemap");

const nextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    prependData: `@import "./src/styles/variables.scss";`
  },
  webpack(config, {isServer}) {
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

    if (isServer) {
      generateSitemap();
      generateRobotsTxt();
    }

    return config;
  },
}

module.exports = nextConfig