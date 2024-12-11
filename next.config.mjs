import { withPayload } from '@payloadcms/next/withPayload'
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  expireTime: 3600,
  experimental: {
    reactCompiler: false,
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
  sassOptions: {
    compilerOptions: {
      quietDeps: true,
    },
    silenceDeprecations: ['legacy-js-api', 'import'],
  },
}

export default withPayload(nextConfig)
