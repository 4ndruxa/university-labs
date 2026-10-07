import { describe, expect, it } from 'vitest'
import { computeIndicators, validateTestData } from '../../../src/subjects/tnps/core/indicators'
import { LAB1_TASK } from '../../../src/subjects/tnps/core/lab1'

describe('ТНПС ЛР1: показники надійності', () => {
  const r = computeIndicators(LAB1_TASK)
  it('Δt = 40 / 4 = 10 год', () => expect(r.dt).toBe(10))
  it('T = 970 / 36 ≈ 26.94 год', () => expect(r.meanTime).toBeCloseTo(26.9444, 4))
  it('N(t): 36 → 33 → 27 → 19 → 0', () => {
    expect(r.rows.map((x) => x.nStart)).toEqual([36, 33, 27, 19])
    expect(r.rows.map((x) => x.nEnd)).toEqual([33, 27, 19, 0])
  })
  it('2-й інтервал: P = 0.75, Q = 0.25, f = 6/360, λ = 6/330', () => {
    const x = r.rows[1]
    expect(x.p).toBeCloseTo(0.75, 10)
    expect(x.q).toBeCloseTo(0.25, 10)
    expect(x.f).toBeCloseTo(6 / 360, 10)
    expect(x.lambda).toBeCloseTo(6 / 330, 10)
    expect(x.lambdaAvg).toBeCloseTo(0.02, 10)
  })
  it('усі інтервали', () => {
    expect(r.rows.map((x) => x.p)).toEqual([33 / 36, 27 / 36, 19 / 36, 0])
    r.rows.map((x) => x.f).forEach((v, i) => expect(v).toBeCloseTo([3, 6, 8, 19][i] / 360, 10))
    r.rows.map((x) => x.lambda!).forEach((v, i) => expect(v).toBeCloseTo([3 / 360, 6 / 330, 8 / 270, 19 / 190][i], 10))
  })
  it('λ = null, якщо на початку інтервалу не лишилося зразків', () => {
    const z = computeIndicators({ n0: 2, totalTime: 20, failures: [2, 0] })
    expect(z.rows[1].lambda).toBeNull()
  })
  it('перевірка даних', () => {
    expect(validateTestData(LAB1_TASK)).toEqual([])
    expect(validateTestData({ ...LAB1_TASK, failures: [3, 6, 8, 18] })[0]).toMatch(/Сума відмов \(35\)/)
    expect(validateTestData({ ...LAB1_TASK, failures: [] })).toHaveLength(1)
    expect(validateTestData({ ...LAB1_TASK, failures: [3, -1, 15, 19] })).toHaveLength(1)
    expect(validateTestData({ ...LAB1_TASK, totalTime: 0 })).toHaveLength(1)
    expect(validateTestData({ ...LAB1_TASK, n0: 2.5 })).toHaveLength(1)
    expect(() => computeIndicators({ ...LAB1_TASK, n0: 0 })).toThrow()
  })
})
