import { describe, expect, it } from 'vitest'
import { PR3_VARIANTS, solvePr3, validatePr3 } from '../../../src/subjects/tnps/core/pr3'

describe('ТНПС ПР3: ризик нерезервованої невідновлювальної системи', () => {
  const r = solvePr3(PR3_VARIANTS[0])

  it('варіант 1: інтенсивності відмов', () => {
    expect(r.lambdaSys0).toBeCloseTo(-Math.log(0.78) / 500, 12)
    expect(r.lambda).toBeCloseTo(9.9381e-5, 8)
    expect(r.lambdaSys).toBeCloseTo(3.97538e-3, 8)
    expect(r.T).toBeCloseTo(251.56, 1)
  })

  it('варіант 1: таблиця 0…300 год з кроком 50', () => {
    expect(r.rows.map((x) => x.t)).toEqual([0, 50, 100, 150, 200, 250, 300])
    expect(r.rows[0]).toEqual({ t: 0, p: 1, risk: 0, riskSum: 0, g: 1 })
    const last = r.rows.at(-1)!
    expect(last.risk).toBeCloseTo(696.56, 1)
    expect(last.riskSum).toBeCloseTo(1175.0, 0)
    expect(last.g).toBeCloseTo(0.5928, 3)
    expect(r.rows[1].g).toBeCloseTo(0.9092, 3)
  })

  it('функція ризику спадає, R(t) ≤ R*(t)', () => {
    for (let i = 1; i < r.rows.length; i++) {
      expect(r.rows[i].g).toBeLessThan(r.rows[i - 1].g)
      expect(r.rows[i].risk).toBeLessThanOrEqual(r.rows[i].riskSum)
    }
  })

  it('усі варіанти розв’язуються', () => {
    for (const v of PR3_VARIANTS) expect(validatePr3(v)).toEqual([])
    expect(validatePr3({ ...PR3_VARIANTS[0], p0: 1 })).toEqual(['P(t₀) — число між 0 і 1'])
    expect(() => solvePr3({ ...PR3_VARIANTS[0], n: 2.5 })).toThrow()
  })
})
