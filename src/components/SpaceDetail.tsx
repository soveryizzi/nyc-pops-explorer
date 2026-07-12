import { useEffect, useRef } from 'react'
import { googleMapsUrl, type PopsSpace } from '../lib/resolvers'

interface SpaceDetailProps {
  space: PopsSpace
  onClose: () => void
}

export function SpaceDetail({ space, onClose }: SpaceDetailProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-label={space.name}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 320,
        maxWidth: 'calc(100vw - 32px)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: space.indoor ? 'var(--color-indoor)' : 'var(--color-outdoor)',
          color: '#fff',
          padding: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{space.name}</h2>
          <a
            href={googleMapsUrl(space.raw)}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#fff', fontSize: 13 }}
          >
            {space.address || 'Address unavailable'}
          </a>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close detail"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.25)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: '#fff',
            width: 28,
            height: 28,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: 'var(--space-4)', fontSize: 14, color: 'var(--color-ink-soft)' }}>
        <p style={{ margin: 0 }}>
          {space.borough} · {space.spaceType || 'Space type unknown'}
        </p>
      </div>
    </div>
  )
}
