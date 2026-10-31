import { useState, type FormEvent } from 'react'
import { parseGuess } from '../lib/score'

export function GuessForm({ onSubmit }: { onSubmit: (guess: number) => void }) {
  const [value, setValue] = useState('50')
  const guess = parseGuess(value)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (guess !== null) onSubmit(guess)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="guess-number">How full is the moon right now? (%)</label>
      <input
        id="guess-number"
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <input
        type="range"
        aria-label="Guess slider"
        min={0}
        max={100}
        step={1}
        value={guess ?? 50}
        onChange={(e) => setValue(e.target.value)}
      />
      {guess === null && <p role="alert">Enter a number from 0 to 100.</p>}
      <button type="submit" disabled={guess === null}>
        Guess
      </button>
    </form>
  )
}
