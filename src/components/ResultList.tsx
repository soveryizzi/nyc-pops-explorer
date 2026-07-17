import { useEffect, useRef } from 'react'
import type { PopsSpace } from '../lib/resolvers'
import { SpaceCard } from './SpaceCard'

interface ResultListProps {
  spaces: PopsSpace[]
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  className?: string
}

export function ResultList({ spaces, selectedId, hoveredId, onSelect, onHover, className }: ResultListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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
      <div ref={containerRef} className={className}>
        <div className="result-list__empty" role="status">
          <p className="result-list__empty-title">No spaces match</p>
          <p className="result-list__empty-hint">Try removing a filter or changing your search.</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      <ul className="result-list__items">
        {spaces.map((space) => (
          <li key={space.id}>
            <SpaceCard
              space={space}
              selected={space.id === selectedId}
              hovered={space.id === hoveredId}
              onSelect={onSelect}
              onHover={onHover}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
