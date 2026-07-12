// Fetches OpenFreeMap's "liberty" style and recolors it to the app palette.
// Run with: npm run build-map-style
import { writeFile } from 'node:fs/promises'

const SOURCE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const OUT_PATH = new URL('../public/map-style.json', import.meta.url)

const PALETTE = {
  land: '#f4f1e8',
  landcoverGreen: '#d3e6cf',
  park: '#c7ddc0',
  water: '#cfe3e6',
  building: '#e9e4d8',
  roadMinor: '#ffffff',
  roadMajor: '#fdf6de',
  roadCasing: '#d7d0bd',
  boundary: '#c8b98e',
  labelText: '#45534f',
  labelHalo: '#f4f1e8',
}

// Recursively replace a paint color value regardless of nesting (plain string
// or a MapLibre expression like interpolate/rgba) by key match on layer id/type.
function recolorLayer(layer: any) {
  const id: string = layer.id ?? ''
  const type: string = layer.type

  const setPaint = (key: string, value: string) => {
    layer.paint = layer.paint ?? {}
    if (key in layer.paint) layer.paint[key] = value
  }

  if (id === 'background') setPaint('background-color', PALETTE.land)
  else if (id.startsWith('landcover') || id.startsWith('landuse')) {
    if (type === 'fill') setPaint('fill-color', PALETTE.landcoverGreen)
  } else if (id.startsWith('park')) {
    if (type === 'fill') setPaint('fill-color', PALETTE.park)
    if (type === 'line') setPaint('line-color', PALETTE.park)
  } else if (id.startsWith('water')) {
    if (type === 'fill') setPaint('fill-color', PALETTE.water)
  } else if (id.startsWith('building')) {
    if (type === 'fill') setPaint('fill-color', PALETTE.building)
  } else if (id.startsWith('boundary')) {
    if (type === 'line') setPaint('line-color', PALETTE.boundary)
  } else if (id.startsWith('road') || id.startsWith('bridge') || id.startsWith('tunnel')) {
    if (type === 'line') {
      const isCasing = id.includes('case') || id.includes('casing')
      const isMajor = /motorway|trunk|primary/.test(id)
      setPaint('line-color', isCasing ? PALETTE.roadCasing : isMajor ? PALETTE.roadMajor : PALETTE.roadMinor)
    }
  } else if (type === 'symbol') {
    setPaint('text-color', PALETTE.labelText)
    setPaint('text-halo-color', PALETTE.labelHalo)
  }
}

async function main() {
  const res = await fetch(SOURCE_STYLE_URL)
  if (!res.ok) throw new Error(`Failed to fetch base style: ${res.status}`)
  const style = (await res.json()) as { layers?: any[]; [key: string]: unknown }

  for (const layer of style.layers ?? []) {
    recolorLayer(layer)
  }

  await writeFile(OUT_PATH, JSON.stringify(style, null, 2) + '\n')
  console.log(`Wrote recolored style to ${OUT_PATH.pathname}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
