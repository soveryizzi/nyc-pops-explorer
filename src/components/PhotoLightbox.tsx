import { useEffect, useState, type RefObject } from 'react'
import { useDialogClose } from '../hooks/useDialogClose'
import type { ApprovedPhoto } from '../lib/submissions'

interface PhotoLightboxProps {
  photos: ApprovedPhoto[]
  startIndex: number
  spaceName: string
  onClose: () => void
}

export function PhotoLightbox({ photos, startIndex, spaceName, onClose }: PhotoLightboxProps) {
  const { containerRef, closeButtonRef } = useDialogClose<HTMLButtonElement>(onClose)
  const [index, setIndex] = useState(startIndex)
  const hasMultiple = photos.length > 1

  // Arrow-key stepping, layered on top of useDialogClose's own
  // Escape/Tab handling rather than duplicating it.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + photos.length) % photos.length)
      else if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % photos.length)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [photos.length])

  const photo = photos[index]

  return (
    <div className="photo-lightbox-backdrop" onClick={onClose}>
      <div
        ref={containerRef as RefObject<HTMLDivElement>}
        role="dialog"
        aria-label="Photo viewer"
        className="photo-lightbox"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close photo viewer"
          className="photo-lightbox__close"
          onClick={onClose}
        >
          ×
        </button>

        {hasMultiple && (
          <button
            type="button"
            aria-label="Previous photo"
            className="photo-lightbox__nav photo-lightbox__nav--prev"
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
          >
            ‹
          </button>
        )}

        <img src={photo.url} alt={`${spaceName} — visitor photo`} className="photo-lightbox__image" />

        {hasMultiple && (
          <button
            type="button"
            aria-label="Next photo"
            className="photo-lightbox__nav photo-lightbox__nav--next"
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
          >
            ›
          </button>
        )}

        {hasMultiple && (
          <p className="photo-lightbox__count" aria-hidden="true">
            {index + 1} / {photos.length}
          </p>
        )}
      </div>
    </div>
  )
}
