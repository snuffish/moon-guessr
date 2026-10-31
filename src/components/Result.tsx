import type { LocationState } from '../lib/location'
import type { MoonState } from '../lib/moon'
import { LocationInfo } from './LocationInfo'
import { MoonDisc } from './MoonDisc'

interface Props {
  guess: number
  moon: MoonState
  score: number
  best: number | null
  location: LocationState
  at: Date
  onAgain: () => void
}

export function Result({ guess, moon, score, best, location, at, onAgain }: Props) {
  const error = Math.abs(guess - moon.percent)
  return (
    <section aria-live="polite">
      <MoonDisc phase={moon.phase} waxing={moon.waxing} />
      <p>
        Actual: <strong>{moon.percent}%</strong> ({moon.waxing ? 'waxing' : 'waning'})
      </p>
      <p>
        You guessed {guess}% — off by {error.toFixed(1)} points.
      </p>
      <p>
        Score: <strong>{score}</strong>
        {best !== null && <> · Best: {best}</>}
      </p>
      <LocationInfo location={location} at={at} />
      <button type="button" onClick={onAgain}>
        Play again
      </button>
    </section>
  )
}
