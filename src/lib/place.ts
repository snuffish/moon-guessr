// OSM Nominatim reverse geocoding. Policy: max 1 req/s, results must be cached, attribution required.
// https://operations.osmfoundation.org/policies/nominatim/
const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse'
const CACHE_PREFIX = 'moon-guessr:place:'

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  country?: string
}

/** Rounded to ~1 km: enough for a city name, and a stable cache key. */
const round = (n: number) => n.toFixed(2)

function readCache(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeCache(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable; the next guess looks it up again
  }
}

export function formatPlace(address: NominatimAddress): string | null {
  const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county
  const parts = [city, address.country].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

/** "Stockholm, Sweden", or null when the lookup fails or finds nothing. Never rejects. */
export async function lookupPlace(latitude: number, longitude: number, signal?: AbortSignal): Promise<string | null> {
  const lat = round(latitude)
  const lon = round(longitude)
  const key = `${CACHE_PREFIX}${lat},${lon}`
  const cached = readCache(key)
  if (cached) return cached

  const params = new URLSearchParams({ lat, lon, format: 'jsonv2', zoom: '10' })
  if (typeof navigator !== 'undefined' && navigator.language) params.set('accept-language', navigator.language)

  try {
    const res = await fetch(`${ENDPOINT}?${params}`, { signal })
    if (!res.ok) return null
    const body: { address?: NominatimAddress } = await res.json()
    const place = body.address ? formatPlace(body.address) : null
    if (place) writeCache(key, place)
    return place
  } catch {
    return null
  }
}
