import { AMENITIES, INDOOR_KEYWORDS, type AmenityKey } from './constants'

// Raw record shape from the Socrata POPS dataset. Fields are inconsistent —
// most are optional free text and must go through the resolvers below rather
// than being read directly.
export interface RawPopsRecord {
  pops_number?: string
  building_name?: string
  principal_public_space?: string
  space_name?: string
  pops_name?: string
  address_number?: string
  street_name?: string
  building_address_with_zip?: string
  borough_name?: string
  public_space_type?: string
  latitude?: string
  longitude?: string
  hour_of_access_required?: string
  amenities_required?: string
  physically_disabled?: string
  neighborhood?: string
  community_district?: string
  building_location?: string
  developer?: string
  zip_code?: string
  [key: string]: unknown
}

export type AdaStatus = 'full' | 'partial' | 'none' | 'unknown'

export interface AdaResult {
  status: AdaStatus
  label: string
  subtitle: string
}

function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const v of values) {
    if (v != null && v.trim() !== '') return v.trim()
  }
  return undefined
}

// Socrata addresses arrive ALL CAPS ("334 WALLABOUT STREET, Brooklyn, NY
// 11206"); convert to title case for display. Numbers keep ordinal
// suffixes lowercase (53RD → 53rd) and NY/NYC stay uppercase.
function titleCaseAddress(value: string): string {
  return value.replace(/[A-Za-z0-9']+/g, (word) => {
    if (word === 'NY' || word === 'NYC') return word
    if (/^\d/.test(word)) return word.toLowerCase()
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })
}

export function resolveId(record: RawPopsRecord): string {
  return firstNonEmpty(record.pops_number, record.building_address_with_zip) ?? ''
}

export function resolveName(record: RawPopsRecord): string {
  const addressNumberAndStreet = firstNonEmpty(record.address_number, record.street_name)
    ? `${record.address_number ?? ''} ${record.street_name ?? ''}`.trim()
    : undefined

  const name = firstNonEmpty(
    record.building_name,
    record.principal_public_space,
    record.space_name,
    record.pops_name,
  )
  if (name) return name

  // Address-shaped fallbacks get the same casing treatment as addresses.
  const addressName = firstNonEmpty(addressNumberAndStreet, record.building_address_with_zip)
  return addressName ? titleCaseAddress(addressName) : 'Unnamed space'
}

export function resolveAddress(record: RawPopsRecord): string {
  const address = firstNonEmpty(
    record.building_address_with_zip,
    firstNonEmpty(record.address_number, record.street_name)
      ? `${record.address_number ?? ''} ${record.street_name ?? ''}`.trim()
      : undefined,
  )
  return address ? titleCaseAddress(address) : ''
}

export function resolveBorough(record: RawPopsRecord): string {
  return record.borough_name ?? ''
}

export function resolveSpaceType(record: RawPopsRecord): string {
  return record.public_space_type ?? ''
}

export interface Coordinates {
  lat: number
  lng: number
}

export function resolveCoordinates(record: RawPopsRecord): Coordinates | null {
  const lat = parseFloat(record.latitude ?? '')
  const lng = parseFloat(record.longitude ?? '')
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  return { lat, lng }
}

export function resolveHours(record: RawPopsRecord): string {
  return firstNonEmpty(record.hour_of_access_required) ?? 'Not listed'
}

export function resolveApopsUrl(record: RawPopsRecord): string | null {
  if (!record.pops_number) return null
  return `https://apops.mas.org/pops/${record.pops_number.toLowerCase().trim()}/`
}

export function isIndoor(record: RawPopsRecord): boolean {
  const type = resolveSpaceType(record).toLowerCase()
  return INDOOR_KEYWORDS.some((keyword) => type.includes(keyword))
}

export function resolveAmenities(record: RawPopsRecord): Set<AmenityKey> {
  const text = (record.amenities_required ?? '').toLowerCase().trim()
  const result = new Set<AmenityKey>()
  if (!text || text === 'none') return result

  for (const { id, keywords } of AMENITIES) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      result.add(id)
    }
  }
  return result
}

export function resolveAda(record: RawPopsRecord): AdaResult {
  const raw = (record.physically_disabled ?? '').toLowerCase().trim()

  switch (raw) {
    case 'full':
      return { status: 'full', label: 'Fully accessible', subtitle: 'Full ADA compliance' }
    case 'full/partial':
    case 'partial/full':
      return { status: 'full', label: 'Partially accessible', subtitle: 'Full access in some areas' }
    case 'partial':
      return { status: 'partial', label: 'Partially accessible', subtitle: 'Some ADA features present' }
    case 'none':
    case 'no':
    case 'n/a':
    case 'na':
      return { status: 'none', label: 'Not accessible', subtitle: '' }
    case '':
    case 'unknown':
      return { status: 'unknown', label: 'Accessibility unknown', subtitle: '' }
    default:
      return { status: 'unknown', label: 'Accessibility unknown', subtitle: record.physically_disabled ?? '' }
  }
}

export function searchHaystack(record: RawPopsRecord): string {
  return [
    resolveName(record),
    resolveAddress(record),
    resolveBorough(record),
    record.street_name,
    record.neighborhood,
    record.community_district,
    resolveSpaceType(record),
    record.amenities_required,
    record.hour_of_access_required,
    record.building_location,
    record.developer,
    record.zip_code,
    record.pops_number,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function matchesSearch(record: RawPopsRecord, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return searchHaystack(record).includes(q)
}

export function googleMapsUrl(record: RawPopsRecord): string {
  const destination = `${resolveName(record)}, ${resolveAddress(record)}, NYC`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

export interface PopsSpace {
  id: string
  name: string
  address: string
  borough: string
  spaceType: string
  coordinates: Coordinates | null
  hours: string
  apopsUrl: string | null
  indoor: boolean
  amenities: Set<AmenityKey>
  ada: AdaResult
  raw: RawPopsRecord
}

export function toSpace(record: RawPopsRecord): PopsSpace {
  return {
    id: resolveId(record),
    name: resolveName(record),
    address: resolveAddress(record),
    borough: resolveBorough(record),
    spaceType: resolveSpaceType(record),
    coordinates: resolveCoordinates(record),
    hours: resolveHours(record),
    apopsUrl: resolveApopsUrl(record),
    indoor: isIndoor(record),
    amenities: resolveAmenities(record),
    ada: resolveAda(record),
    raw: record,
  }
}
