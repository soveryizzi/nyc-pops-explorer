import { useEffect, useRef } from 'react'

export function useDialogClose<T extends HTMLElement>(onClose: () => void) {
  const closeButtonRef = useRef<T>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return closeButtonRef
}
