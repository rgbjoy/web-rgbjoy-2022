import type { GlobalAfterChangeHook } from 'payload'
import { revalidatePath } from 'next/cache'

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req: { payload, url } }) => {
  const globalSlug = url?.split('/globals/')?.[1]?.split('?')?.[0] || ''
  payload.logger.info(`Revalidating global: ${globalSlug}`)

  if (globalSlug === 'home') {
    revalidatePath('/')
  } else {
    revalidatePath(`/${globalSlug}`)
  }

  return doc
}
