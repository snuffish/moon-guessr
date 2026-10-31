import { parseGuess, scoreGuess } from './score'

describe('scoreGuess', () => {
  it('is 100 for an exact guess', () => expect(scoreGuess(40, 40)).toBe(100))
  it('is 0 at 50+ points off', () => {
    expect(scoreGuess(0, 50)).toBe(0)
    expect(scoreGuess(0, 100)).toBe(0)
  })
})

describe('parseGuess', () => {
  it.each(['', ' ', 'abc', '-1', '101', 'NaN'])('rejects %j', (raw) =>
    expect(parseGuess(raw)).toBeNull(),
  )
  it('accepts bounds', () => {
    expect(parseGuess('0')).toBe(0)
    expect(parseGuess('100')).toBe(100)
  })
})
