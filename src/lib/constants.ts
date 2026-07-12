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
