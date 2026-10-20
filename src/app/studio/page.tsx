import type { Metadata } from "next"

import { STUDIO_SEO } from "../data/site"
import { Estimator } from "./Estimator"

export const metadata: Metadata = {
  ...STUDIO_SEO,
  alternates: { canonical: "/studio" },
}

/** Linked from the menu, the homepage intro and the availability pill; listed in the sitemap and llms.txt. */
export default function StudioPage() {
  return <Estimator />
}
