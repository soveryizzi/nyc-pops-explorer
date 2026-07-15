import { useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { MapView } from './components/MapView'
import { MobileSheet } from './components/MobileSheet'
import { ResultList } from './components/ResultList'
import { SpaceDetail } from './components/SpaceDetail'
import { Sidebar } from './components/Sidebar'
import { ViewToggle, type MobileView } from './components/ViewToggle'
import { useFilters } from './hooks/useFilters'
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

  const selected = spaces.find((space) => space.id === filters.space) ?? null

  const handleSelect = (id: string) => update({ space: id }, { push: true })
  const handleDeselect = () => update({ space: null }, { push: true })

  return (
    <div className="app">
      <main tabIndex={-1}>
        <MapView
          spaces={filteredSpaces}
          selectedId={filters.space}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
        />
      </main>

      {!isMobile && (
        <Sidebar
          spaces={filteredSpaces}
          filters={filters}
          update={update}
          selectedId={filters.space}
          onSelect={handleSelect}
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
            <AppHeader filters={filters} update={update} />
          </header>

          {mobileView === 'list' && (
            <nav aria-label="POPS results" className="mobile-list-nav">
              <ResultList
                spaces={filteredSpaces}
                selectedId={filters.space}
                onSelect={handleSelect}
                className="mobile-list"
              />
            </nav>
          )}

          <nav aria-label="View mode" className="view-toggle-nav">
            <ViewToggle view={mobileView} onChange={setMobileView} />
          </nav>

          {selected && (
            <MobileSheet onBackdropClick={handleDeselect}>
              <SpaceDetail space={selected} onClose={handleDeselect} />
            </MobileSheet>
          )}
        </>
      )}
    </div>
  )
}

export default App
