import { useState } from 'react'
import { countActiveFilters } from '../hooks/useFilters'
import type { UseUrlStateResult } from '../hooks/useUrlState'
import { FilterPanel } from './FilterPanel'
import { SearchBar } from './SearchBar'

interface AppHeaderProps {
  filters: UseUrlStateResult['filters']
  update: UseUrlStateResult['update']
}

export function AppHeader({ filters, update }: AppHeaderProps) {
  const [panel, setPanel] = useState<'search' | 'filters' | null>(null)
  const activeCount = countActiveFilters(filters)

  const togglePanel = (name: 'search' | 'filters') => {
    setPanel((current) => (current === name ? null : name))
  }

  return (
    <div className="app-header">
      <div className="app-header__title-row">
        <div className="app-header__titles">
          <h1 className="app-header__title">
            NYC <span className="app-header__accent">POPS</span>
          </h1>
          <p className="app-header__subtitle">privately owned public spaces</p>
        </div>
        <div className="app-header__icons">
          <button
            type="button"
            className="icon-button"
            aria-label="Search"
            aria-expanded={panel === 'search'}
            aria-controls="search-panel"
            data-active={panel === 'search'}
            onClick={() => togglePanel('search')}
          >
            🔍
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Filters"
            aria-expanded={panel === 'filters'}
            aria-controls="filters-panel"
            data-active={panel === 'filters'}
            onClick={() => togglePanel('filters')}
          >
            ⚙
            {activeCount > 0 && (
              <span className="icon-button__badge" aria-hidden="true">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {panel === 'search' && (
        <div id="search-panel" className="app-header__panel">
          <SearchBar value={filters.q} onChange={(q) => update({ q }, { push: false })} />
        </div>
      )}
      {panel === 'filters' && (
        <div id="filters-panel" className="app-header__panel">
          <FilterPanel filters={filters} update={update} />
        </div>
      )}
    </div>
  )
}
