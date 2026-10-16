import type { Metadata } from "next"

import { Estimator } from "./Estimator"

export const metadata: Metadata = {
  title: "Studio — Tom Fletcher",
  description:
    "RGBJOY is the studio of Tom Fletcher, a full-stack engineer and designer who builds with AI tools and without the slop: what you need, the gaps filled, ready for how people use the web next. Price your site at the bottom.",
  alternates: { canonical: "/studio" },
}

/** Linked from the menu, the homepage intro and the availability pill; listed in the sitemap and llms.txt. */
export default function StudioPage() {
  return <Estimator />
}
