import { useState, type RefObject } from 'react'
import { AMENITIES } from '../lib/constants'
import { googleMapsUrl, type PopsSpace } from '../lib/resolvers'
import { submissionsEnabled } from '../lib/submissions'
import { useApprovedSubmissions } from '../hooks/useApprovedSubmissions'
import { useDialogClose } from '../hooks/useDialogClose'
import { PhotoLightbox } from './PhotoLightbox'
import { SuggestUpdate } from './SuggestUpdate'

const MONTH_YEAR = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

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
  const approved = useApprovedSubmissions(space.id)
  const latestHoursUpdate = approved.hours[0]
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // The lightbox is a second, independent dialog that can be open at
  // the same time as this one. useDialogClose's Escape handling is
  // unconditional (no focus check, unlike its Tab-trap), so without
  // this it would close *this* dialog too the moment the lightbox's
  // own Escape handler closes the lightbox. Swapping in a no-op while
  // the lightbox is open is enough — Tab doesn't need the same
  // treatment, since its handler only acts when the outer dialog's
  // own boundary elements are actually focused, which they can't be
  // while focus is inside the lightbox.
  const { containerRef, closeButtonRef } = useDialogClose<HTMLButtonElement>(
    lightboxIndex === null ? onClose : () => {},
  )

  return (
    <>
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
          {latestHoursUpdate && (
            <div className="space-detail__hours-reported">
              <span className="space-detail__hours-reported-label">
                Last updated: {MONTH_YEAR.format(new Date(latestHoursUpdate.createdAt))}
              </span>
              <p className="space-detail__hours-reported-text">{latestHoursUpdate.hoursText}</p>
            </div>
          )}
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

        {approved.photos.length > 0 && (
          <section aria-label="Visitor photos" className="space-detail__section">
            <h3 className="space-detail__section-title">Photos</h3>
            <div className="photo-grid">
              {approved.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  className="photo-grid__item"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img src={photo.url} alt={`${space.name} — visitor photo`} loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {submissionsEnabled && <SuggestUpdate spaceId={space.id} />}

      </div>
    </div>

    {/* Sibling, not nested inside the dialog above — so this dialog's
        own Tab-trap (scoped to containerRef) never picks up the
        lightbox's buttons as descendants. See the useDialogClose
        call above for how Escape is kept from leaking between them. */}
    {lightboxIndex !== null && (
      <PhotoLightbox
        photos={approved.photos}
        startIndex={lightboxIndex}
        spaceName={space.name}
        onClose={() => setLightboxIndex(null)}
      />
    )}
    </>
  )
}
