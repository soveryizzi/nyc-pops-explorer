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

  const [initialMapView] = useState(() => {
    if (!filters.space) return undefined
    const target = spaces.find((space) => space.id === filters.space)
    if (!target?.coordinates) return undefined
    return { latitude: target.coordinates.lat, longitude: target.coordinates.lng, zoom: 15 }
  })

  const handleSelect = (id: string) => update({ space: id }, { push: true })
  const handleDeselect = () => update({ space: null }, { push: true })

  return (
    <div className="app">
      <MapView
        spaces={filteredSpaces}
        selectedId={filters.space}
        onSelect={handleSelect}
        onDeselect={handleDeselect}
        initialViewState={initialMapView}
      />

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
          <div className="mobile-topbar">
            <AppHeader filters={filters} update={update} />
          </div>

          {mobileView === 'list' && (
            <ResultList
              spaces={filteredSpaces}
              selectedId={filters.space}
              onSelect={handleSelect}
              className="mobile-list"
            />
          )}

          <ViewToggle view={mobileView} onChange={setMobileView} />

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
