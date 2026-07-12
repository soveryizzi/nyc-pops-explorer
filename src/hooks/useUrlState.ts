import { useCallback, useEffect, useState } from 'react'
import type { AmenityKey } from '../lib/constants'

export type TypeFilter = 'indoor' | 'outdoor'
export type AdaFilter = 'full' | 'partial'

export interface FilterState {
  borough: string[]
  type: TypeFilter[]
  amenity: AmenityKey[]
  ada: AdaFilter[]
  q: string
  space: string | null
}

function parseList(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function parseState(search: string): FilterState {
  const params = new URLSearchParams(search)
  return {
    borough: parseList(params.get('borough')),
    type: parseList(params.get('type')) as TypeFilter[],
    amenity: parseList(params.get('amenity')) as AmenityKey[],
    ada: parseList(params.get('ada')) as AdaFilter[],
    q: params.get('q') ?? '',
    space: params.get('space'),
  }
}

function serializeState(state: FilterState): string {
  const params = new URLSearchParams()
  if (state.borough.length) params.set('borough', state.borough.join(','))
  if (state.type.length) params.set('type', state.type.join(','))
  if (state.amenity.length) params.set('amenity', state.amenity.join(','))
  if (state.ada.length) params.set('ada', state.ada.join(','))
  if (state.q) params.set('q', state.q)
  if (state.space) params.set('space', state.space)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export interface UseUrlStateResult {
  filters: FilterState
  update: (patch: Partial<FilterState>, options?: { push?: boolean }) => void
}

export function useUrlState(): UseUrlStateResult {
  const [filters, setFilters] = useState<FilterState>(() => parseState(window.location.search))

  useEffect(() => {
    const handlePopState = () => setFilters(parseState(window.location.search))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // pushState/replaceState is a side effect, so it must not live inside the
  // setFilters updater — React (in StrictMode) invokes updater functions
  // twice in dev to surface impurities, which would push two history entries
  // per action. Compute `next` from the current `filters` closure instead
  // and call setFilters with a plain value.
  const update = useCallback(
    (patch: Partial<FilterState>, options: { push?: boolean } = {}) => {
      const next = { ...filters, ...patch }
      const url = `${window.location.pathname}${serializeState(next)}`
      if (options.push) {
        window.history.pushState(null, '', url)
      } else {
        window.history.replaceState(null, '', url)
      }
      setFilters(next)
    },
    [filters],
  )

  return { filters, update }
}
