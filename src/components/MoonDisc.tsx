/** Moon disc drawn from the cycle phase (0 new → 0.5 full → 1 new). */
export function MoonDisc({ phase, waxing }: { phase: number; waxing: boolean }) {
  const r = 50
  const cos = Math.cos(phase * 2 * Math.PI)
  // terminator ellipse x-radius: +r at new moon, -r at full moon
  const rx = Math.abs(cos) * r
  const sweepLit = waxing ? 1 : 0 // lit limb on the right when waxing (northern hemisphere)
  const lit = cos > 0
  // lit half-disc plus terminator arc
  const d = `M ${r} 0 A ${r} ${r} 0 0 ${sweepLit} ${r} ${2 * r} A ${rx} ${r} 0 0 ${
    lit ? sweepLit : 1 - sweepLit
  } ${r} 0 Z`
  return (
    <svg viewBox="0 0 100 100" width="160" height="160" role="img" aria-label="Current moon">
      <circle cx={r} cy={r} r={r} fill="#1b1f2a" />
      <path d={d} fill="#f3efe0" />
    </svg>
  )
}
