export type MobileView = 'map' | 'list'

interface ViewToggleProps {
  view: MobileView
  onChange: (view: MobileView) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Switch between map and list view">
      <button
        type="button"
        className="view-toggle__button"
        aria-pressed={view === 'list'}
        data-pressed={view === 'list'}
        onClick={() => onChange('list')}
      >
        List
      </button>
      <button
        type="button"
        className="view-toggle__button"
        aria-pressed={view === 'map'}
        data-pressed={view === 'map'}
        onClick={() => onChange('map')}
      >
        Map
      </button>
    </div>
  )
}
