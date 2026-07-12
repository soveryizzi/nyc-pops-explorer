import type { PopsSpace } from '../lib/resolvers'

interface SpaceCardProps {
  space: PopsSpace
  selected: boolean
  onSelect: (id: string) => void
}

export function SpaceCard({ space, selected, onSelect }: SpaceCardProps) {
  return (
    <button
      type="button"
      className="space-card"
      data-selected={selected}
      onClick={() => onSelect(space.id)}
    >
      <span className={`space-card__icon space-card__icon--${space.indoor ? 'indoor' : 'outdoor'}`} aria-hidden="true">
        {space.indoor ? '▢' : '📍'}
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
