'use client'

import React from 'react'
import { Button, useDocumentInfo } from '@payloadcms/ui'
import { getServerSideURL } from '@/utilities/getURL'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'

const PreviewButton: React.FC = () => {
  const { savedDocumentData } = useDocumentInfo()

  if (!savedDocumentData?.slug) return null

  if (savedDocumentData._status !== 'published') return null

  const path = generatePreviewPath({
    slug: typeof savedDocumentData?.slug === 'string' ? savedDocumentData?.slug : '',
    collection: 'posts',
  })

  return (
    <a target="_blank" href={`${getServerSideURL()}/${path}`}>
      <Button>
      View Post
    </Button></a>
  )
}

export default PreviewButton