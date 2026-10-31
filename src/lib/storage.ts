const KEY = 'moon-guessr:best'

export function loadBest(): number | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === null ? null : Number(v)
  } catch {
    return null
  }
}

export function saveBest(score: number): void {
  try {
    localStorage.setItem(KEY, String(score))
  } catch {
    // storage unavailable (private mode); best score stays in memory only
  }
}
