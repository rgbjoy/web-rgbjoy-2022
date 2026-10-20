import { headers } from "next/headers"
import { SITE, STUDIO_SEO } from "../data/site"
import { getPublicCatalog } from "./content"

type Seo = { title: string; description: string }
type PageSeo = Seo & { url: string; image?: string }

/** Title, description and URL for the page being shared; proxy.ts supplies its path. */
export async function getPageSeo(fallback: Seo): Promise<PageSeo> {
  const path = (await headers()).get("x-pathname") ?? "/"
  const page = await findPageSeo(path)
  if (!page) return { ...fallback, url: new URL(path, SITE.url).href }
  return { ...page, url: new URL(path, SITE.url).href, image: `/og?path=${encodeURIComponent(path)}` }
}

/** The page's own title and description, or undefined when the site card should be used. */
export async function findPageSeo(path: string): Promise<Seo | undefined> {
  if (path === "/studio") return STUDIO_SEO
  const entries = await getPublicCatalog()
  const entry = entries.find(item => item.kind === "experiment" && new URL(item.url).pathname === path)
  if (!entry) return undefined
  return { title: `${entry.title} — ${SITE.name}`, description: entry.description || "" }
}
