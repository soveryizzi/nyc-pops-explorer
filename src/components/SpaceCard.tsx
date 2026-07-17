import type { PopsSpace } from '../lib/resolvers'

interface SpaceCardProps {
  space: PopsSpace
  selected: boolean
  hovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function SpaceCard({ space, selected, hovered, onSelect, onHover }: SpaceCardProps) {
  return (
    <button
      type="button"
      className="space-card"
      data-selected={selected}
      data-hovered={hovered}
      onClick={() => onSelect(space.id)}
      onMouseEnter={() => onHover(space.id)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="space-card__icon" aria-hidden="true">
        {space.indoor ? (
          <svg width="16" height="16" viewBox="0 0 32 32" role="presentation">
            <rect x="4" y="4" width="24" height="24" rx="9" fill="var(--color-indoor)" />
            <rect x="12" y="12" width="8" height="8" rx="3" fill="#ffffff" />
          </svg>
        ) : (
          <svg width="16" height="19" viewBox="0 0 32 36" role="presentation">
            <path
              d="M16 2C9.373 2 4 7.373 4 14c0 8.5 12 20 12 20s12-11.5 12-20c0-6.627-5.373-12-12-12z"
              fill="var(--color-outdoor)"
            />
            <circle cx="16" cy="14" r="5" fill="#ffffff" />
          </svg>
        )}
      </span>
      <span className="space-card__body">
        <span className="space-card__name">{space.name}</span>
        <span className="space-card__address">{space.address || 'No map location'}</span>
        <span className="space-card__tags">
          {space.borough && <span className="tag tag--outline">{space.borough}</span>}
          <span className={`tag tag--${space.indoor ? 'indoor' : 'outdoor'}`}>
            {space.indoor ? 'Indoor' : 'Outdoor'}
          </span>
          {space.spaceType && <span className="tag tag--neutral">{space.spaceType}</span>}
        </span>
      </span>
    </button>
  )
}
