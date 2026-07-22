export const MAP_STYLE_URL = '/map-style.json'

export const INITIAL_VIEW_STATE = {
  latitude: 40.745,
  longitude: -73.985,
  zoom: 12,
}

export const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'] as const

// Keep in sync with the max-width used in styles/components.css
export const MOBILE_MEDIA_QUERY = '(max-width: 640px)'

export interface AmenityDef {
  id: string
  label: string
  keywords: readonly string[]
}

// Order matches the brief's amenity table; drives both matching and chip/checklist display order.
export const AMENITIES = [
  { id: 'seating', label: 'Seating', keywords: ['seating', 'seat'] },
  { id: 'tables', label: 'Tables', keywords: ['table'] },
  { id: 'restrooms', label: 'Restrooms', keywords: ['restroom', 'bathroom', 'toilet'] },
  { id: 'food-service', label: 'Food service', keywords: ['food', 'café', 'cafe', 'kiosk', 'vending', 'restaurant'] },
  { id: 'water-feature', label: 'Water feature', keywords: ['water feature', 'fountain', 'waterfall'] },
  { id: 'trees-planting', label: 'Trees / planting', keywords: ['trees', 'planting', 'landscap', 'shrub'] },
  { id: 'artwork', label: 'Artwork', keywords: ['artwork', 'art', 'sculpture'] },
  { id: 'bicycle-parking', label: 'Bicycle parking', keywords: ['bicycle', 'bike'] },
  { id: 'climate-control', label: 'Climate control', keywords: ['climate', 'heated', 'air condition', 'cooled'] },
  { id: 'elevator', label: 'Elevator', keywords: ['elevator'] },
  { id: 'escalator', label: 'Escalator', keywords: ['escalator'] },
  { id: 'lighting', label: 'Lighting', keywords: ['lighting', 'lit'] },
  { id: 'retail-frontage', label: 'Retail frontage', keywords: ['retail'] },
  { id: 'subway-access', label: 'Subway access', keywords: ['subway'] },
  { id: 'programs', label: 'Programs', keywords: ['program'] },
  { id: '24-hour-access', label: '24-hour access', keywords: ['24 hour', '24-hour', '24hours', 'open 24'] },
] as const satisfies readonly AmenityDef[]

export type AmenityKey = (typeof AMENITIES)[number]['id']

// Official MTA subway line colors (per MTA branding guidelines) —
// text color follows MTA's own bullet design: black on the lighter
// yellow/grey lines, white everywhere else.
const MTA_LINE_GROUPS: { routes: string[]; bg: string; text: string }[] = [
  { routes: ['1', '2', '3'], bg: '#EE352E', text: '#ffffff' },
  { routes: ['4', '5', '6', '6X'], bg: '#00933C', text: '#ffffff' },
  { routes: ['7', '7X'], bg: '#B933AD', text: '#ffffff' },
  { routes: ['A', 'C', 'E'], bg: '#0039A6', text: '#ffffff' },
  { routes: ['B', 'D', 'F', 'M'], bg: '#FF6319', text: '#ffffff' },
  { routes: ['G'], bg: '#6CBE45', text: '#ffffff' },
  { routes: ['J', 'Z'], bg: '#996633', text: '#ffffff' },
  { routes: ['L'], bg: '#A7A9AC', text: '#000000' },
  { routes: ['N', 'Q', 'R', 'W'], bg: '#FCCC0A', text: '#000000' },
  { routes: ['S'], bg: '#808183', text: '#ffffff' },
]

const ROUTE_COLORS = new Map(MTA_LINE_GROUPS.flatMap((group) => group.routes.map((route) => [route, group])))

const DEFAULT_ROUTE_COLOR = { bg: '#6E6E6E', text: '#ffffff' }

export function routeColor(route: string): { bg: string; text: string } {
  return ROUTE_COLORS.get(route) ?? DEFAULT_ROUTE_COLOR
}

export const INDOOR_KEYWORDS = [
  'atrium',
  'arcade',
  'gallery',
  'covered',
  'interior',
  'enclosed',
  'lobby',
  'galleria',
]
