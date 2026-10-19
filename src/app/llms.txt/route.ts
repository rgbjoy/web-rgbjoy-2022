import { getSettings, getPublicCatalog, getSeo, getInfo } from "../server/content"
import { catalogMarkdown } from '../data/catalog'
import { studioMarkdown } from '../studio/content'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getSettings()
  const author = (await getInfo(settings)).author
  const text = [catalogMarkdown(await getPublicCatalog(settings), (await getSeo(settings)).description, author), studioMarkdown(author)].join('\n')
  return new Response(text, {
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
