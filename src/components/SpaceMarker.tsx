interface SpaceMarkerProps {
  indoor: boolean
  selected: boolean
  label: string
  onClick: () => void
}

const SIZE = 32
const SIZE_SELECTED = 42

export function SpaceMarker({ indoor, selected, label, onClick }: SpaceMarkerProps) {
  const size = selected ? SIZE_SELECTED : SIZE
  const fill = selected ? 'var(--color-primary-dark)' : indoor ? 'var(--color-indoor)' : 'var(--color-outdoor)'
  const stroke = selected ? '#ffffff' : 'none'

  return (
    // Excluded from tab order: with ~400 markers this would make Tab
    // unusable, and the list cards already provide a keyboard path to every
    // space's detail view.
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        width: size,
        height: size,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        zIndex: selected ? 10 : 1,
        position: 'relative',
        filter: selected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
      }}
    >
      {indoor ? (
        <svg width={size} height={size} viewBox="0 0 32 32" role="presentation">
          <rect x="4" y="4" width="24" height="24" rx="8" fill={fill} stroke={stroke} strokeWidth="2.5" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 32 36" role="presentation">
          <path
            d="M16 2C9.373 2 4 7.373 4 14c0 8.5 12 20 12 20s12-11.5 12-20c0-6.627-5.373-12-12-12z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.5"
          />
        </svg>
      )}
    </button>
  )
}
