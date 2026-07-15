import { useEffect, useMemo, useRef } from 'react'
import Map, { AttributionControl, Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { INITIAL_VIEW_STATE, MAP_STYLE_URL } from '../lib/constants'
import type { PopsSpace } from '../lib/resolvers'
import { SpaceMarker } from './SpaceMarker'

interface MapViewProps {
  spaces: PopsSpace[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDeselect: () => void
}

export function MapView({ spaces, selectedId, onSelect, onDeselect }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const mappable = useMemo(() => spaces.filter((space) => space.coordinates !== null), [spaces])

  useEffect(() => {
    const container = mapRef.current?.getContainer()
    if (!container) return
    container.querySelectorAll('.maplibregl-marker[role="button"]').forEach((el) => {
      el.removeAttribute('role')
      el.removeAttribute('aria-label')
      el.removeAttribute('tabindex')
    })
  }, [mappable])

  return (
    <Map
      ref={mapRef}
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE_URL}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      onClick={onDeselect}
    >
      <NavigationControl position="bottom-right" />
      <AttributionControl
        position="bottom-left"
        compact
        customAttribution={['OpenStreetMap contributors', 'OpenFreeMap', 'NYC Open Data']}
      />
      {mappable.map((space) => (
        <Marker
          key={space.id}
          longitude={space.coordinates!.lng}
          latitude={space.coordinates!.lat}
          anchor={space.indoor ? 'center' : 'bottom'}
        >
          <SpaceMarker
            indoor={space.indoor}
            selected={space.id === selectedId}
            label={space.name}
            onClick={() => onSelect(space.id)}
          />
        </Marker>
      ))}
    </Map>
  )
}
