import { useState, type RefObject } from 'react'
import { AMENITIES } from '../lib/constants'
import { googleMapsUrl, nycPlanningUrl, type PopsSpace } from '../lib/resolvers'
import { useApprovedSubmissions } from '../hooks/useApprovedSubmissions'
import { useDialogClose } from '../hooks/useDialogClose'
import { AccordionSection } from './AccordionSection'
import { PhotoLightbox } from './PhotoLightbox'
import { PhotosSection } from './PhotosSection'

const MONTH_YEAR = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

interface SpaceDetailProps {
  space: PopsSpace
  onClose: () => void
  onHighlightMap?: () => void
}

const ADA_COLOR: Record<PopsSpace['ada']['status'], string> = {
  full: 'var(--color-ada-full)',
  partial: 'var(--color-ada-partial)',
  none: 'var(--color-ada-none)',
  unknown: 'var(--color-ada-unknown)',
}

export function SpaceDetail({ space, onClose, onHighlightMap }: SpaceDetailProps) {
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

  const presentAmenities = AMENITIES.filter((a) => space.amenities.has(a.id))
  const absentAmenities = AMENITIES.filter((a) => !space.amenities.has(a.id))
  const planningUrl = nycPlanningUrl(space.coordinates)

  return (
    <>
      <div
        ref={containerRef as RefObject<HTMLDivElement>}
        role="dialog"
        aria-label={space.name}
        className={`space-detail space-detail--${space.indoor ? 'indoor' : 'outdoor'}`}
      >
        <div className={`space-detail__header space-detail__header--${space.indoor ? 'indoor' : 'outdoor'}`}>
          <button ref={closeButtonRef} type="button" aria-label="Close detail" className="space-detail__close" onClick={onClose}>
            ×
          </button>
          <h2 className="space-detail__name">{space.name}</h2>
          <div className="space-detail__link-row">
            <a href={googleMapsUrl(space.raw)} target="_blank" rel="noreferrer" className="space-detail__address">
              {space.address ? `Route me to ${space.address}` : 'Address unavailable'}
            </a>
            {onHighlightMap && (
              <button type="button" className="space-detail__highlight" onClick={onHighlightMap}>
                Highlight on map
              </button>
            )}
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

          <div className="accordion">
            <AccordionSection title="Amenities" defaultOpen>
              {presentAmenities.length > 0 && (
                <ul className="amenity-present">
                  {presentAmenities.map((amenity) => (
                    <li key={amenity.id}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 10.5l4 4L16 6" />
                      </svg>
                      {amenity.label}
                    </li>
                  ))}
                </ul>
              )}
              {absentAmenities.length > 0 && (
                <p className="amenity-absent">
                  <strong>Not available:</strong> {absentAmenities.map((a) => a.label.toLowerCase()).join(', ')}.
                </p>
              )}
            </AccordionSection>

            <AccordionSection title="Hours">
              <p className="hours-value">{space.hours}</p>
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
              {(space.apopsUrl || planningUrl) && (
                <div className="space-detail__hours-actions">
                  {space.apopsUrl && (
                    <a href={space.apopsUrl} target="_blank" rel="noreferrer" className="button button--primary">
                      View on APOPS
                    </a>
                  )}
                  {planningUrl && (
                    <a href={planningUrl} target="_blank" rel="noreferrer" className="button button--primary">
                      View on NYC Planning
                    </a>
                  )}
                </div>
              )}
            </AccordionSection>

            <AccordionSection title="Accessibility">
              <p style={{ color: ADA_COLOR[space.ada.status] }} className="space-detail__ada-label">
                ♿ {space.ada.label}
              </p>
              {space.ada.subtitle && <p className="space-detail__ada-subtitle">{space.ada.subtitle}</p>}
            </AccordionSection>

            <AccordionSection title="Photos & updates">
              <PhotosSection
                spaceId={space.id}
                spaceName={space.name}
                photos={approved.photos}
                onPhotoClick={setLightboxIndex}
              />
            </AccordionSection>
          </div>
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
