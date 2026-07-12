interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar" role="search">
      <label htmlFor="pops-search" className="sr-only">
        Search POPS by name, address, or amenity
      </label>
      <input
        id="pops-search"
        type="text"
        className="search-bar__input"
        placeholder="Search by name, address, amenity..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-bar__clear"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          ×
        </button>
      )}
    </div>
  )
}
