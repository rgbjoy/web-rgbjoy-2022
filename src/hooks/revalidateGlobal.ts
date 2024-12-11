import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req: { payload, context }, }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating ${doc.slug} ${doc} ${context.url} ${context.globalSlug}`)

    revalidateTag(`global_${doc.slug}`)
  }

  return doc
}
