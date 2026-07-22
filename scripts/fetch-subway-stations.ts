// Pulls NYC's official subway stations dataset and writes a build-time
// snapshot — a separate, static layer from the POPS data (see fetch-data.ts).
// Run with: npm run fetch-subway-stations
import { writeFile } from 'node:fs/promises'

// "MTA Subway Stations" (data.ny.gov, id 39hk-dx4f) — one row per
// station-and-line stop, so multi-line transfer complexes (e.g. Times
// Sq-42 St) show up as several rows at effectively the same point.
// Deduped below by complex_id so the map gets one marker per physical
// station instead of one per line stopping there.
const SOURCE_URL = 'https://data.ny.gov/resource/39hk-dx4f.json?$limit=1000'
const OUT_PATH = new URL('../src/data/subway-stations-snapshot.json', import.meta.url)

interface RawStation {
  complex_id: string
  stop_name: string
  borough: string
  gtfs_latitude: string
  gtfs_longitude: string
  daytime_routes: string
}

interface Station {
  id: string
  name: string
  borough: string
  lat: number
  lng: number
  routes: string[]
}

async function main() {
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`Failed to fetch dataset: ${res.status}`)
  const rows = (await res.json()) as RawStation[]

  // A transfer complex (e.g. Times Sq-42 St) is several rows sharing
  // one complex_id, one per set of platforms — each with only ITS
  // OWN routes ("1 2 3" / "7" / "N Q R W" / "S" as four separate
  // rows there), so routes have to be unioned across every row in
  // the complex, not read off whichever row happens to dedupe first.
  const byComplex = new Map<string, Station>()
  for (const row of rows) {
    const routes = row.daytime_routes.split(' ').filter(Boolean)
    const existing = byComplex.get(row.complex_id)
    if (existing) {
      existing.routes = [...new Set([...existing.routes, ...routes])]
      continue
    }
    byComplex.set(row.complex_id, {
      id: row.complex_id,
      name: row.stop_name,
      borough: row.borough,
      lat: Number(row.gtfs_latitude),
      lng: Number(row.gtfs_longitude),
      routes,
    })
  }
  const stations = [...byComplex.values()]
  for (const station of stations) {
    station.routes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }

  await writeFile(OUT_PATH, JSON.stringify(stations, null, 2) + '\n')
  console.log(`Wrote ${stations.length} stations (from ${rows.length} rows) to ${OUT_PATH.pathname}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
