import type { GlobalAfterChangeHook } from 'payload'
import { revalidateTag } from 'next/cache'

export const revalidateGlobal: GlobalAfterChangeHook = ({
  doc,
  req: { payload, url },
}) => {
  const globalSlug = url?.split('/globals/')?.[1]?.split('?')?.[0] || doc.globalType || ''
  payload.logger.info(`Revalidating global: ${globalSlug}`)

  revalidateTag(globalSlug)

  return doc
}