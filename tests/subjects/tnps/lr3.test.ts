import { describe, expect, it } from 'vitest'
import {
  LR3_VARIANTS,
  meanTime,
  pGeneral,
  pSeparate,
  pSliding,
  pSubstitution,
  solveLr3,
  validateLr3,
} from '../../../src/subjects/tnps/core/lr3'

describe('ТНПС ЛР3: резервування', () => {
  it('приклади з лекції 6', () => {
    // загальне, λ = 0,05, m = 2: T = (1/λ)(1 + 1/2 + 1/3) = 36,6 год
    expect(meanTime('general', [0.05], 2)).toBeCloseTo(36.667, 2)
    // заміщенням, λ = 0,05, m = 2: P = e^(−0,05t)(1 + 0,05t + (0,05t)²/2)
    expect(pSubstitution([0.05], 2, 20)).toBeCloseTo(Math.exp(-1) * 2.5, 12)
    // ковзне, 7 елементів, 3 резервні, λ = 0,01: T = (1/λ)(m+1)/(n−m) = 100 год
    const seven = Array(7).fill(0.01)
    expect(meanTime('sliding', seven, 3)).toBeCloseTo(100, 9)
    expect(pSliding(seven, 3, 100)).toBeCloseTo(Math.exp(-4) * (1 + 4 + 8 + 64 / 6), 12)
  })

  const r = solveLr3(LR3_VARIANTS[0])
  const T = Object.fromEntries(r.curves.map((c) => [c.kind, c.T]))

  it('варіант 1: λc і середній час для чотирьох видів', () => {
    expect(r.lambdaC).toBeCloseTo(0.0237, 12)
    expect(r.T0).toBeCloseTo(42.19, 2)
    expect(T.general).toBeCloseTo(96.34, 2)
    expect(T.separate).toBeCloseTo(276.7, 0)
    expect(T.substitution).toBeCloseTo(210.97, 2)
    expect(T.sliding).toBeCloseTo(421.94, 2)
  })

  it('чисельний інтеграл збігається із закритими формулами', () => {
    const lambda = r.lambda
    const h = 0.05
    let s = 0
    for (let t = h / 2; t < 3000; t += h) s += pGeneral(lambda, 4, t) * h
    expect(s).toBeCloseTo(T.general, 2)
    // одне «роздільне» з одним елементом = загальне
    expect(meanTime('separate', [0.01], 3)).toBeCloseTo(meanTime('general', [0.01], 3), 4)
  })

  it('варіант 1: криві 0…500 год', () => {
    expect(r.times).toHaveLength(21)
    for (const c of r.curves) {
      expect(c.p[0]).toBe(1)
      for (let i = 1; i < c.p.length; i++) expect(c.p[i]).toBeLessThanOrEqual(c.p[i - 1])
    }
    const at100 = Object.fromEntries(r.curves.map((c) => [c.kind, c.p[4]]))
    expect(at100.general).toBeCloseTo(0.388, 3)
    expect(at100.separate).toBeCloseTo(pSeparate(r.lambda, 4, 100), 12)
    expect(at100.substitution).toBeCloseTo(0.908, 3)
  })

  it('усі варіанти; перевірка даних', () => {
    expect(LR3_VARIANTS).toHaveLength(14)
    for (const v of LR3_VARIANTS) expect(validateLr3(v)).toEqual([])
    expect(validateLr3({ lambda: [1, 2], m: 2 })).toHaveLength(1)
    expect(validateLr3({ lambda: [1, 2, 3], m: 0 })).toEqual(['Кратність m — ціле число від 1'])
    expect(() => solveLr3({ lambda: [1, -2, 3], m: 1 })).toThrow()
  })
})
