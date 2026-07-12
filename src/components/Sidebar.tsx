import type { UseUrlStateResult } from '../hooks/useUrlState'
import type { PopsSpace } from '../lib/resolvers'
import { AppHeader } from './AppHeader'
import { ResultList } from './ResultList'

interface SidebarProps {
  spaces: PopsSpace[]
  filters: UseUrlStateResult['filters']
  update: UseUrlStateResult['update']
  selectedId: string | null
  onSelect: (id: string) => void
}

export function Sidebar({ spaces, filters, update, selectedId, onSelect }: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="POPS search and results">
      <AppHeader filters={filters} update={update} />
      <ResultList spaces={spaces} selectedId={selectedId} onSelect={onSelect} className="sidebar__results" />
    </nav>
  )
}
