import { useEffect, useRef, useState } from 'react'
import { countActiveFilters } from '../hooks/useFilters'
import type { UseUrlStateResult } from '../hooks/useUrlState'
import { FilterPanel } from './FilterPanel'
import { SearchBar } from './SearchBar'

interface AppHeaderProps {
  filters: UseUrlStateResult['filters']
  update: UseUrlStateResult['update']
  resultCount: number
}

export function AppHeader({ filters, update, resultCount }: AppHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const activeCount = countActiveFilters(filters)

  // The result lists scroll underneath this header, so they need its
  // height (which changes as panels open/close) to pad and position
  // scrolled-to items. Only one AppHeader is mounted per layout tree,
  // so publishing to the root element is unambiguous.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const publish = () =>
      document.documentElement.style.setProperty('--app-header-height', `${el.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="app-header" ref={rootRef}>
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
            aria-expanded={searchOpen}
            aria-controls="search-panel"
            data-active={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <span className="material-icons" aria-hidden="true">
              search
            </span>
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Filters"
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
            data-active={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <span className="material-icons" aria-hidden="true">
              tune
            </span>
            {activeCount > 0 && (
              <span className="icon-button__badge" aria-hidden="true">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panels stay mounted so open/close can animate; `inert` keeps
          the collapsed ones out of the tab order and away from AT. */}
      <div id="search-panel" className="app-header__panel" data-open={searchOpen} inert={!searchOpen}>
        <div className="app-header__panel-inner">
          <SearchBar
            active={searchOpen}
            value={filters.q}
            onChange={(q) => update({ q }, { push: false })}
          />
        </div>
      </div>
      <div id="filters-panel" className="app-header__panel" data-open={filtersOpen} inert={!filtersOpen}>
        <div className="app-header__panel-inner">
          <FilterPanel filters={filters} update={update} />
        </div>
      </div>

      <div className="app-header__meta">
        <span className="app-header__count" aria-live="polite">
          {resultCount} space{resultCount === 1 ? '' : 's'}
        </span>
        <div className="app-header__meta-actions">
          {activeCount > 0 && (
            <button
              type="button"
              className="app-header__clear"
              onClick={() => update({ borough: [], type: [], ada: [], amenity: [] }, { push: true })}
            >
              Clear filters
            </button>
          )}
          {filtersOpen && (
            <button type="button" className="app-header__done" onClick={() => setFiltersOpen(false)}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
