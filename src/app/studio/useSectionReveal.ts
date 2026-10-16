"use client"

import gsap from "gsap"
import { useEffect, type RefObject } from "react"

import styles from "./page.module.css"

/** What rises in each section; querySelectorAll keeps them in reading order. */
const ITEMS = [styles.intro, styles.columns, styles.portrait, styles.detail, styles.processStep]
  .map((name) => `.${name}`)
  .concat(`.${styles.prose} > p`)
  .join(", ")

function parts(section: HTMLElement) {
  return {
    rule: section.querySelector(`.${styles.headingRule}`),
    labels: section.querySelectorAll(`.${styles.headingName}, .${styles.headingIndex}`),
    items: section.querySelectorAll(ITEMS),
  }
}

function hide(section: HTMLElement) {
  const { rule, labels, items } = parts(section)
  gsap.set(rule, { scaleX: 0, transformOrigin: "left center" })
  gsap.set(labels, { autoAlpha: 0 })
  gsap.set(items, { autoAlpha: 0, y: 16 })
}

/** The rule draws across, the labels settle, and the content rises in a quick stagger. */
function reveal(section: HTMLElement) {
  const { rule, labels, items } = parts(section)
  gsap
    .timeline({ defaults: { ease: "power3.out", duration: 0.6 } })
    .to(rule, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, 0)
    .to(labels, { autoAlpha: 1, duration: 0.4 }, 0)
    .to(items, { autoAlpha: 1, y: 0, stagger: 0.05, clearProps: "transform,opacity,visibility" }, 0.1)
}

/** Eases each section in once, as it scrolls into view. Off under reduced motion. */
export function useSectionReveal(root: RefObject<HTMLElement | null>, reducedMotion: boolean) {
  useEffect(() => {
    if (reducedMotion || !root.current) return
    const sections = Array.from(root.current.querySelectorAll<HTMLElement>(`.${styles.section}`))
    // A context, so turning reduced motion on mid-visit puts everything back as it was.
    const context = gsap.context(() => sections.forEach(hide))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)
          context.add(() => reveal(entry.target as HTMLElement))
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    )
    sections.forEach((section) => observer.observe(section))
    return () => {
      observer.disconnect()
      context.revert()
    }
  }, [root, reducedMotion])
}
