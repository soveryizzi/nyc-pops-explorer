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
  initialViewState?: { latitude: number; longitude: number; zoom: number }
}

export function MapView({ spaces, selectedId, onSelect, onDeselect, initialViewState }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const mappable = useMemo(() => spaces.filter((space) => space.coordinates !== null), [spaces])

  useEffect(() => {
    if (!selectedId) return
    const space = spaces.find((s) => s.id === selectedId)
    if (!space?.coordinates) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    mapRef.current?.flyTo({
      center: [space.coordinates.lng, space.coordinates.lat],
      duration: reducedMotion ? 0 : 600,
    })
  }, [selectedId, spaces])

  // maplibre's compact attribution control starts expanded on mount; collapse
  // it to the info icon so it doesn't crowd the mobile view-toggle pill.
  const handleLoad = () => {
    mapRef.current?.getContainer().querySelector('.maplibregl-ctrl-attrib[open]')?.removeAttribute('open')
  }

  // maplibre-gl's Marker class force-sets role="button" + aria-label="Map
  // marker" on its wrapper div unless a role is already present, which nests
  // an interactive element around our own labeled <button>. Strip it after
  // each render — child Marker effects (which create these elements) commit
  // before this parent effect runs, so the elements already exist.
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
      initialViewState={initialViewState ?? INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE_URL}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      onClick={onDeselect}
      onLoad={handleLoad}
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
