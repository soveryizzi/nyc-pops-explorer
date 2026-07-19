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
  const [sheetPeeked, setSheetPeeked] = useState(false)
  const [focusToken, setFocusToken] = useState(0)
  const [resetToken, setResetToken] = useState(0)

  const selected = spaces.find((space) => space.id === filters.space) ?? null

  // Linger past close/switch so the exit animations can play.
  const sheet = useLingering(isMobile ? selected : null, 340)
  const list = useLingering(isMobile && mobileView === 'list' ? ('list' as const) : null, 240)

  // A fresh selection always starts with the sheet fully expanded.
  useEffect(() => {
    setSheetPeeked(false)
  }, [filters.space])

  const handleSelect = (id: string) => update({ space: id }, { push: true })
  const handleDeselect = () => update({ space: null }, { push: true })

  const handleReset = () => {
    update({ borough: [], type: [], ada: [], amenity: [], q: '', space: null }, { push: true })
    setResetToken((t) => t + 1)
  }

  const handleViewOnMap = () => {
    setMobileView('map')
    setSheetPeeked(true)
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
          sheetPeeked={sheetPeeked}
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
            <AppHeader filters={filters} update={update} resultCount={filteredSpaces.length} onReset={handleReset} />
          </header>

          {list.shown && (
            <nav aria-label="POPS results" className="mobile-list-nav">
              <ResultList
                spaces={filteredSpaces}
                selectedId={filters.space}
                hoveredId={hoveredId}
                onSelect={handleSelect}
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
            <MobileSheet
              tone={sheet.shown.indoor ? 'indoor' : 'outdoor'}
              closing={sheet.closing}
              peeked={sheetPeeked}
              onExpand={() => setSheetPeeked(false)}
              onBackdropClick={handleDeselect}
            >
              <SpaceDetail space={sheet.shown} onClose={handleDeselect} onViewOnMap={handleViewOnMap} />
            </MobileSheet>
          )}
        </>
      )}
    </div>
  )
}

export default App
