import { useId, useRef, useState, type FormEvent } from 'react'
import { matchSpaceByAddress } from '../lib/addressMatch'
import { prepareImageForUpload } from '../lib/image'
import { scanPhotoForHours } from '../lib/ocr'
import type { PopsSpace } from '../lib/resolvers'
import {
  MAX_PHOTO_BYTES,
  PhotoUploadError,
  submissionsEnabled,
  submitFeedback,
  submitPhoto,
  submitPlate,
} from '../lib/submissions'

// Tesseract occasionally hangs rather than erroring outright — without
// a ceiling, that leaves the submit button disabled (scanning never
// resolves) with no explanation. Racing it against this gives up and
// degrades to "no location/hours detected" the same way a real OCR
// failure already does, instead of stalling indefinitely.
const OCR_TIMEOUT_MS = 20000

interface FeedbackFormProps {
  /* The full (unfiltered) space list — address-matching an attached
     photo shouldn't depend on whatever the visitor currently has
     filtered/searched for on the map. */
  spaces: PopsSpace[]
}

// Lives inside the settings panel (see SettingsPanel) — general app
// feedback, not tied to any space up front. An attached photo runs
// through the same OCR pass PhotosSection uses for a specific
// location's plate (see lib/ocr): if the text names a POPS address
// confidently matching exactly one known space, the submission is
// redirected to that space's own photo/plate record instead of
// staying a plain, space-less feedback row (see lib/addressMatch for
// the matching rule, and why "no confident match" always falls back
// to plain feedback rather than guessing).
export function FeedbackForm({ spaces }: FeedbackFormProps) {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [hoursGuess, setHoursGuess] = useState<string | null>(null)
  const [matchedSpace, setMatchedSpace] = useState<PopsSpace | null>(null)
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
    setHoursGuess(null)
    setMatchedSpace(null)
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
    setHoursGuess(null)
    setMatchedSpace(null)
    setScanning(true)
    try {
      const { rawText, hoursGuess } = await Promise.race([
        scanPhotoForHours(prepared),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('OCR timed out')), OCR_TIMEOUT_MS)),
      ])
      setHoursGuess(hoursGuess)
      setMatchedSpace(matchSpaceByAddress(rawText, spaces))
    } catch {
      // OCR failing or timing out just means no auto-detected location
      // or hours — the photo still attaches, as plain feedback.
    } finally {
      setScanning(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    // A photo by itself is a complete submission now — only block
    // sending literally nothing.
    if (!trimmed && !photo) return

    setBusy(true)
    setError(null)
    setSuccess(null)

    const trimmedEmail = email.trim() || undefined
    const attachedToSpace = Boolean(photo && matchedSpace)

    try {
      if (photo && matchedSpace) {
        if (hoursGuess) {
          await submitPlate(matchedSpace.id, photo, hoursGuess, trimmed, trimmedEmail)
        } else {
          await submitPhoto(matchedSpace.id, photo, trimmed, trimmedEmail)
        }
      } else {
        await submitFeedback(trimmed, trimmedEmail, photo ?? undefined)
      }
    } catch (err) {
      // Ordered by how likely each is to be the real cause: a dropped
      // connection explains almost any failure here (there's no other
      // backend in this flow), so it's checked first regardless of
      // which specific call threw. PhotoUploadError narrows "the photo
      // itself didn't make it up" from "the submission wasn't saved" —
      // two different, differently-actionable things to tell someone.
      if (!navigator.onLine) {
        setError("You're offline. Check your connection and try again.")
      } else if (err instanceof PhotoUploadError) {
        setError("We couldn't upload your photo. Please try again.")
      } else {
        setError("We couldn't send your feedback. Please try again.")
      }
      setBusy(false)
      return
    }

    const sentPhoto = Boolean(photo)
    const sentMessage = Boolean(trimmed)
    const whatWasSent = sentMessage && sentPhoto ? 'feedback and photo' : sentPhoto ? 'photo' : 'feedback'
    setSuccess(
      attachedToSpace
        ? `Thanks! We matched your ${whatWasSent} to ${matchedSpace!.name}. It'll appear there once reviewed.`
        : `Thanks for the ${whatWasSent}!`,
    )
    setMessage('')
    setEmail('')
    removePhoto()
    setBusy(false)
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <div className="feedback-form__field">
        <label htmlFor={messageId} className="feedback-form__label">
          Feedback, comments, or uploads
        </label>
        <textarea
          id={messageId}
          className="feedback-form__textarea"
          placeholder="Bugs, ideas, missing spaces. Anything goes, or just attach a photo below."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={busy}
          rows={3}
        />
      </div>

      <div className="feedback-form__field">
        {photo ? (
          <div className="feedback-form__photo-attached">
            <p className="feedback-form__photo-main">
              <span aria-hidden="true">✓ </span>
              Photo attached.{' '}
              <button
                type="button"
                className="feedback-form__photo-remove"
                onClick={removePhoto}
                disabled={busy}
              >
                Remove
              </button>
            </p>
            {scanning && (
              <p className="feedback-form__photo-scanning" role="status">
                Checking the photo for a location and posted hours…
              </p>
            )}
            {!scanning && matchedSpace && (
              <p className="feedback-form__photo-hint">
                Looks like {matchedSpace.name}.{' '}
                {hoursGuess
                  ? "We'll attach this there, along with the hours it shows."
                  : "We'll attach this there instead of general feedback."}
              </p>
            )}
          </div>
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
        disabled={busy || scanning || (!message.trim() && !photo)}
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
