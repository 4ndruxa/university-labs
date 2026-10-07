import { describe, expect, it } from 'vitest'
import { PROFILE } from '../../../src/profile'
import { LAYOUT, VARIANTS, buildElements, parseField, solveLab1, solveLab2, validate, type StudentData } from '../../../src/subjects/maid/core'
import { expectComplex, expectInterval } from './helpers'

describe('ЛР1, варіант 1', () => {
  const v = VARIANTS[0]
  const r = solveLab1(v.e1, v.e2, v.rule)
  it('X1 = [−69.25; 46.25]', () => expectInterval(r.expr1.value, [-69.25, 46.25]))
  it('X2 = [−5.5; 30]', () => expectInterval(r.expr2.value, [-5.5, 30]))
  it('Y = X / 3', () => {
    expectInterval(r.k1.im, [-69.25 / 3, 46.25 / 3])
    expectInterval(r.k2.im, [-5.5 / 3, 10])
  })
  it('K1 + K2', () => expectComplex(r.sum, [-74.75, 76.25], [-74.75 / 3, 76.25 / 3]))
  it('K1 − K2', () => expectComplex(r.diff, [-99.25, 51.75], [-99.25 / 3, 17.25]))
  it('K1 · K2', () => expectComplex(r.prod, [-2231.6666666667, 1618.3333333333], [-1385, 925], 1e-6))
  it('без попереджень', () => expect(r.warnings).toEqual([]))
})

describe('ЛР1: усі 30 варіантів', () => {
  it.each(VARIANTS.map((v, i) => [i + 1, v] as const))('варіант %i обчислюється', (_, v) => {
    const r = solveLab1(v.e1, v.e2, v.rule)
    expect(r.prod.re.lo).toBeLessThanOrEqual(r.prod.re.hi)
  })
})

// Вигадані дані
const sample: StudentData = { day: 15, month: 6, zal: 4, stud: 7, jrn: 1, lab: 3 }

describe('ЛР2', () => {
  it('елементи за формулами умови', () => {
    const e = buildElements(sample)
    expectComplex(e[1], [-1, 1], [4, 10]) //     [−1;1] + i[7 ± 3]
    expectComplex(e[2], [5, 25], [-4, 0]) //     [15 ± 10] + i[−4;0]
    expectComplex(e[3], [-2, 2], [0, 1.6]) //    i[((1+3) ± 4)/5]
    expectComplex(e[6], [5.5, 15.5], [-2, 2]) // [(15+6)/2 ± 5]
    expectComplex(e[8], [4, 6.5], [0, 3]) //     [((15+6) ± 5)/4]
    expectComplex(e[27], [-1, 0], [-3, 0])
  })
  it('матриці заповнюються по стовпцях', () => {
    const e = buildElements(sample)
    const { A, B, C } = solveLab2(sample)
    expect(A[0][1].equals(e[4])).toBe(true)
    expect(A[1][0].equals(e[2])).toBe(true)
    expect(B[2][2].equals(e[18])).toBe(true)
    expect(C[0][2].equals(e[25])).toBe(true)
    expect(LAYOUT.C[2]).toEqual([21, 24, 27])
  })
  it('Q11 = B11·C11 + B12·C21 + B13·C31 − A11 (вручну)', () => {
    const { A, B, C, Q } = solveLab2(sample)
    const q11 = B[0][0].mul(C[0][0]).add(B[0][1].mul(C[1][0])).add(B[0][2].mul(C[2][0])).sub(A[0][0])
    expect(Q[0][0].equals(q11)).toBe(true)
  })
  it('валідація', () => {
    expect(validate(sample)).toEqual({})
    expect(validate({ ...sample, month: 13 }).month).toBeDefined()
    expect(validate({ ...sample, day: 31, month: 2 }).day).toMatch(/не більше 29/)
    expect(validate({ ...sample, day: 29, month: 2 })).toEqual({})
    expect(validate({ ...sample, day: 30, month: 2 }).day).toBeDefined()
    expect(validate({ ...sample, day: 31, month: 4 }).day).toBe('У квітні 30 днів')
    expect(validate({ ...sample, zal: 10 }).zal).toBeDefined()
    expect(validate({ ...sample, jrn: Number.NaN }).jrn).toBeDefined()
    expect(() => solveLab2({ ...sample, stud: -1 })).toThrow(/студентського/)
  })
  it('у полях — лише звичайні цілі числа', () => {
    expect(['12', ' 7 ', '012', '0'].map(parseField)).toEqual([12, 7, 12, 0])
    for (const bad of ['', ' ', '1e1', '-0', '0x10', '2.5', '1,5', '+3', '1000']) expect(parseField(bad), bad).toBeNaN()
  })
})

describe('ЛР2: дані студента за замовчуванням', () => {
  const mine: StudentData = {
    day: PROFILE.birthDay,
    month: PROFILE.birthMonth,
    zal: PROFILE.recordBookLastDigit,
    stud: PROFILE.studentIdLastDigit,
    jrn: PROFILE.listNumber,
    lab: 2,
  }
  it('коректні', () => expect(validate(mine)).toEqual({}))
  it('елементи вручну (12.11, заліковка 3, студентський 0, №1, ЛР2)', () => {
    const e = buildElements(mine)
    expectComplex(e[1], [-1, 1], [-3, 3]) //       i[0 ± 3]
    expectComplex(e[2], [2, 22], [-4, 0]) //       [12 ± 10]
    expectComplex(e[3], [-2, 2], [-0.2, 1.4]) //   i[((1+2) ± 4)/5]
    expectInterval(e[5].im, [-0.75, 2.25]) //      [((0+3) ± 6)/4]
    expectInterval(e[6].re, [6.5, 16.5]) //        [(12+11)/2 ± 5]
    expectInterval(e[8].re, [4.5, 7]) //           [((12+11) ± 5)/4]
    expectInterval(e[12].im, [-3, 5]) //           [(1+2)/3 ± 4]
    expectInterval(e[15].re, [-2.5, 5.5]) //       [(0+3)/2 ± 4]
  })
})
