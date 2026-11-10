import { describe, expect, it } from 'vitest'
import { PR4_DATA, PR4_SCHEME, PR4_TIME, elementIds, elementP, solvePr4, type Scheme } from '../../../src/subjects/tnps/core/pr4'

describe('ТНПС ПР4: метод структурних схем', () => {
  const r = solvePr4(PR4_SCHEME, PR4_DATA, PR4_TIME)

  it('схема містить елементи 1–20 по одному разу', () => {
    expect([...elementIds(PR4_SCHEME)].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
  })

  it('показники елементів за 400 год', () => {
    expect(elementP({ p: 0.7 }, 400)).toBe(0.7)
    expect(elementP({ q: 0.13 }, 400)).toBeCloseTo(0.87, 12)
    expect(elementP({ lambda: 5 }, 400)).toBeCloseTo(Math.exp(-0.2), 12)
  })

  it('блоки схеми (звірено вручну)', () => {
    const byParts = (parts: string[]) => r.steps.find((s) => s.parts.join() === parts.join())!
    expect(byParts(['PI', 'P4']).p).toBeCloseTo(0.99355, 4) // (2∥3)∥4
    expect(byParts(['P6', 'P5']).p).toBeCloseTo(0.99137, 4)
    expect(byParts(['P18', 'P19']).p).toBeCloseTo(0.95604, 4)
  })

  it('імовірність безвідмовної роботи системи', () => {
    expect(r.p).toBeCloseTo(0.46847, 4)
    expect(r.steps.at(-1)).toMatchObject({ name: 'сист', type: 'ser', p: r.p })
  })

  it('прості схеми', () => {
    const d = { 1: { p: 0.9 }, 2: { p: 0.8 } }
    const s: Scheme = { type: 'ser', items: [{ type: 'el', id: 1 }, { type: 'el', id: 2 }] }
    const pr: Scheme = { type: 'par', items: [{ type: 'el', id: 1 }, { type: 'el', id: 2 }] }
    expect(solvePr4(s, d, 0).p).toBeCloseTo(0.72, 12)
    expect(solvePr4(pr, d, 0).p).toBeCloseTo(0.98, 12)
    expect(() => solvePr4(s, { 1: { p: 0.9 } }, 0)).toThrow(/2/)
  })
})
