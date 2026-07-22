// Fetches OpenFreeMap's "liberty" style and recolors it to the app palette.
// Run with: npm run build-map-style
import { writeFile } from 'node:fs/promises'

const SOURCE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const OUT_PATH = new URL('../public/map-style.json', import.meta.url)

// Field Guide palette — keep in sync with the --map-* tokens in src/styles/tokens.css
const PALETTE = {
  land: '#f4f2e6',
  landcoverGreen: '#d8e5cc',
  park: '#c8dcba',
  water: '#c7dfe3',
  building: '#e9e6d8',
  roadMinor: '#ffffff',
  roadMajor: '#faf3dc',
  roadCasing: '#d9d5c2',
  boundary: '#c2b896',
  labelText: '#47523f',
  labelHalo: '#f4f2e6',
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

// OpenMapTiles' poi source-layer tags each point with a "class"
// property (hospital, rail, school, restaurant, ...) using the same
// taxonomy as the landuse layer's polygons. The generic rank-tier
// poi_r*/poi_transit layers don't filter most of these out, so their
// icons/labels render mixed in with everything else — this appends
// "not <class>" clauses to any point-symbol layer's filter so the
// given classes don't, without touching any other POI class sharing
// that same layer. Excludes: hospital (just unwanted), rail and bus
// (the app renders its own subway station layer — see TransitMarker
// — so the base map's own transit icons/names would be a duplicate),
// airport (just unwanted, same as hospital).
const EXCLUDED_POI_CLASSES = ['hospital', 'rail', 'bus', 'airport']

function excludeSelectedPois(layer: any) {
  // Scoped to the poi source-layer specifically — "class" means
  // something different on every other source-layer (a place's
  // class is city/town/village, a waterway's is river/canal, etc.),
  // so applying these exclusions there was always a harmless no-op,
  // just needless filter bloat on every symbol layer in the style.
  if (layer.type !== 'symbol' || !layer.filter || layer['source-layer'] !== 'poi') return
  const exclusions = EXCLUDED_POI_CLASSES.map((cls) => ['!=', ['get', 'class'], cls])
  layer.filter = ['all', layer.filter, ...exclusions]
}

// Water body/waterway name labels ("Hudson River", "East River", ...),
// the separate major-airport code/name label layer (JFK, LGA, EWR —
// a different, non-poi layer from the poi_transit "airport" class
// excluded above), and poi_transit itself: its only three classes
// are airport/bus/rail, all excluded above, so it can no longer ever
// match anything — dropped outright rather than left as dead weight.
const DROPPED_LAYER_IDS = new Set([
  'landuse_hospital',
  'water_name_point_label',
  'water_name_line_label',
  'waterway_line_label',
  'airport',
  'poi_transit',
])

async function main() {
  const res = await fetch(SOURCE_STYLE_URL)
  if (!res.ok) throw new Error(`Failed to fetch base style: ${res.status}`)
  const style = (await res.json()) as { layers?: any[]; [key: string]: unknown }

  // Drop 3D building extrusions (flat map), the hospital land-use fill
  // (a distinct colored blob over hospital campuses that reads as
  // "there's a medical center here"), and water body/waterway names.
  style.layers = (style.layers ?? []).filter(
    (layer) => layer.type !== 'fill-extrusion' && !DROPPED_LAYER_IDS.has(layer.id),
  )

  for (const layer of style.layers) {
    recolorLayer(layer)
    excludeSelectedPois(layer)
  }

  await writeFile(OUT_PATH, JSON.stringify(style, null, 2) + '\n')
  console.log(`Wrote recolored style to ${OUT_PATH.pathname}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
