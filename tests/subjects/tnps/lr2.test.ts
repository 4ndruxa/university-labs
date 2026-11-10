import { describe, expect, it } from 'vitest'
import { LR2_VARIANTS, lr2Source, readiness, solveLr2, validateLr2 } from '../../../src/subjects/tnps/core/lr2'

describe('ТНПС ЛР2: готовність і ризик відновлювальної системи', () => {
  const r = solveLr2(LR2_VARIANTS[0])

  it('варіант 1: показники надійності (звірено вручну)', () => {
    expect(r.lambdaC).toBeCloseTo(1.78e-4, 10)
    expect(r.sumRatio).toBeCloseTo(5.38512, 4)
    expect(r.muC).toBeCloseTo(3.3054e-5, 8)
    expect(r.T).toBeCloseTo(5617.98, 1)
    expect(r.kr).toBeCloseTo(0.15661, 4)
  })

  it('варіант 1: функція готовності спадає від 1 до Kr', () => {
    expect(r.points[0]).toEqual({ t: 0, kr: 1 })
    expect(r.points.at(-1)!.t).toBe(300)
    expect(r.points.at(-1)!.kr).toBeCloseTo(0.9483, 4)
    for (let i = 1; i < r.points.length; i++) expect(r.points[i].kr).toBeLessThan(r.points[i - 1].kr)
    expect(readiness(r.lambdaC, r.muC, 1e9)).toBeCloseTo(r.kr, 10)
  })

  it('варіант 1: ризик між двосторонніми оцінками і в межах допустимого', () => {
    expect(r.sumLr).toBeCloseTo(0.14945, 6)
    expect(r.riskLow).toBeCloseTo(28.086, 2)
    expect(r.riskHigh).toBeCloseTo(179.34, 2)
    expect(r.risk).toBeGreaterThan(r.riskLow)
    expect(r.risk).toBeLessThan(r.riskHigh)
    expect(r.acceptable).toBe(true)
  })

  it('точний ризик — інтеграл Kr(t), перевірка чисельно', () => {
    const d = LR2_VARIANTS[0]
    const n = 20000
    const h = d.tn / n
    let s = 0
    for (let i = 0; i < n; i++) s += readiness(r.lambdaC, r.muC, (i + 0.5) * h) * h
    expect(r.risk).toBeCloseTo(s * r.sumLr, 3)
  })

  it('24 варіанти; 11–24 складено з перших десяти за таблицею методички', () => {
    expect(LR2_VARIANTS).toHaveLength(24)
    expect(lr2Source(11)).toEqual({ lambda: 1, mu: 2, r: 3, tn: 4, rd: 5 })
    expect(lr2Source(24)).toEqual({ lambda: 4, mu: 6, r: 8, tn: 10, rd: 2 })
    expect(lr2Source(10)).toBeNull()
    const v11 = LR2_VARIANTS[10]
    expect(v11.lambda).toEqual(LR2_VARIANTS[0].lambda)
    expect(v11.mu).toEqual(LR2_VARIANTS[1].mu)
    expect(v11.r).toEqual(LR2_VARIANTS[2].r)
    expect(v11.tn).toBe(LR2_VARIANTS[3].tn)
    expect(v11.rd).toBe(LR2_VARIANTS[4].rd)
    for (const v of LR2_VARIANTS) {
      expect(validateLr2(v)).toEqual([])
      expect([v.lambda.length, v.mu.length, v.r.length]).toEqual([8, 8, 8])
    }
  })

  it('перевірка вхідних даних', () => {
    const v = LR2_VARIANTS[0]
    expect(validateLr2({ ...v, mu: [0, ...v.mu.slice(1)] })).toEqual(['μ — додатні числа'])
    expect(validateLr2({ ...v, lambda: v.lambda.slice(1) })).toHaveLength(1)
    expect(validateLr2({ ...v, tn: 0 })).toEqual(['Tn — додатне число'])
    expect(() => solveLr2({ ...v, rd: -1 })).toThrow()
  })
})
