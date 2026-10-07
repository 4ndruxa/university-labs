import { expect } from 'vitest'
import { ComplexInterval, Interval, type IntervalLike } from '../../../src/subjects/maid/core'

export function expectInterval(actual: Interval, expected: IntervalLike, eps = 1e-9): void {
  const e = Interval.from(expected)
  expect(actual.lo, `ліва межа ${actual}`).toBeCloseTo(e.lo, -Math.log10(eps))
  expect(actual.hi, `права межа ${actual}`).toBeCloseTo(e.hi, -Math.log10(eps))
}

export function expectComplex(actual: ComplexInterval, re: IntervalLike, im: IntervalLike, eps = 1e-9): void {
  expectInterval(actual.re, re, eps)
  expectInterval(actual.im, im, eps)
}
