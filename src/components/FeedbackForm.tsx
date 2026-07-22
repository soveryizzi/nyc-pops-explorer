import { useId, useState, type FormEvent } from 'react'
import { submissionsEnabled, submitFeedback } from '../lib/submissions'

// Lives inside the header's feedback panel (see AppHeader) — general
// app feedback, not tied to any space, so unlike PhotosSection there's
// no spaceId to thread through.
export function FeedbackForm() {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messageId = useId()
  const emailId = useId()

  if (!submissionsEnabled) {
    return <p className="feedback-form__unavailable">Feedback isn't available right now.</p>
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await submitFeedback(trimmed, email.trim() || undefined)
      setSuccess('Thanks for the feedback!')
      setMessage('')
      setEmail('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <p className="feedback-form__disclaimer">
        <strong>a note</strong>
      </p>
      <p className="feedback-form__disclaimer">
        This dataset hasn't been updated recently, so details like hours, amenities, and accessibility may not be accurate. We recommend verifying before you visit.
      </p>
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
      <p className="feedback-form__attributions">
        Map/data credits: OpenStreetMap contributors, OpenFreeMap, and NYC Open Data.
      </p>
    </form>
  )
}
