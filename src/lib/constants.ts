export const MAP_STYLE_URL = '/map-style.json'

export const INITIAL_VIEW_STATE = {
  latitude: 40.745,
  longitude: -73.985,
  zoom: 12,
}

export const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'] as const

export const AMENITY_KEYWORDS = {
  seating: ['seating', 'seat'],
  tables: ['table'],
  restrooms: ['restroom', 'bathroom', 'toilet'],
  foodService: ['food', 'café', 'cafe', 'kiosk', 'vending', 'restaurant'],
  waterFeature: ['water feature', 'fountain', 'waterfall'],
  treesPlanting: ['trees', 'planting', 'landscap', 'shrub'],
  artwork: ['artwork', 'art', 'sculpture'],
  bicycleParking: ['bicycle', 'bike'],
  climateControl: ['climate', 'heated', 'air condition', 'cooled'],
  elevator: ['elevator'],
  escalator: ['escalator'],
  lighting: ['lighting', 'lit'],
  retailFrontage: ['retail'],
  subwayAccess: ['subway'],
  programs: ['program'],
  twentyFourHourAccess: ['24 hour', '24-hour', '24hours', 'open 24'],
} as const

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
