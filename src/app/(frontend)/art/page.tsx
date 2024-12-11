import ArtClient from './art.client'
import { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'

export const metadata: Metadata = {
  title: 'Art & Design',
  description: 'Multidisciplinary digital creator & software engineer',
}

export default async function Page() {
  const artData = await getCachedGlobal('art', 1)()

  return <ArtClient {...artData} />
}
