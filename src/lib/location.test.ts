import { formatCoords, requestLocation } from './location'

function mockGeolocation(impl: Geolocation['getCurrentPosition']) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: impl },
  })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation')
})

describe('formatCoords', () => {
  it('formats hemispheres', () => {
    expect(formatCoords(59.3293, 18.0686)).toBe('59.33° N, 18.07° E')
    expect(formatCoords(-33.8688, -70.6693)).toBe('33.87° S, 70.67° W')
  })
})

describe('requestLocation', () => {
  it('resolves with coordinates on success', async () => {
    mockGeolocation((ok) =>
      ok({
        coords: { latitude: 1, longitude: 2, accuracy: 3 },
      } as GeolocationPosition),
    )
    await expect(requestLocation()).resolves.toEqual({
      status: 'ok',
      latitude: 1,
      longitude: 2,
      accuracy: 3,
    })
  })

  it('resolves with a message when permission is denied', async () => {
    mockGeolocation((_ok, fail) => fail?.({ code: 1 } as GeolocationPositionError))
    await expect(requestLocation()).resolves.toEqual({
      status: 'error',
      message: 'Location permission denied.',
    })
  })

  it('resolves with a message when unsupported', async () => {
    await expect(requestLocation()).resolves.toMatchObject({ status: 'error' })
  })
})
