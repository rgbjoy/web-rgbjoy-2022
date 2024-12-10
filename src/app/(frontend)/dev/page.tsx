import DevClient from './dev.client'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const metadata: Metadata = {
  title: 'Development',
  description: 'Multidisciplinary digital creator & software engineer',
}

export default async function Page() {
  const payload = await getPayload({
    config: configPromise,
  })

  const devData = await payload.findGlobal({
    slug: 'dev',
  })

  return <DevClient {...devData} />
}
