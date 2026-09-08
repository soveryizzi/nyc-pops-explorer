import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useControl } from 'react-map-gl/maplibre'
import type { IControl } from 'maplibre-gl'

type LocateStatus = 'idle' | 'locating' | 'found' | 'denied' | 'error'

interface LocateControlProps {
  onLocate: (coords: { lng: number; lat: number; accuracy: number }) => void
}

// A stock maplibre corner control's onAdd() only runs (and its DOM
// node only exists) once map.addControl() fires inside useControl's
// effect — one render after mount. Creating the container eagerly in
// the constructor instead means it exists from this component's very
// first render, so the portal below always has somewhere to render
// into; onAdd just hands the already-built node to maplibre, which
// moves it into the live corner stack without touching its content.
class LocateMapControl implements IControl {
  container = document.createElement('div')
  onAdd() {
    this.container.className = 'maplibregl-ctrl locate-control'
    return this.container
  }
  onRemove() {
    this.container.remove()
  }
}

// A one-shot "recenter on me" button living in the map's bottom-right
// corner stack alongside NavigationControl (maplibre stacks same-
// corner controls itself — see useControl's position option — so no
// manual positioning math here). Deliberately not watchPosition: a
// single fix per tap matches every other "static until asked" pattern
// in this app (useSpaces boots from a snapshot, station markers are
// zoom-gated) rather than continuously draining battery/GPS.
export function LocateControl({ onLocate }: LocateControlProps) {
  const ctrl = useControl<LocateMapControl>(() => new LocateMapControl(), { position: 'bottom-right' })
  const [status, setStatus] = useState<LocateStatus>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const handleClick = useCallback(() => {
    window.clearTimeout(resetTimer.current)
    if (!('geolocation' in navigator)) {
      setStatus('error')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('found')
        onLocate({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          accuracy: position.coords.accuracy,
        })
        resetTimer.current = window.setTimeout(() => setStatus('idle'), 2000)
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
        resetTimer.current = window.setTimeout(() => setStatus('idle'), 4500)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [onLocate])

  const label =
    status === 'denied'
      ? 'Location access denied — check your browser settings'
      : status === 'error'
        ? "Couldn't find your location — try again"
        : 'Find my location'

  return createPortal(
    <div className="locate-control__wrap">
      <button
        type="button"
        className="locate-button"
        data-status={status}
        aria-label={label}
        disabled={status === 'locating'}
        onClick={handleClick}
      >
        {status === 'locating' ? (
          <span className="locate-button__spinner" aria-hidden="true" />
        ) : (
          <span className="material-icons" aria-hidden="true">
            my_location
          </span>
        )}
      </button>
      {(status === 'denied' || status === 'error') && (
        <p className="locate-tooltip" role="status">
          {label}
        </p>
      )}
    </div>,
    ctrl.container,
  )
}
