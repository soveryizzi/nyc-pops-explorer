import type { ReactNode } from 'react'

interface MobileSheetProps {
  children: ReactNode
  onBackdropClick: () => void
}

// Positioning shell only — the child (SpaceDetail) owns dialog role, focus, and Escape handling.
export function MobileSheet({ children, onBackdropClick }: MobileSheetProps) {
  return (
    <div className="mobile-sheet-backdrop" onClick={onBackdropClick}>
      <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-sheet__handle" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
