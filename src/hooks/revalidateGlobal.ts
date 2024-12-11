import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req }) => {
  const urlPart = req.url?.split('globals/')[1].split('?')[0] || ''
  console.log('Extracted URL Part:', urlPart)

  revalidateTag(`global_${urlPart}`)
  return doc
}
