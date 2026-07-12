import { useEffect, useMemo, useState } from 'react'
import snapshot from '../data/pops-snapshot.json'
import { toSpace, type PopsSpace, type RawPopsRecord } from '../lib/resolvers'

const LIVE_URL = 'https://data.cityofnewyork.us/resource/rvih-nhyn.json?$limit=600&$order=:id'

export interface UseSpacesResult {
  spaces: PopsSpace[]
  error: string | null
}

export function useSpaces(): UseSpacesResult {
  const [records, setRecords] = useState<RawPopsRecord[]>(snapshot as RawPopsRecord[])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(LIVE_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Live fetch failed: ${res.status}`)
        return res.json()
      })
      .then((live: RawPopsRecord[]) => {
        if (!cancelled && Array.isArray(live) && live.length > 0) {
          setRecords(live)
        }
      })
      .catch(() => {
        // Snapshot already loaded; live refresh is best-effort only.
        if (!cancelled && (snapshot as RawPopsRecord[]).length === 0) {
          setError('Unable to load POPS data. Please try again later.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const spaces = useMemo(() => records.map(toSpace), [records])

  return { spaces, error }
}
