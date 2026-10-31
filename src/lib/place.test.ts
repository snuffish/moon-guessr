import { formatPlace, lookupPlace } from './place'

const fetchMock = vi.fn()

beforeEach(() => {
  localStorage.clear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as Response

describe('formatPlace', () => {
  it('prefers city, falls back to town/village', () => {
    expect(formatPlace({ city: 'Stockholm', country: 'Sweden' })).toBe('Stockholm, Sweden')
    expect(formatPlace({ village: 'Abisko', country: 'Sweden' })).toBe('Abisko, Sweden')
    expect(formatPlace({})).toBeNull()
  })
})

describe('lookupPlace', () => {
  it('queries Nominatim with rounded coords and caches the result', async () => {
    fetchMock.mockResolvedValue(ok({ address: { city: 'Stockholm', country: 'Sweden' } }))

    await expect(lookupPlace(59.32931, 18.06861)).resolves.toBe('Stockholm, Sweden')
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/reverse')
    expect(url.searchParams.get('lat')).toBe('59.33')
    expect(url.searchParams.get('lon')).toBe('18.07')

    await expect(lookupPlace(59.3289, 18.0702)).resolves.toBe('Stockholm, Sweden')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns null on HTTP or network errors and does not cache', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false } as Response)
    await expect(lookupPlace(1, 2)).resolves.toBeNull()
    fetchMock.mockRejectedValueOnce(new TypeError('offline'))
    await expect(lookupPlace(1, 2)).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
