"use client"

import { useEffect, useState } from "react"

/**
 * The id of the section crossing a line a third of the way down the screen, or null above the first.
 * Each id is a section's heading; the whole section around it is what's watched.
 */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join(" ")

  useEffect(() => {
    const sections = new Map<Element, string>()
    for (const id of key.split(" ")) {
      const section = document.getElementById(id)?.closest("section")
      if (section) sections.set(section, id)
    }

    // A thin band across the screen: whichever section is in it is the one being read.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = sections.get(entry.target)
          if (entry.isIntersecting) setActive(id ?? null)
          else setActive((current) => (current === id && entry.boundingClientRect.top > 0 ? null : current))
        }
      },
      { rootMargin: "-33% 0px -66% 0px" },
    )
    sections.forEach((_, section) => observer.observe(section))
    return () => observer.disconnect()
  }, [key])

  return active
}
