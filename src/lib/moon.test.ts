import { getMoonSky, getMoonState, toCompass } from './moon'

// Reference syzygies (UTC): new moon 2024-01-11 11:57, full moon 2024-01-25 17:54
describe('getMoonState', () => {
  it('is ~0% at new moon', () => {
    expect(getMoonState(new Date('2024-01-11T11:57:00Z')).percent).toBeLessThan(2)
  })
  it('is ~100% at full moon', () => {
    expect(getMoonState(new Date('2024-01-25T17:54:00Z')).percent).toBeGreaterThan(98)
  })
  it('waxes before full and wanes after', () => {
    expect(getMoonState(new Date('2024-01-20T00:00:00Z')).waxing).toBe(true)
    expect(getMoonState(new Date('2024-02-01T00:00:00Z')).waxing).toBe(false)
  })
  it('stays within 0–100', () => {
    const { percent } = getMoonState()
    expect(percent).toBeGreaterThanOrEqual(0)
    expect(percent).toBeLessThanOrEqual(100)
  })
})

// Stockholm; expected times cross-checked against USNO rstt/oneday (set 13:03Z, rise 18:43Z on 2026-10-31)
const STHLM = [59.33, 18.07] as const
const CET = 60
const near = (actual: Date | undefined, iso: string) =>
  expect(Math.abs(actual!.getTime() - Date.parse(iso))).toBeLessThan(60_000)

describe('getMoonSky', () => {
  it('reports position and next events', () => {
    const at = new Date('2026-10-31T02:00:00Z')
    const sky = getMoonSky(at, ...STHLM, CET)
    expect(sky.up).toBe(true)
    expect(sky.altitude).toBeCloseTo(54, 0)
    expect(sky.direction).toBe('SE')
    near(sky.nextSet, '2026-10-31T13:03:00Z')
    near(sky.nextRise, '2026-10-31T18:42:39Z')
  })

  it("skips today's events that already passed", () => {
    const at = new Date('2026-10-31T15:00:00Z')
    const sky = getMoonSky(at, ...STHLM, CET)
    near(sky.nextSet, '2026-11-01T13:14:11Z')
    near(sky.nextRise, '2026-10-31T18:42:39Z')
    expect(sky.nextSet!.getTime()).toBeGreaterThan(at.getTime())
  })

  it('returns no events when the moon stays up or down (Svalbard)', () => {
    const up = getMoonSky(new Date('2026-11-23T12:00:00Z'), 78.2, 15.6, CET)
    expect(up).toMatchObject({ up: true, nextRise: undefined, nextSet: undefined })
    const down = getMoonSky(new Date('2026-11-10T12:00:00Z'), 78.2, 15.6, CET)
    expect(down).toMatchObject({ up: false, nextRise: undefined, nextSet: undefined })
  })
})

describe('toCompass', () => {
  it.each([
    [0, 'N'],
    [22.4, 'N'],
    [44, 'NE'],
    [152, 'SE'],
    [180, 'S'],
    [338, 'N'],
    [359.9, 'N'],
    [-90, 'W'],
  ] as const)('%d° → %s', (azimuth, expected) => expect(toCompass(azimuth)).toBe(expected))
})
