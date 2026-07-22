import { useEffect, useRef, useState } from 'react'
import { countActiveFilters } from '../hooks/useFilters'
import type { UseUrlStateResult } from '../hooks/useUrlState'
import { FilterPanel } from './FilterPanel'
import { SearchBar } from './SearchBar'
import { SettingsPanel } from './SettingsPanel'

interface AppHeaderProps {
  filters: UseUrlStateResult['filters']
  update: UseUrlStateResult['update']
  resultCount: number
  /* Clears filters/search/selection AND recenters the map — owned by
     the parent since AppHeader has no map reference of its own. */
  onReset: () => void
  /* Subway station layer visibility — a map display toggle, not a
     POPS space filter, so it isn't part of the URL-driven FilterState. */
  showTransit: boolean
  onToggleTransit: (show: boolean) => void
}

export function AppHeader({ filters, update, resultCount, onReset, showTransit, onToggleTransit }: AppHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const activeCount = countActiveFilters(filters)

  const handleTitleClick = () => {
    setSearchOpen(false)
    setFiltersOpen(false)
    setSettingsOpen(false)
    onReset()
  }

  const toggleSettings = () => {
    const open = !settingsOpen
    if (open) {
      setSearchOpen(false)
      setFiltersOpen(false)
    }
    setSettingsOpen(open)
  }

  const toggleSearch = () => {
    const open = !searchOpen
    if (open) {
      setSettingsOpen(false)
    }
    setSearchOpen(open)
  }

  const toggleFilters = () => {
    const open = !filtersOpen
    if (open) {
      setSettingsOpen(false)
    }
    setFiltersOpen(open)
  }

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
            <button
              type="button"
              className="app-header__title-button"
              aria-label="NYC POPS — reset filters, search, and map view"
              onClick={handleTitleClick}
            >
              NYC <span className="app-header__accent">POPS</span>
            </button>
          </h1>
          <p className="app-header__subtitle">privately owned public spaces</p>
        </div>
        <div className="app-header__icons">
          <button
            type="button"
            className="icon-button"
            aria-label="Settings"
            aria-expanded={settingsOpen}
            aria-controls="settings-panel"
            data-active={settingsOpen}
            onClick={toggleSettings}
          >
            <span className="material-icons" aria-hidden="true">
              settings
            </span>
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Search"
            aria-expanded={searchOpen}
            aria-controls="search-panel"
            data-active={searchOpen}
            onClick={toggleSearch}
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
            onClick={toggleFilters}
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
      <div id="settings-panel" className="app-header__panel" data-open={settingsOpen} inert={!settingsOpen}>
        <div className="app-header__panel-inner">
          <SettingsPanel showTransit={showTransit} onToggleTransit={onToggleTransit} />
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
              onClick={() => update({ borough: [], type: [], ada: [], amenity: [], q: '' }, { push: true })}
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
