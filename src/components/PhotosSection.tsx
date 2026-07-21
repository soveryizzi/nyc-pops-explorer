import { useRef, useState, type FormEvent } from 'react'
import { prepareImageForUpload } from '../lib/image'
import { scanPhotoForHours } from '../lib/ocr'
import { MAX_PHOTO_BYTES, submissionsEnabled, submitPhoto, submitPlate, type ApprovedPhoto } from '../lib/submissions'

interface PhotosSectionProps {
  spaceId: string
  spaceName: string
  photos: ApprovedPhoto[]
  onPhotoClick: (index: number) => void
}

type ScanStatus = 'idle' | 'scanning' | 'done'

// The full "Photos & updates" panel content: approved photos plus a
// native-style add-tile in the same grid. Picking a photo immediately
// resizes it and runs OCR looking for a plate's posted hours — if
// anything hours-shaped turns up, an editable field appears pre-filled
// with the guess (never auto-submitted). If OCR finds nothing, the
// same field appears empty for manual entry, or can be left blank.
export function PhotosSection({ spaceId, spaceName, photos, onPhotoClick }: PhotosSectionProps) {
  const [preparedFile, setPreparedFile] = useState<File | null>(null)
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [hoursDetected, setHoursDetected] = useState(false)
  const [hoursText, setHoursText] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setPreparedFile(null)
    setScanStatus('idle')
    setHoursDetected(false)
    setHoursText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = async (rawFile: File | undefined) => {
    setError(null)
    setSuccess(null)
    if (!rawFile) {
      resetForm()
      return
    }

    setScanStatus('scanning')
    setHoursDetected(false)
    setHoursText('')

    const prepared = await prepareImageForUpload(rawFile)
    if (prepared.size > MAX_PHOTO_BYTES) {
      setError('That photo is too large — try a different one.')
      resetForm()
      return
    }
    setPreparedFile(prepared)

    try {
      const { hoursGuess } = await scanPhotoForHours(prepared)
      if (hoursGuess) {
        setHoursText(hoursGuess)
        setHoursDetected(true)
      }
    } catch {
      // OCR failing entirely just means no auto-fill — the hours
      // field still appears, empty, for manual entry.
    } finally {
      setScanStatus('done')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!preparedFile) return

    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const trimmedHours = hoursText.trim()
      if (trimmedHours) {
        await submitPlate(spaceId, preparedFile, trimmedHours)
      } else {
        await submitPhoto(spaceId, preparedFile)
      }
      setSuccess('Thanks! Your update will appear once it has been reviewed.')
      resetForm()
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className="photo-grid__item"
            onClick={() => onPhotoClick(index)}
          >
            <img src={photo.url} alt={`${spaceName} — visitor photo`} loading="lazy" />
          </button>
        ))}
        {submissionsEnabled && (
          <label className="photo-grid__add">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              disabled={busy}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add</span>
          </label>
        )}
      </div>

      {photos.length === 0 && !submissionsEnabled && (
        <p className="photo-grid__empty">No photos yet.</p>
      )}

      {submissionsEnabled && (
        <>
          <p className="photo-caption">
            Upload a photo of the space or the plate — we'll read the hours automatically if it's there.
          </p>

          {scanStatus === 'scanning' && (
            <p className="suggest-form__scan-status" role="status">
              Reading the photo for posted hours…
            </p>
          )}

          {scanStatus === 'done' && preparedFile && (
            <form className="suggest-form" onSubmit={handleSubmit}>
              <div className="suggest-form__field">
                <label htmlFor={`suggest-hours-${spaceId}`} className="suggest-form__label">
                  Hours
                </label>
                <input
                  id={`suggest-hours-${spaceId}`}
                  type="text"
                  className="suggest-form__input"
                  placeholder="e.g. Open 7am–10pm daily"
                  value={hoursText}
                  onChange={(e) => setHoursText(e.target.value)}
                  disabled={busy}
                />
                <p className="suggest-form__hint">
                  {hoursDetected
                    ? 'Read from your photo — check it’s right, or edit it.'
                    : "Couldn't read hours from this photo — type them in if you can see them, or leave blank."}
                </p>
              </div>
              <button type="submit" className="button button--primary suggest-form__submit" disabled={busy}>
                {busy ? 'Sending…' : 'Send for review'}
              </button>
            </form>
          )}

          <p role="status" className="suggest-form__status">
            {success && <span className="suggest-form__success">{success}</span>}
            {error && <span className="suggest-form__error">{error}</span>}
          </p>
        </>
      )}
    </>
  )
}
