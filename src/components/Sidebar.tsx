import type { UseUrlStateResult } from '../hooks/useUrlState'
import type { PopsSpace } from '../lib/resolvers'
import { AppHeader } from './AppHeader'
import { ResultList } from './ResultList'

interface SidebarProps {
  spaces: PopsSpace[]
  filters: UseUrlStateResult['filters']
  update: UseUrlStateResult['update']
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onReset: () => void
  showTransit: boolean
  onToggleTransit: (show: boolean) => void
}

export function Sidebar({
  spaces,
  filters,
  update,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onReset,
  showTransit,
  onToggleTransit,
}: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="POPS search and results">
      <AppHeader
        filters={filters}
        update={update}
        resultCount={spaces.length}
        onReset={onReset}
        showTransit={showTransit}
        onToggleTransit={onToggleTransit}
      />
      <ResultList
        spaces={spaces}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        className="sidebar__results"
      />
    </nav>
  )
}
