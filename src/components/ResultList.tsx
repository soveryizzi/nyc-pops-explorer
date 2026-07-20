import { useEffect, useRef, type MouseEvent } from 'react'
import type { PopsSpace } from '../lib/resolvers'
import { SpaceCard } from './SpaceCard'

interface ResultListProps {
  spaces: PopsSpace[]
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onEmptySpaceClick?: () => void
  className?: string
  /* True while the list itself is closing (e.g. switching mobile view
     away from list) — reverses the entrance stagger, fast. */
  closing?: boolean
}

// Entrance files in top-to-bottom; exit reverses (bottom leaves first)
// and stays short so closing the list never feels like a wait. Worst
// case (EXIT_STEP_CAP * EXIT_STEP_MS + the card's own 160ms exit
// duration) must stay under the list's unmount lingering window in
// App.tsx (240ms) or the last card gets cut off mid-animation.
const ENTRANCE_STEP_MS = 28
const ENTRANCE_STEP_CAP = 15
const EXIT_STEP_MS = 10
const EXIT_STEP_CAP = 6

export function ResultList({
  spaces,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onEmptySpaceClick,
  className,
  closing = false,
}: ResultListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as Element
    if (target.closest('.space-card')) return
    onEmptySpaceClick?.()
  }

  // Bring the selected card to the top of the list (just below the
  // header, via the container's scroll-padding-top) — selection can
  // come from a map marker, so the card may be anywhere in the list.
  // Deferred a tick so it starts after the detail dialog's focus
  // effect, which would otherwise cancel an in-flight smooth scroll.
  useEffect(() => {
    if (!selectedId) return
    const timer = window.setTimeout(() => {
      const el = containerRef.current
      const card = el?.querySelector<HTMLElement>('[data-selected="true"]')
      if (!el || !card) return

      const padTop = parseFloat(getComputedStyle(el).scrollPaddingTop) || 0
      const target = card.offsetTop - padTop

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.scrollTo({ top: target })
        return
      }

      // Smooth-scrolling a long way sends hundreds of cards flying by.
      // For far targets, teleport to within one screen first so the
      // animated glide is always short and readable.
      const glide = el.clientHeight
      const delta = target - el.scrollTop
      if (Math.abs(delta) > glide) {
        el.scrollTop = target - Math.sign(delta) * glide
      }
      el.scrollTo({ top: target, behavior: 'smooth' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [selectedId])

  if (spaces.length === 0) {
    return (
      <div ref={containerRef} className={className} onClick={handleContainerClick}>
        <div className="result-list__empty" role="status">
          <p className="result-list__empty-title">No spaces match</p>
          <p className="result-list__empty-hint">Try removing a filter or changing your search.</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className} onClick={handleContainerClick}>
      <ul className="result-list__items">
        {spaces.map((space, index) => {
          // Reversed relative to a small window, not the full (possibly
          // hundreds-long) list — otherwise every card past the first
          // few clamps to the same max delay instead of fanning out.
          const delay = closing
            ? Math.max(EXIT_STEP_CAP - index, 0) * EXIT_STEP_MS
            : Math.min(index, ENTRANCE_STEP_CAP) * ENTRANCE_STEP_MS
          return (
            <li key={space.id}>
              <SpaceCard
                space={space}
                selected={space.id === selectedId}
                hovered={space.id === hoveredId}
                onSelect={onSelect}
                onHover={onHover}
                closing={closing}
                style={{ animationDelay: `${delay}ms` }}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
