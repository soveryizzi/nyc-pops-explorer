import { useRef, useState, type FormEvent } from 'react'
import { prepareImageForUpload } from '../lib/image'
import { scanPhotoForHours } from '../lib/ocr'
import { MAX_PHOTO_BYTES, submitPhoto, submitPlate } from '../lib/submissions'

interface SuggestUpdateProps {
  spaceId: string
}

type ScanStatus = 'idle' | 'scanning' | 'done'

// Single photo-upload flow. Selecting a photo immediately resizes it
// and runs OCR looking for a plate's posted hours — if anything
// hours-shaped turns up, an editable field appears pre-filled with
// the guess (never auto-submitted). If OCR finds nothing, the same
// field appears empty so a visitor can still type hours in by hand,
// or just leave it blank and submit as a plain photo.
export function SuggestUpdate({ spaceId }: SuggestUpdateProps) {
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
    if (!preparedFile) {
      setError('Choose a photo first.')
      return
    }

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
    <section aria-label="Suggest an update" className="space-detail__section">
      <h3 className="space-detail__section-title">Suggest an update</h3>
      <form className="suggest-form" onSubmit={handleSubmit}>
        <div className="suggest-form__field">
          <label htmlFor={`suggest-photo-${spaceId}`} className="suggest-form__label">
            Photo of this space
          </label>
          <input
            id={`suggest-photo-${spaceId}`}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="suggest-form__file"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            disabled={busy}
          />
        </div>

        {scanStatus === 'scanning' && (
          <p className="suggest-form__scan-status" role="status">
            Reading the photo for posted hours…
          </p>
        )}

        {scanStatus === 'done' && preparedFile && (
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
        )}

        <button
          type="submit"
          className="button button--primary suggest-form__submit"
          disabled={busy || scanStatus === 'scanning'}
        >
          {busy ? 'Sending…' : 'Send for review'}
        </button>
        <p role="status" className="suggest-form__status">
          {success && <span className="suggest-form__success">{success}</span>}
          {error && <span className="suggest-form__error">{error}</span>}
        </p>
      </form>
    </section>
  )
}
