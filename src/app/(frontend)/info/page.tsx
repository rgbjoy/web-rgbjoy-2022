import InfoClient from './info.client'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const metadata: Metadata = {
  title: 'Info',
  description: 'Multidisciplinary digital creator & software engineer',
}

export default async function Page() {
  const payload = await getPayload({
    config: configPromise,
  })

  const infoData = await payload.findGlobal({
    slug: 'info',
  })

  return <InfoClient {...infoData} />
}
