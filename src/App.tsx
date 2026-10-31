import { useState } from 'react'
import { GuessForm } from './components/GuessForm'
import { Result } from './components/Result'
import { requestLocation, type LocationState } from './lib/location'
import { getMoonState, type MoonState } from './lib/moon'
import { scoreGuess } from './lib/score'
import { loadBest, saveBest } from './lib/storage'

interface Round {
  guess: number
  moon: MoonState
  score: number
  at: Date
}

export function App() {
  const [round, setRound] = useState<Round | null>(null)
  const [best, setBest] = useState<number | null>(loadBest)
  const [location, setLocation] = useState<LocationState>({ status: 'pending' })

  function submit(guess: number) {
    const at = new Date()
    const moon = getMoonState(at)
    const score = scoreGuess(guess, moon.percent)
    setRound({ guess, moon, score, at })
    setLocation({ status: 'pending' })
    requestLocation().then(setLocation)
    if (best === null || score > best) {
      setBest(score)
      saveBest(score)
    }
  }

  return (
    <main>
      <h1>Moon Guessr</h1>
      {round ? (
        <Result {...round} best={best} location={location} onAgain={() => setRound(null)} />
      ) : (
        <GuessForm onSubmit={submit} />
      )}
    </main>
  )
}
