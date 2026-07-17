import { useEffect, useState } from 'react'

/**
 * Keeps the last non-null value rendered for `ms` after it becomes
 * null, so exit animations can play before the element unmounts.
 * `closing` is true during that grace period — use it to apply the
 * exit-animation class.
 */
export function useLingering<T>(value: T | null, ms: number): { shown: T | null; closing: boolean } {
  const [shown, setShown] = useState<T | null>(value)

  // Render-time sync (not an effect) so opens/changes appear instantly.
  if (value !== null && value !== shown) {
    setShown(value)
  }

  const closing = value === null && shown !== null

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(() => setShown(null), ms)
    return () => window.clearTimeout(timer)
  }, [closing, ms])

  return { shown, closing }
}
