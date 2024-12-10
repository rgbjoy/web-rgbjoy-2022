import ArtClient from './art.client'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const metadata: Metadata = {
  title: 'Art & Design',
  description: 'Multidisciplinary digital creator & software engineer',
}

export default async function Page() {
  const payload = await getPayload({
    config: configPromise,
  })

  const artData = await payload.findGlobal({
    slug: 'art',
  })

  return <ArtClient {...artData} />
}
