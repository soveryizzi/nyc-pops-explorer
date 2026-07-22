interface TransitMarkerProps {
  active: boolean
  label: string
  onClick: () => void
}

// A small, deliberately minimal dot — this is a background reference
// layer (subway stations), not a primary CTA like the POPS markers,
// so it stays visually quiet even though the tap target around it is
// still real (see .transit-marker's padding in components.css).
export function TransitMarker({ active, label, onClick }: TransitMarkerProps) {
  return (
    <button
      type="button"
      className="transit-marker"
      data-active={active}
      aria-label={label}
      aria-pressed={active}
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <span className="transit-marker__dot" aria-hidden="true" />
    </button>
  )
}
