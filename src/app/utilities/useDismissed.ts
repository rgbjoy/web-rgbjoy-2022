"use client"

import { useSyncExternalStore } from "react"

/** How long a closed pill stays closed. */
const DAY = 24 * 60 * 60 * 1000
const CHANGE_EVENT = "rgbjoy:dismissed-change"

/** Closed this page load, for when storage isn't available. */
const closedThisLoad = new Set<string>()

function isDismissed(key: string) {
  if (closedThisLoad.has(key)) return true
  try {
    const closedAt = Number(window.localStorage.getItem(key))
    return closedAt > 0 && Date.now() - closedAt < DAY
  } catch {
    return false
  }
}

function dismiss(key: string) {
  closedThisLoad.add(key)
  try {
    window.localStorage.setItem(key, String(Date.now()))
  } catch {
    // Closing still works for this visit without storage.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  // Another tab closing the same pill.
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

/** Whether something closed under `key` is still closed (for a day), and a way to close it. */
export function useDismissed(key: string) {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => isDismissed(key),
    () => false,
  )
  return [dismissed, () => dismiss(key)] as const
}
