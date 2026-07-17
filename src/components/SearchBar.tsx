import { useEffect, useRef, useState } from 'react'

interface SearchBarProps {
  /* True while the search panel is expanded — drives focus. */
  active: boolean
  value: string
  onChange: (value: string) => void
}

const DEBOUNCE_MS = 500

export function SearchBar({ active, value, onChange }: SearchBarProps) {
  // The input is driven by local draft state so typing stays instant;
  // the committed value (URL state → filtered results) only updates
  // after the user pauses for DEBOUNCE_MS. The field keeps focus
  // through those commits — it only deactivates when the user clicks
  // away (useDialogClose no longer re-grabs focus on re-renders).
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | undefined>(undefined)

  // Focus the field whenever the search panel opens. (The component
  // stays mounted while the panel is collapsed, so this can't be a
  // mount effect.)
  useEffect(() => {
    if (active) inputRef.current?.focus({ preventScroll: true })
  }, [active])

  // Sync the draft when the committed value changes from outside
  // (back/forward navigation). A no-op after our own commits.
  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const handleChange = (next: string) => {
    setDraft(next)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => onChange(next), DEBOUNCE_MS)
  }

  const handleClear = () => {
    window.clearTimeout(timerRef.current)
    setDraft('')
    onChange('')
  }

  return (
    <div className="search-bar" role="search">
      <label htmlFor="pops-search" className="sr-only">
        Search POPS by name, address, or amenity
      </label>
      <input
        ref={inputRef}
        id="pops-search"
        type="text"
        className="search-bar__input"
        placeholder="Search by name, address, amenity..."
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
      />
      {draft && (
        <button
          type="button"
          className="search-bar__clear"
          aria-label="Clear search"
          onClick={handleClear}
        >
          ×
        </button>
      )}
    </div>
  )
}
