'use client'

import { useRowLabel } from '@payloadcms/ui'

export default function RowLabel() {
  const { data, rowNumber} = useRowLabel<{ title?: string }>()
  // if data title is a child of a group, return the title
  const title = data.title || Object.values(data).find(val => val?.title)?.title || rowNumber
  return <div>{title || rowNumber}</div>
}