import type { UseUrlStateResult } from '../hooks/useUrlState'
import type { PopsSpace } from '../lib/resolvers'
import { AppHeader } from './AppHeader'
import { ResultList } from './ResultList'

interface SidebarProps {
  /* The filtered/searched list — what's actually shown in the results
     column below. */
  spaces: PopsSpace[]
  /* The full, unfiltered list — threaded through to AppHeader's
     settings panel for the feedback form's photo address-matching,
     which shouldn't depend on the visitor's current filter/search. */
  allSpaces: PopsSpace[]
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
  allSpaces,
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
        spaces={allSpaces}
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
