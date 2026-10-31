export type LocationState =
  | { status: 'pending' }
  | { status: 'ok'; latitude: number; longitude: number; accuracy: number }
  | { status: 'error'; message: string }

const ERRORS: Record<number, string> = {
  1: 'Location permission denied.',
  2: 'Location unavailable.',
  3: 'Location request timed out.',
}

/** Asks the browser for the device position (prompts the user the first time). Never rejects. */
export function requestLocation(): Promise<LocationState> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({
      status: 'error',
      message: 'Location not supported by this browser.',
    })
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          status: 'ok',
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      (err) =>
        resolve({
          status: 'error',
          message: ERRORS[err.code] ?? 'Location unavailable.',
        }),
      { timeout: 10_000, maximumAge: 10 * 60_000 },
    )
  })
}

/** 59.3293, 18.0686 → "59.33° N, 18.07° E" */
export function formatCoords(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(2)}° ${latitude >= 0 ? 'N' : 'S'}`
  const lng = `${Math.abs(longitude).toFixed(2)}° ${longitude >= 0 ? 'E' : 'W'}`
  return `${lat}, ${lng}`
}
