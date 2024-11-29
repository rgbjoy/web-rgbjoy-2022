'use client'

import { useRowLabel } from '@payloadcms/ui'

interface DataType {
  title?: string
  [key: string]: { title?: string } | string | undefined
}

export default function RowLabel() {
  const { data, rowNumber } = useRowLabel<DataType>()
  const title = data.title || Object.values(data).find((val): val is { title: string } =>
    typeof val === 'object' && val !== null && 'title' in val
  )?.title || rowNumber
  return <div>{title || rowNumber}</div>
}