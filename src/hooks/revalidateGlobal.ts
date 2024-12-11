import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req: { payload, context }, }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating ${JSON.stringify(payload)} ${JSON.stringify(context)}`)

    revalidateTag(`global_${doc.slug}`)
  }

  return doc
}
