import type { RefObject } from 'react'
import { AMENITIES } from '../lib/constants'
import { googleMapsUrl, type PopsSpace } from '../lib/resolvers'
import { useDialogClose } from '../hooks/useDialogClose'

interface SpaceDetailProps {
  space: PopsSpace
  onClose: () => void
  onViewOnMap?: () => void
}

const ADA_COLOR: Record<PopsSpace['ada']['status'], string> = {
  full: 'var(--color-ada-full)',
  partial: 'var(--color-ada-partial)',
  none: 'var(--color-ada-none)',
  unknown: 'var(--color-ada-unknown)',
}

export function SpaceDetail({ space, onClose, onViewOnMap }: SpaceDetailProps) {
  const { containerRef, closeButtonRef } = useDialogClose<HTMLButtonElement>(onClose)

  return (
    <div
      ref={containerRef as RefObject<HTMLDivElement>}
      role="dialog"
      aria-label={space.name}
      className="space-detail"
    >
      <div className={`space-detail__header space-detail__header--${space.indoor ? 'indoor' : 'outdoor'}`}>
        <div>
          <h2 className="space-detail__name">{space.name}</h2>
          <a
            href={googleMapsUrl(space.raw)}
            target="_blank"
            rel="noreferrer"
            className="space-detail__address"
          >
            {space.address ? `Route me to ${space.address}` : 'Address unavailable'}
          </a>
        </div>
        <div className="space-detail__header-actions">
          {onViewOnMap && (
            <button type="button" aria-label="View on map" className="space-detail__map-action" onClick={onViewOnMap}>
              <span className="material-icons" aria-hidden="true">
                map
              </span>
            </button>
          )}
          <button ref={closeButtonRef} type="button" aria-label="Close detail" className="space-detail__close" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      <div className="space-detail__body">
        <div className="space-detail__tags">
          {space.borough && <span className="tag tag--outline">{space.borough}</span>}
          <span className={`tag tag--${space.indoor ? 'indoor' : 'outdoor'}`}>{space.indoor ? 'Indoor' : 'Outdoor'}</span>
          {space.spaceType &&
            space.spaceType
              .split(/[;,]/)
              .map((type) => type.trim())
              .filter(Boolean)
              .map((type) => (
                <span key={type} className="tag tag--neutral">
                  {type}
                </span>
              ))}
        </div>

        <section aria-label="Amenities" className="space-detail__section">
          <h3 className="space-detail__section-title">Amenities</h3>
          <ul className="amenity-checklist">
            {AMENITIES.map((amenity) => {
              const present = space.amenities.has(amenity.id)
              return (
                <li key={amenity.id} className="amenity-checklist__item" data-present={present}>
                  <span aria-hidden="true">{present ? '✓' : '✕'}</span>
                  <span>{amenity.label}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-label="Hours" className="space-detail__section space-detail__hours">
          <h3 className="space-detail__section-title">Hours</h3>
          <p>{space.hours}</p>
          <p className="space-detail__hours-caveat">
            ⚠️ This data may be out of date — confirm hours before visiting.
          </p>
          {space.apopsUrl && (
            <a
              href={space.apopsUrl}
              target="_blank"
              rel="noreferrer"
              className="button button--primary space-detail__apops"
            >
              View on APOPS
            </a>
          )}
        </section>

        <section aria-label="Accessibility" className="space-detail__section">
          <h3 className="space-detail__section-title">Accessibility</h3>
          <p style={{ color: ADA_COLOR[space.ada.status] }} className="space-detail__ada-label">
            ♿ {space.ada.label}
          </p>
          {space.ada.subtitle && <p className="space-detail__ada-subtitle">{space.ada.subtitle}</p>}
        </section>

      </div>
    </div>
  )
}
