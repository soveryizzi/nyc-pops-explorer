import { AMENITIES, BOROUGHS } from '../lib/constants'
import type { FilterState, TypeFilter, UseUrlStateResult } from '../hooks/useUrlState'

interface FilterPanelProps {
  filters: FilterState
  update: UseUrlStateResult['update']
  showTransit: boolean
  onToggleTransit: (show: boolean) => void
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function Chip({
  label,
  pressed,
  onClick,
}: {
  label: string
  pressed: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} data-pressed={pressed} onClick={onClick}>
      {label}
    </button>
  )
}

export function FilterPanel({ filters, update, showTransit, onToggleTransit }: FilterPanelProps) {
  return (
    <div className="filter-panel">
      <fieldset className="filter-group">
        <legend>Borough</legend>
        <div className="chip-row">
          {BOROUGHS.map((borough) => (
            <Chip
              key={borough}
              label={borough}
              pressed={filters.borough.includes(borough)}
              onClick={() => update({ borough: toggle(filters.borough, borough) }, { push: true })}
            />
          ))}
        </div>
      </fieldset>

      <div className="filter-panel__row">
        <fieldset className="filter-group filter-group--half">
          <legend>Type</legend>
          <div className="chip-row">
            {(['outdoor', 'indoor'] as TypeFilter[]).map((type) => (
              <Chip
                key={type}
                label={type === 'outdoor' ? 'Outdoors' : 'Indoors'}
                pressed={filters.type.includes(type)}
                onClick={() => update({ type: toggle(filters.type, type) }, { push: true })}
              />
            ))}
          </div>
        </fieldset>

        <div className="filter-panel__divider" aria-hidden="true" />

        <fieldset className="filter-group filter-group--half">
          <legend>Accessibility</legend>
          <div className="chip-row">
            {/* NYC's dataset never reports "full" and "partial" ADA
                access as distinct values in practice — every accessible
                record comes through as "Full/Partial" (see resolveAda),
                so a two-chip Full/Some split always left one chip
                permanently empty. One chip matching either status. */}
            <Chip
              label="♿ Accessible"
              pressed={filters.ada.length > 0}
              onClick={() => update({ ada: filters.ada.length > 0 ? [] : ['full', 'partial'] }, { push: true })}
            />
          </div>
        </fieldset>
      </div>

      <fieldset className="filter-group">
        <legend>Amenities</legend>
        <div className="chip-row">
          {AMENITIES.map((amenity) => (
            <Chip
              key={amenity.id}
              label={amenity.label}
              pressed={filters.amenity.includes(amenity.id)}
              onClick={() => update({ amenity: toggle(filters.amenity, amenity.id) }, { push: true })}
            />
          ))}
        </div>
      </fieldset>

      {/* A map display toggle, not a POPS filter — doesn't affect the
          result list/count, just whether the subway layer is drawn. */}
      <fieldset className="filter-group">
        <legend>Map</legend>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showTransit}
            onChange={(e) => onToggleTransit(e.target.checked)}
          />
          Show train stations
        </label>
      </fieldset>
    </div>
  )
}
