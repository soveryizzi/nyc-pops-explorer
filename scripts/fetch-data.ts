// Pulls the full NYC POPS dataset and writes a build-time snapshot.
// Run with: npm run fetch-data
import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://data.cityofnewyork.us/resource/rvih-nhyn.json?$limit=600&$order=:id'
const OUT_PATH = new URL('../src/data/pops-snapshot.json', import.meta.url)

async function main() {
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`Failed to fetch dataset: ${res.status}`)
  const records = (await res.json()) as unknown[]

  await writeFile(OUT_PATH, JSON.stringify(records, null, 2) + '\n')
  console.log(`Wrote ${records.length} records to ${OUT_PATH.pathname}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
