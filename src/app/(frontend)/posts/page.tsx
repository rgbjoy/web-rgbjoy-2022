import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Metadata } from 'next'
import Posts from './posts.client'

export const metadata: Metadata = {
  title: 'Posts',
  description: 'Multidisciplinary digital creator & software engineer',
}

export default async function Page() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    where: {
      _status: { equals: 'published' },
    },
  })

  return <Posts posts={docs} />
}
