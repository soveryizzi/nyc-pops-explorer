import { useId, useRef, useState, type FormEvent } from 'react'
import { prepareImageForUpload } from '../lib/image'
import { MAX_PHOTO_BYTES, submissionsEnabled, submitFeedback } from '../lib/submissions'

// Lives inside the settings panel (see SettingsPanel) — general
// app feedback, not tied to any space, so unlike PhotosSection there's
// no spaceId to thread through. The optional photo attachment reuses
// PhotosSection's exact pick -> resize/compress -> size-check pipeline
// (see prepareImageForUpload/MAX_PHOTO_BYTES) — just without the OCR
// step, since that's specific to a location's posted-hours plate.
export function FeedbackForm() {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messageId = useId()
  const emailId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!submissionsEnabled) {
    return <p className="feedback-form__unavailable">Feedback isn't available right now.</p>
  }

  const removePhoto = () => {
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePhotoChange = async (rawFile: File | undefined) => {
    setError(null)
    setSuccess(null)
    if (!rawFile) {
      removePhoto()
      return
    }
    const prepared = await prepareImageForUpload(rawFile)
    if (prepared.size > MAX_PHOTO_BYTES) {
      setError('That photo is too large. Try a different one.')
      removePhoto()
      return
    }
    setPhoto(prepared)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await submitFeedback(trimmed, email.trim() || undefined, photo ?? undefined)
      setSuccess('Thanks for the feedback!')
      setMessage('')
      setEmail('')
      removePhoto()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <div className="feedback-form__field">
        <label htmlFor={messageId} className="feedback-form__label">
          Any feedback to share?
        </label>
        <textarea
          id={messageId}
          className="feedback-form__textarea"
          placeholder="Bugs, ideas, missing spaces — anything goes"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={busy}
          rows={3}
          required
        />
      </div>

      <div className="feedback-form__field">
        {photo ? (
          <p className="feedback-form__photo-attached">
            <span aria-hidden="true">✓ </span>
            Photo attached —{' '}
            <button
              type="button"
              className="feedback-form__photo-remove"
              onClick={removePhoto}
              disabled={busy}
            >
              remove
            </button>
          </p>
        ) : (
          <label className="feedback-form__photo-add">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handlePhotoChange(e.target.files?.[0])}
              disabled={busy}
            />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add a photo (optional)
          </label>
        )}
      </div>

      <div className="feedback-form__field">
        <label htmlFor={emailId} className="feedback-form__label">
          Email (optional)
        </label>
        <input
          id={emailId}
          type="email"
          className="feedback-form__input"
          placeholder="If you'd like a reply"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </div>
      <button
        type="submit"
        className="app-header__done feedback-form__submit"
        disabled={busy || !message.trim()}
      >
        {busy ? 'Sending…' : 'Send feedback'}
      </button>
      <p role="status" className="feedback-form__status">
        {success && (
          <span className="feedback-form__success">
            <span aria-hidden="true">✓ </span>
            {success}
          </span>
        )}
        {error && (
          <span className="feedback-form__error">
            <span aria-hidden="true">⚠ </span>
            {error}
          </span>
        )}
      </p>
    </form>
  )
}
