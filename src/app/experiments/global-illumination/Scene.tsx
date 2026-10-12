"use client"

import { Check, Move3d, Rotate3d } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import type { EditMode } from "./Controls"
import { GlobalIlluminationCanvas } from "./GlobalIllumination"
import { rotatable, type SceneObject } from "./room"
import styles from "./page.module.css"

const LABELS: Record<SceneObject, string> = {
  glow: "Orange sphere",
  pebble: "Green sphere",
  block: "Blue block",
}

export default function Page() {
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const [selected, setSelected] = useState<SceneObject | null>(null)
  const [mode, setMode] = useState<EditMode>("translate")
  const canRotate = selected !== null && rotatable(selected)
  const editing: EditMode = canRotate ? mode : "translate"

  // W to move, E to rotate, Esc to let go — the usual editor keys.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return
      const key = event.key.toLowerCase()
      if (key === "w") setMode("translate")
      else if (key === "e") setMode("rotate")
      else if (key === "escape") setSelected(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <main
      className={styles.main}
      aria-label="A room inside a concrete box floating in the sky, with an orange glowing sphere, a small green sphere and a blue block. Sun streams through a single window in a visible shaft and bounces off the floor and walls, filling the shadows with soft, tinted light. Drag to orbit, scroll to move in and out of the building, click an object to move it."
    >
      <div className={styles.stage} style={{ opacity: ready ? 1 : 0 }}>
        <GlobalIlluminationCanvas
          onReady={onReady}
          selected={selected}
          mode={editing}
          onSelect={setSelected}
        />
      </div>
      {selected && (
        <div className={styles.toolbar} role="toolbar" aria-label={`Editing the ${LABELS[selected].toLowerCase()}`}>
          <span className={styles.toolbarLabel}>{LABELS[selected]}</span>
          <button
            type="button"
            className={styles.tool}
            aria-pressed={editing === "translate"}
            aria-keyshortcuts="W"
            onClick={() => setMode("translate")}
          >
            <Move3d size={14} strokeWidth={1.75} aria-hidden />
            Move
          </button>
          <button
            type="button"
            className={styles.tool}
            aria-pressed={editing === "rotate"}
            aria-keyshortcuts="E"
            disabled={!canRotate}
            title={canRotate ? undefined : "A sphere looks the same however it's turned"}
            onClick={() => setMode("rotate")}
          >
            <Rotate3d size={14} strokeWidth={1.75} aria-hidden />
            Rotate
          </button>
          <button
            type="button"
            className={styles.tool}
            aria-keyshortcuts="Escape"
            onClick={() => setSelected(null)}
          >
            <Check size={14} strokeWidth={1.75} aria-hidden />
            Done
          </button>
        </div>
      )}
    </main>
  )
}
