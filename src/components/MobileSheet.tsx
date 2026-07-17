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
  return (
    <div
      className={`mobile-sheet-backdrop${closing ? ' mobile-sheet-backdrop--closing' : ''}`}
      onClick={onBackdropClick}
    >
      <div
        className={`mobile-sheet mobile-sheet--${tone}${closing ? ' mobile-sheet--closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-sheet__cap" aria-hidden="true">
          <div className="mobile-sheet__handle" />
        </div>
        {children}
      </div>
    </div>
  )
}
