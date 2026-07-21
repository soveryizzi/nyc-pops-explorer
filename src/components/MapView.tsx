import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { AttributionControl, Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { INITIAL_VIEW_STATE, MAP_STYLE_URL } from '../lib/constants'
import type { PopsSpace } from '../lib/resolvers'
import { SpaceMarker } from './SpaceMarker'

interface MapViewProps {
  spaces: PopsSpace[]
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onDeselect: () => void
  onHover: (id: string | null) => void
  /* Bump to force a re-center on the current selection even when
     selectedId itself hasn't changed (e.g. "view on map" while a
     space is already selected). */
  focusToken?: number
  /* Bump to fly back to the default NYC view (e.g. the logo reset). */
  resetToken?: number
  /* Whether the mobile top bar / bottom sheet chrome should be
     treated as obstructing the viewport when centering a pin. */
  isMobile?: boolean
  /* Mobile bottom sheet is in its collapsed "peek" state — leaves
     most of the screen free, but the peek bar still needs padding. */
  sheetPeeked?: boolean
}

const PEEK_BAR_HEIGHT = 130

export function MapView({
  spaces,
  selectedId,
  hoveredId,
  onSelect,
  onDeselect,
  onHover,
  focusToken,
  resetToken,
  isMobile,
  sheetPeeked,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const mappable = useMemo(() => spaces.filter((space) => space.coordinates !== null), [spaces])
  const selectedCoords = selectedId ? spaces.find((s) => s.id === selectedId)?.coordinates ?? null : null

  // "Highlight on map" should visibly highlight the pin, not just
  // recenter on it (recentering alone already happens on selection,
  // so it wouldn't read as a distinct action). Pulses the selected
  // marker briefly, but only when focusToken actually changes while
  // a space is already selected — not on page load, and not merely
  // because a *different* marker just became selected.
  const [pulsingId, setPulsingId] = useState<string | null>(null)
  const prevFocusToken = useRef(focusToken)
  useEffect(() => {
    const changed = focusToken !== prevFocusToken.current
    prevFocusToken.current = focusToken
    if (!changed || !selectedId) return
    setPulsingId(selectedId)
    const timer = window.setTimeout(() => setPulsingId(null), 900)
    return () => window.clearTimeout(timer)
  }, [focusToken, selectedId])

  useEffect(() => {
    const container = mapRef.current?.getContainer()
    if (!container) return
    container.querySelectorAll('.maplibregl-marker[role="button"]').forEach((el) => {
      el.removeAttribute('role')
      el.removeAttribute('aria-label')
      el.removeAttribute('tabindex')
    })
  }, [mappable])

  useEffect(() => {
    if (!selectedCoords) return
    const topbarHeight = isMobile
      ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-header-height')) || 0
      : 0
    mapRef.current?.flyTo({
      center: [selectedCoords.lng, selectedCoords.lat],
      zoom: 14,
      duration: 800,
      padding: {
        top: topbarHeight + 16,
        bottom: isMobile && sheetPeeked ? PEEK_BAR_HEIGHT : 0,
        left: 0,
        right: 0,
      },
    })
  }, [selectedCoords, focusToken, isMobile, sheetPeeked])

  useEffect(() => {
    if (!resetToken) return
    mapRef.current?.flyTo({
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      duration: 800,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    })
  }, [resetToken])

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
            hovered={space.id === hoveredId}
            pulsing={space.id === pulsingId}
            label={space.name}
            onClick={() => onSelect(space.id)}
            onHover={(hovering) => onHover(hovering ? space.id : null)}
          />
        </Marker>
      ))}
    </Map>
  )
}
