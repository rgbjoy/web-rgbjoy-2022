'use client'

import { useRowLabel } from '@payloadcms/ui'

export default function RowLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string }>()

  return <div>{data.title || 'Slide'}</div>
}