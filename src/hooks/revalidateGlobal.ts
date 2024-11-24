import type { GlobalAfterChangeHook } from 'payload'
import { revalidateTag } from 'next/cache'

export const revalidateGlobal: GlobalAfterChangeHook = ({
  doc,
  req: { payload },
}) => {
  const globalSlug = doc._collection || ''
  payload.logger.info(`Revalidating global: ${globalSlug}`)

  revalidateTag(globalSlug)

  return doc
}
