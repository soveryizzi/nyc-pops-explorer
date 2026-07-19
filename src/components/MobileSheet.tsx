import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface MobileSheetProps {
  children: ReactNode
  onBackdropClick: () => void
  /* Colors the grabber cap to match the detail header below it. */
  tone: 'indoor' | 'outdoor'
  /* Plays the exit animation; the parent unmounts after it finishes. */
  closing?: boolean
}

// Positioning shell only — the child (SpaceDetail) owns dialog role, focus, and Escape handling.
export function MobileSheet({ children, onBackdropClick, tone, closing = false }: MobileSheetProps) {
  const [height, setHeight] = useState(() =>
    typeof window === 'undefined' ? 0 : Math.round(window.innerHeight * 0.55),
  )
  const dragging = useRef(false)

  useEffect(() => {
    const clampHeight = (value: number) => {
      const min = 120
      const max = Math.round(window.innerHeight * 0.95)
      return Math.max(min, Math.min(max, value))
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging.current) return
      setHeight(clampHeight(window.innerHeight - event.clientY))
    }

    const stopDragging = () => {
      dragging.current = false
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  return (
    <div
      className={`mobile-sheet-backdrop${closing ? ' mobile-sheet-backdrop--closing' : ''}`}
      onClick={onBackdropClick}
    >
      <div
        className={`mobile-sheet mobile-sheet--${tone}${closing ? ' mobile-sheet--closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ height: `${height}px` }}
      >
        <div
          className="mobile-sheet__cap"
          aria-hidden="true"
          onPointerDown={(event) => {
            dragging.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
        >
          <div className="mobile-sheet__handle" />
        </div>
        {children}
      </div>
    </div>
  )
}
