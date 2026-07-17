interface SpaceMarkerProps {
  indoor: boolean
  selected: boolean
  hovered: boolean
  label: string
  onClick: () => void
  onHover: (hovering: boolean) => void
}

export function SpaceMarker({ indoor, selected, hovered, label, onClick, onHover }: SpaceMarkerProps) {
  const size = selected ? 32 : 20
  const fill = selected ? 'var(--color-primary-dark)' : indoor ? 'var(--color-indoor)' : 'var(--color-outdoor)'

  return (
    <button
      type="button"
      className="space-marker"
      aria-label={label}
      aria-pressed={selected}
      data-hovered={hovered}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
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
          <rect x="3" y="3" width="26" height="26" rx="9" fill={fill} stroke="#ffffff" strokeWidth="2.5" />
          <rect x="11" y="11" width="10" height="10" rx="3.5" fill="#ffffff" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 32 36" role="presentation">
          <path
            d="M16 2C9.373 2 4 7.373 4 14c0 8.5 12 20 12 20s12-11.5 12-20c0-6.627-5.373-12-12-12z"
            fill={fill}
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle cx="16" cy="14" r="5" fill="#ffffff" />
        </svg>
      )}
    </button>
  )
}
