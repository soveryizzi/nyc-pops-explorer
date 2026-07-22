import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface DialogCloseOptions {
  /* Tab-trap focus inside the container. Modal dialogs (the desktop
     detail card, the lightbox) want this; the scrimless mobile sheet
     is non-modal — the map behind it stays interactive — so trapping
     keyboard users inside it would give them less than pointer users
     get. Read through a ref (like onClose) so the once-per-lifetime
     trap effect never needs to re-run. */
  trapFocus?: boolean
}

export function useDialogClose<T extends HTMLElement = HTMLElement>(
  onClose: () => void,
  { trapFocus = true }: DialogCloseOptions = {},
) {
  const containerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<T>(null)

  // Read onClose through a ref so the trap effect can run once per
  // dialog lifetime. Depending on onClose directly re-runs the effect
  // on every parent render (callers pass inline handlers), which
  // steals focus back to the close button — e.g. out of the search
  // input whenever a debounced query commits while a detail is open.
  const onCloseRef = useRef(onClose)
  const trapFocusRef = useRef(trapFocus)
  useEffect(() => {
    onCloseRef.current = onClose
    trapFocusRef.current = trapFocus
  })

  useEffect(() => {
    const triggerElement = document.activeElement as HTMLElement | null
    // preventScroll: the dialog is a positioned overlay that's already
    // in view; a scrolling focus would also cancel any in-flight smooth
    // scroll elsewhere (e.g. the result list scrolling to the selection).
    closeButtonRef.current?.focus({ preventScroll: true })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (!trapFocusRef.current || e.key !== 'Tab' || !containerRef.current) return

      const focusable = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      triggerElement?.focus?.()
    }
  }, [])

  return { containerRef, closeButtonRef }
}
