import { useRef, useState, type FormEvent } from 'react'
import { prepareImageForUpload } from '../lib/image'
import { MAX_PHOTO_BYTES, submitHours, submitPhoto } from '../lib/submissions'

interface SuggestUpdateProps {
  spaceId: string
}

// Anonymous suggestion form: corrected hours and/or a photo. Nothing
// appears publicly until a submission is approved in the Supabase
// dashboard, so the messaging promises review, not publication.
export function SuggestUpdate({ spaceId }: SuggestUpdateProps) {
  const [hoursText, setHoursText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedHours = hoursText.trim()
    if (!trimmedHours && !file) {
      setError('Add corrected hours or a photo first.')
      setSuccess(null)
      return
    }

    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      if (file) {
        // Resized client-side before upload (faster on cellular) and
        // stripped of EXIF/GPS metadata as a side effect of the
        // canvas re-encode — see lib/image.ts.
        const prepared = await prepareImageForUpload(file)
        if (prepared.size > MAX_PHOTO_BYTES) {
          setError('That photo is too large — try a different one.')
          setBusy(false)
          return
        }
        await submitPhoto(spaceId, prepared)
      }
      if (trimmedHours) await submitHours(spaceId, trimmedHours)
      setSuccess('Thanks! Your update will appear once it has been reviewed.')
      setHoursText('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
          <label htmlFor={`suggest-hours-${spaceId}`} className="suggest-form__label">
            Corrected hours
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
        </div>
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
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
        </div>
        <button type="submit" className="button button--primary suggest-form__submit" disabled={busy}>
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
