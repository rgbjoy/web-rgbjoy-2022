// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { resendAdapter } from '@payloadcms/email-resend'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'

// Globals
//-- Site Settings
import { Footer } from './globals/Footer'
//-- Content
import { Home } from './globals/Home'
import { Info } from './globals/Info'
import { Dev } from './globals/Dev'
import { Art } from './globals/Art'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Posts],
  globals: [Footer, Home, Info, Dev, Art],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true,
        [Media.slug]: {
          prefix: process.env.VERCEL_ENV === 'production'
            ? undefined
            : (process.env.VERCEL_ENV || 'development'),
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || '',
      },
    }),
  ],
  email: resendAdapter({
    defaultFromAddress: 'admin@rgbjoy.com',
    defaultFromName: 'Payload CMS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
})
