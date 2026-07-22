import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface MobileSheetProps {
  children: ReactNode
  /* Colors the grabber cap to match the detail header below it. */
  tone: 'indoor' | 'outdoor'
  /* Plays the exit animation; the parent unmounts after it finishes. */
  closing?: boolean
  /* Collapsed to just the header bar (e.g. after "view on map"). */
  peeked?: boolean
  /* Tapping the cap while peeked calls this to expand back to full. */
  onExpand?: () => void
}

// Positioning shell only — the child (SpaceDetail) owns dialog role, focus, and Escape handling.
// No scrim: the map stays interactive underneath, so tapping another
// marker swaps the sheet and tapping empty map deselects (both wired
// through MapView, not here).
export function MobileSheet({
  children,
  tone,
  closing = false,
  peeked = false,
  onExpand,
}: MobileSheetProps) {
  const [height, setHeight] = useState(() =>
    typeof window === 'undefined' ? 0 : Math.round(window.innerHeight * 0.55),
  )
  const [peekHeight, setPeekHeight] = useState<number | null>(null)
  const dragging = useRef(false)
  const capRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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

  // Publish the cap's real height so the header below it (sticky in
  // the same scroll container — see the CSS comment on
  // .mobile-sheet .space-detail__header) can offset its own sticky
  // top by exactly that much instead of competing for the same
  // top:0 slot. useLayoutEffect so the var is set before first paint,
  // not after a frame of both elements stuck at top:0.
  useLayoutEffect(() => {
    const cap = capRef.current
    if (!cap) return
    const publish = () => document.documentElement.style.setProperty('--mobile-sheet-cap-height', `${cap.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(cap)
    return () => observer.disconnect()
  }, [])

  // Measure the colored header bar (rendered by the child SpaceDetail)
  // so the peeked height matches it exactly — no hardcoded constant,
  // so long space names that wrap to two lines still fit.
  useEffect(() => {
    const header = contentRef.current?.querySelector<HTMLElement>('.space-detail__header')
    if (!header) return
    const publish = () => setPeekHeight((capRef.current?.offsetHeight ?? 0) + header.offsetHeight)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  // Publish the sheet's actual current height (peeked or full, dragged
  // or default) so MapView can pad its centering to keep a selected
  // pin inside the part of the screen the sheet doesn't cover — reset
  // to 0 on unmount so a stale value doesn't linger after the sheet
  // closes and the map goes back to using the full viewport.
  //
  // useLayoutEffect, not useEffect: on a fresh selection this sheet
  // mounts in the same commit as MapView's own selectedCoords change.
  // MapView and MobileSheet are unrelated siblings, so passive effects
  // between them have no guaranteed order — MapView's flyTo could run
  // first and read a stale height. All layout effects in a commit run
  // before any passive effect, tree position aside, so this guarantees
  // the CSS var is current before MapView's (passive) effect reads it.
  const effectiveHeight = peeked && peekHeight ? peekHeight : height
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--mobile-sheet-height', `${effectiveHeight}px`)
    return () => {
      document.documentElement.style.setProperty('--mobile-sheet-height', '0px')
    }
  }, [effectiveHeight])

  return (
    <div
      className={`mobile-sheet mobile-sheet--${tone}${closing ? ' mobile-sheet--closing' : ''}`}
      data-peeked={peeked}
      style={{
        height: peeked && peekHeight ? `${peekHeight}px` : `${height}px`,
        // Free-drag tracking must follow the pointer 1:1 — suppress
        // the CSS height transition while actively dragging so it
        // only plays for the peek toggle.
        transition: dragging.current ? 'none' : undefined,
      }}
    >
      <div
        ref={capRef}
        className="mobile-sheet__cap"
        role={peeked ? 'button' : undefined}
        aria-label={peeked ? 'Expand details' : undefined}
        aria-hidden={peeked ? undefined : true}
        onClick={peeked ? onExpand : undefined}
        onPointerDown={(event) => {
          if (peeked) return
          dragging.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
      >
        <div className="mobile-sheet__handle" />
      </div>
      <div ref={contentRef} className="mobile-sheet__content">
        {children}
      </div>
    </div>
  )
}
