import { AMENITIES, BOROUGHS } from '../lib/constants'
import type { AdaFilter, FilterState, TypeFilter, UseUrlStateResult } from '../hooks/useUrlState'

interface FilterPanelProps {
  filters: FilterState
  update: UseUrlStateResult['update']
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

export function FilterPanel({ filters, update }: FilterPanelProps) {
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

      <fieldset className="filter-group">
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

      <fieldset className="filter-group">
        <legend>Accessibility</legend>
        <div className="chip-row">
          {(['full', 'partial'] as AdaFilter[]).map((ada) => (
            <Chip
              key={ada}
              label={ada === 'full' ? '♿ Full' : '♿ Some'}
              pressed={filters.ada.includes(ada)}
              onClick={() => update({ ada: toggle(filters.ada, ada) }, { push: true })}
            />
          ))}
        </div>
      </fieldset>

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
    </div>
  )
}
