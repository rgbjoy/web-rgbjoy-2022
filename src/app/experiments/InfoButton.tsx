'use client'

import { Info } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { usePortfolio } from '../utilities/PortfolioProvider'
import styles from './BackLink.module.css'

/** Closes the card on Escape or a tap anywhere outside it. */
function useDismiss(ref: React.RefObject<HTMLElement | null>, setOpen: (open: boolean) => void) {
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, setOpen])
}

/** The "i" beside the back link: hover (or tap) for the experiment's title and description. */
export function InfoButton() {
  const pathname = usePathname()
  const { experiments } = usePortfolio()
  const experiment = experiments.find((entry) => entry.href === pathname)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, setOpen)

  if (!experiment) return null

  return (
    <div ref={ref} className={`${styles.info} ${open ? styles.infoOpen : ''}`}>
      <button
        type="button"
        className={`${styles.back} ${styles.infoButton}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={`About ${experiment.title}`}
        aria-expanded={open}
      >
        <Info size={14} strokeWidth={1.75} aria-hidden />
      </button>
      <div className={styles.card} role="tooltip">
        <p className={styles.cardTitle}>{experiment.title}</p>
        <p className={styles.cardText}>{experiment.description}</p>
      </div>
    </div>
  )
}
