import { getMoonIllumination, getMoonPosition, getMoonTimes } from 'suncalc'

export interface MoonState {
  /** Illuminated percentage, 0–100, one decimal. */
  percent: number
  /** Cycle position, 0 (new) → 0.5 (full) → 1 (new). */
  phase: number
  waxing: boolean
}

export function getMoonState(date: Date = new Date()): MoonState {
  const { fraction, phase, waxing } = getMoonIllumination(date)
  return { percent: Math.round(fraction * 1000) / 10, phase, waxing }
}

export interface MoonSky {
  up: boolean
  /** Degrees above (+) or below (−) the horizon. */
  altitude: number
  direction: Compass
  /** First moonrise after `at` within two days, if any. */
  nextRise?: Date
  /** First moonset after `at` within two days, if any. */
  nextSet?: Date
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
export type Compass = (typeof COMPASS)[number]

/** Azimuth in degrees clockwise from north → 8-point compass. */
export function toCompass(azimuth: number): Compass {
  const normalized = ((azimuth % 360) + 360) % 360
  return COMPASS[Math.round(normalized / 45) % 8]
}

const DAY_MS = 24 * 60 * 60 * 1000

/** `utcOffset` is minutes east of UTC; it sets which civil days are searched. */
export function getMoonSky(
  at: Date,
  lat: number,
  lng: number,
  utcOffset: number = -at.getTimezoneOffset(),
): MoonSky {
  const { altitude, azimuth } = getMoonPosition(at, lat, lng)
  const days = [at, new Date(at.getTime() + DAY_MS)].map((d) => getMoonTimes(d, lat, lng, utcOffset))
  const firstAfter = (events: (Date | undefined)[]) =>
    events.filter((e): e is Date => e !== undefined && e > at).sort((a, b) => +a - +b)[0]

  return {
    up: altitude > 0,
    altitude,
    direction: toCompass(azimuth),
    nextRise: firstAfter(days.map((d) => d.rise)),
    nextSet: firstAfter(days.map((d) => d.set)),
  }
}
