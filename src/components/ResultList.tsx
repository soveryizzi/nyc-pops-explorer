import type { PopsSpace } from '../lib/resolvers'
import { SpaceCard } from './SpaceCard'

interface ResultListProps {
  spaces: PopsSpace[]
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}

export function ResultList({ spaces, selectedId, onSelect, className }: ResultListProps) {
  return (
    <div className={className}>
      <div className="result-list__count" aria-live="polite">
        {spaces.length} space{spaces.length === 1 ? '' : 's'}
      </div>
      <ul className="result-list__items">
        {spaces.map((space) => (
          <li key={space.id}>
            <SpaceCard space={space} selected={space.id === selectedId} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  )
}
