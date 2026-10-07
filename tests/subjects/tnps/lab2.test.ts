import { describe, expect, it } from 'vitest'
import { LAB2_VARIANTS, solveLab2, validateLab2 } from '../../../src/subjects/tnps/core/lab2'
import { laplace, laplaceTable } from '../../../src/subjects/tnps/core/laplace'
import { empiricalP, histogram, mean, sampleStd } from '../../../src/subjects/tnps/core/statistics'

const [V1, V2, V3] = LAB2_VARIANTS
const close = (actual: number[], expected: number[], digits = 4) =>
  actual.forEach((v, i) => expect(v, `[${i}]`).toBeCloseTo(expected[i], digits))

describe('Статистика', () => {
  it('середнє та s (n − 1)', () => {
    expect(mean(V1.data)).toBeCloseTo(20.96, 10)
    expect(sampleStd(V1.data)).toBeCloseTo(12.9823, 4)
    expect(sampleStd(V2.data)).toBeCloseTo(7.29657, 4)
    expect(sampleStd(V3.data)).toBeCloseTo(19.80741, 4)
  })
  it('гістограми [a; a + h)', () => {
    expect(histogram(V1.data, 10).map((b) => b.count)).toEqual([5, 7, 7, 4, 2])
    expect(histogram(V2.data, 5).map((b) => b.count)).toEqual([2, 5, 5, 6, 5, 2])
    expect(histogram(V3.data, 15).map((b) => b.count)).toEqual([1, 6, 3, 7, 8])
    expect(histogram([10], 10).map((b) => b.count)).toEqual([0, 1])
    expect(histogram([1, 25], 10).map((b) => b.count)).toEqual([1, 0, 1])
  })
  it('емпірична P(t) — частка tᵢ > t', () => {
    expect([0, 5, 10, 15, 20].map((t) => empiricalP(V1.data, t))).toEqual([1, 0.84, 0.76, 0.64, 0.52])
  })
})

describe('Функція Лапласа', () => {
  it('точні значення', () => {
    expect(laplace(0)).toBe(0)
    expect(laplace(1.96)).toBeCloseTo(0.4750021, 7)
    expect(laplace(-1.61)).toBeCloseTo(-0.4463011, 7)
    expect(laplace(3)).toBeCloseTo(0.4986501, 7)
    expect(laplace(9)).toBe(0.5)
    expect(laplace(-9)).toBe(-0.5)
  })
  it('як у таблиці з методички', () => {
    expect(laplaceTable(1.614)).toEqual({ x: 1.61, phi: 0.4463 })
    expect(laplaceTable(0.0739)).toEqual({ x: 0.07, phi: 0.0279 })
    expect([1.23, 0.84, 0.46].map((x) => laplaceTable(x).phi)).toEqual([0.3907, 0.2995, 0.1772])
    expect(laplaceTable(1.22).phi).toBe(0.3888) // у таблиці методички помилково 0,3883
  })
})

describe('ТНПС ЛР2', () => {
  it('варіант 1', () => {
    const r = solveLab2(V1.data, V1.step)
    expect(r.mean).toBeCloseTo(20.96, 10)
    expect(r.lambda).toBeCloseTo(1 / 20.96, 10)
    close(r.rows.map((x) => x.pExp), [1, 0.7878, 0.6206, 0.4889, 0.3851])
    close(r.rows.map((x) => x.pNormal), [0.9463, 0.8907, 0.7995, 0.6772, 0.5279])
    close(r.rows.map((x) => x.pNormalExact), [0.9468, 0.8905, 0.8007, 0.6769, 0.5295])
    expect(r.rows.map((x) => x.xTable)).toEqual([-1.61, -1.23, -0.84, -0.46, -0.07])
  })
  it('варіант 2', () => {
    const r = solveLab2(V2.data, V2.step)
    expect(r.mean).toBeCloseTo(14.64, 10)
    close(r.rows.map((x) => x.pExp), [1, 0.7107, 0.5051, 0.3589, 0.2551])
    close(r.rows.map((x) => x.pNormalExact), [0.9776, 0.9068, 0.7376, 0.4803, 0.2313])
  })
  it('варіант 3', () => {
    const r = solveLab2(V3.data, V3.step)
    expect(r.mean).toBeCloseTo(46.2, 10)
    close(r.rows.map((x) => x.pExp), [1, 0.8974, 0.8054, 0.7228, 0.6486])
    close(r.rows.map((x) => x.pNormalExact), [0.9902, 0.9812, 0.9662, 0.9424, 0.907])
  })
  it('перевірка даних', () => {
    expect(validateLab2(V1.data, 10)).toEqual([])
    expect(validateLab2([], 10).length).toBeGreaterThan(0)
    expect(validateLab2([5], 10).length).toBeGreaterThan(0)
    expect(validateLab2([3, 3, 3], 10)).toEqual(['Значення не можуть бути всі однакові'])
    expect(validateLab2([-1, 2], 10).length).toBeGreaterThan(0)
    expect(validateLab2([Number.NaN, 2], 10).length).toBeGreaterThan(0)
    expect(validateLab2([1, 2], 0).length).toBeGreaterThan(0)
    expect(() => solveLab2([1], 10)).toThrow()
  })
})
