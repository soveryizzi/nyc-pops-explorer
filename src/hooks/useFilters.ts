import { useMemo } from 'react'
import { matchesSearch, type PopsSpace } from '../lib/resolvers'
import type { FilterState } from './useUrlState'

export function useFilters(spaces: PopsSpace[], filters: FilterState): PopsSpace[] {
  return useMemo(() => {
    return spaces.filter((space) => {
      if (filters.borough.length && !filters.borough.includes(space.borough)) return false

      if (filters.type.length) {
        const matchesType = filters.type.some((t) => (t === 'indoor' ? space.indoor : !space.indoor))
        if (!matchesType) return false
      }

      if (filters.ada.length) {
        const matchesAda = filters.ada.some((a) => space.ada.status === a)
        if (!matchesAda) return false
      }

      if (filters.amenity.length) {
        const matchesAllAmenities = filters.amenity.every((a) => space.amenities.has(a))
        if (!matchesAllAmenities) return false
      }

      if (filters.q && !matchesSearch(space.raw, filters.q)) return false

      return true
    })
  }, [spaces, filters])
}

export function countActiveFilters(filters: FilterState): number {
  return filters.borough.length + filters.type.length + filters.ada.length + filters.amenity.length
}
