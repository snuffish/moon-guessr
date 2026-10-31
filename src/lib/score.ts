export function parseGuess(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null
}

export function scoreGuess(guess: number, actual: number): number {
  return Math.max(0, Math.round(100 - 2 * Math.abs(guess - actual)))
}
