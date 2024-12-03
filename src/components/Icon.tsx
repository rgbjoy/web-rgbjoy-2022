import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Image from "next/image"
import Link from 'next/link'

export const Icon = async () => {
  const payload = await getPayload({ config: configPromise })
  return (
    <Image
      src="/logo.svg"
      width={40}
      height={40}
      alt="Visit Site"
    />
  )
}

export default Icon