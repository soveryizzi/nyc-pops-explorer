import { useEffect, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { MapView } from './components/MapView'
import { MobileSheet } from './components/MobileSheet'
import { ResultList } from './components/ResultList'
import { SpaceDetail } from './components/SpaceDetail'
import { Sidebar } from './components/Sidebar'
import { ViewToggle, type MobileView } from './components/ViewToggle'
import { useFilters } from './hooks/useFilters'
import { useLingering } from './hooks/useLingering'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useSpaces } from './hooks/useSpaces'
import { useUrlState } from './hooks/useUrlState'
import { MOBILE_MEDIA_QUERY } from './lib/constants'

function App() {
  const { spaces } = useSpaces()
  const { filters, update } = useUrlState()
  const filteredSpaces = useFilters(spaces, filters)
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)
  const [mobileView, setMobileView] = useState<MobileView>('map')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [resetToken, setResetToken] = useState(0)
  // A setting, so it survives reloads. try/catch: localStorage throws
  // in some private-browsing modes, and the toggle should still work
  // (just not persist) rather than crash.
  const [showTransit, setShowTransit] = useState(() => {
    try {
      return localStorage.getItem('nyc-pops:show-transit') !== 'false'
    } catch {
      return true
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('nyc-pops:show-transit', String(showTransit))
    } catch {
      /* not persistable — fine */
    }
  }, [showTransit])

  const selected = spaces.find((space) => space.id === filters.space) ?? null

  // Linger past close/switch so the exit animations can play.
  const sheet = useLingering(isMobile ? selected : null, 340)
  const list = useLingering(isMobile && mobileView === 'list' ? ('list' as const) : null, 240)

  const handleSelect = (id: string) => update({ space: id }, { push: true })
  const handleDeselect = () => update({ space: null }, { push: true })

  const handleReset = () => {
    update({ borough: [], type: [], ada: [], amenity: [], q: '', space: null }, { push: true })
    setResetToken((t) => t + 1)
  }

  // Selecting a card from the mobile list: the list was covering the
  // map, so the pin needs the same "here it is" treatment as an
  // explicit highlight — switch to map view and pulse+center it.
  // (Picking a marker directly needs none of this: the map is already
  // what's on screen, so a plain re-center is enough — see MapView's
  // own selectedCoords effect.)
  const handleSelectFromList = (id: string) => {
    update({ space: id }, { push: true })
    setMobileView('map')
    setFocusToken((t) => t + 1)
  }

  return (
    <div className="app">
      {/* .app-main is explicitly sized — a bare <main> collapses to
          0 height and blanks the map (see Phase 3 history). */}
      <main className="app-main" aria-label="Map of POPS locations">
        <MapView
          spaces={filteredSpaces}
          selectedId={filters.space}
          hoveredId={hoveredId}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
          onHover={setHoveredId}
          focusToken={focusToken}
          resetToken={resetToken}
          isMobile={isMobile}
          showTransit={showTransit}
        />
      </main>

      {!isMobile && (
        <Sidebar
          spaces={filteredSpaces}
          filters={filters}
          update={update}
          selectedId={filters.space}
          hoveredId={hoveredId}
          onSelect={handleSelect}
          onHover={setHoveredId}
          onReset={handleReset}
          showTransit={showTransit}
          onToggleTransit={setShowTransit}
        />
      )}

      {!isMobile && selected && (
        <div className="detail-card">
          <SpaceDetail space={selected} onClose={handleDeselect} />
        </div>
      )}

      {isMobile && (
        <>
          <header className="mobile-topbar">
            <AppHeader
              filters={filters}
              update={update}
              resultCount={filteredSpaces.length}
              onReset={handleReset}
              showTransit={showTransit}
              onToggleTransit={setShowTransit}
            />
          </header>

          {list.shown && (
            <nav aria-label="POPS results" className="mobile-list-nav">
              <ResultList
                spaces={filteredSpaces}
                selectedId={filters.space}
                hoveredId={hoveredId}
                onSelect={handleSelectFromList}
                onHover={setHoveredId}
                onEmptySpaceClick={() => setMobileView('map')}
                closing={list.closing}
                className={`mobile-list${list.closing ? ' mobile-list--closing' : ''}`}
              />
            </nav>
          )}

          <nav aria-label="View mode" className="view-toggle-nav">
            <ViewToggle view={mobileView} onChange={setMobileView} />
          </nav>

          {sheet.shown && (
            /* Keyed by space so picking a different marker (the map is
               tappable behind the scrimless sheet) remounts the sheet
               and replays its slide-up entrance for the new location. */
            <MobileSheet
              key={sheet.shown.id}
              tone={sheet.shown.indoor ? 'indoor' : 'outdoor'}
              closing={sheet.closing}
            >
              <SpaceDetail space={sheet.shown} onClose={handleDeselect} trapFocus={false} />
            </MobileSheet>
          )}
        </>
      )}
    </div>
  )
}

export default App
