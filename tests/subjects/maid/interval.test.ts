import { describe, expect, it } from 'vitest'
import { Interval, fmtHi, fmtLo } from '../../../src/subjects/maid/core'
import { expectInterval } from './helpers'

describe('Лекція 1: арифметика інтервалів, A = [−1; 1], B = [0; 4]', () => {
  const A = new Interval(-1, 1)
  const B = new Interval(0, 4)
  it('A + B = [−1; 5]', () => expectInterval(A.add(B), [-1, 5]))
  it('A − B = [−5; 1]', () => expectInterval(A.sub(B), [-5, 1]))
  it('A · B = [−4; 4]', () => expectInterval(A.mul(B), [-4, 4]))
  it('A / B — помилка (межа дільника 0)', () => expect(() => A.div(B)).toThrow(/межа дільника/))
})

describe('Лекція 1: ділення', () => {
  it('[2; 4] / [4; 5] = [0.4; 1]', () => expectInterval(new Interval(2, 4).div(new Interval(4, 5)), [0.4, 1]))
  it('[−4; −1] / [2; 3] = [−2; −1/3]', () => expectInterval(new Interval(-4, -1).div(new Interval(2, 3)), [-2, -1 / 3]))
  it('[−2; 6] / [−1; 3] = [−6; 2] з попередженням (приклад 3)', () => {
    const warnings: string[] = []
    expectInterval(new Interval(-2, 6).div(new Interval(-1, 3), (w) => warnings.push(w)), [-6, 2])
    expect(warnings).toHaveLength(1)
  })
  it('без попередження, якщо 0 не в дільнику', () => {
    const warnings: string[] = []
    new Interval(1, 2).div(new Interval(4, 5), (w) => warnings.push(w))
    expect(warnings).toHaveLength(0)
  })
})

describe('Інтервал: інші операції та перевірки', () => {
  it('ліва межа більша за праву — помилка', () => expect(() => new Interval(3, 1)).toThrow())
  it('нескінченні межі — помилка', () => expect(() => new Interval(0, Infinity)).toThrow())
  it('точковий інтервал', () => expectInterval(Interval.from(5), [5, 5]))
  it('−0 нормалізується', () => expect(Object.is(new Interval(-0, 1).lo, 0)).toBe(true))
  it('квадрат як множина квадратів', () => {
    expectInterval(new Interval(-2, 3).sqr(), [0, 9])
    expectInterval(new Interval(2, 3).sqr(), [4, 9])
    expectInterval(new Interval(-3, -2).sqr(), [4, 9])
  })
  it('ширина і середина (лекція 2: A = [−2; 4])', () => {
    const a = new Interval(-2, 4)
    expect(a.width).toBe(6)
    expect(a.mid).toBe(1)
  })
})

describe('Форматування: округлення назовні', () => {
  it('ліва межа вниз, права вгору', () => {
    expect(fmtLo(-69.25 / 3)).toBe('-23.0834')
    expect(fmtHi(46.25 / 3)).toBe('15.4167')
    expect(new Interval(1 / 3, 2 / 3).toString()).toBe('[0.3333; 0.6667]')
  })
  it('похибка float не розширює інтервал', () => {
    expect(fmtHi(0.1 + 0.2)).toBe('0.3')
    expect(fmtLo(0.3 - 0.1)).toBe('0.2')
  })
  it('−0 показується як 0', () => {
    expect(fmtLo(-0)).toBe('0')
    expect(fmtHi(-0.00001)).toBe('0')
  })
  it('значення, далекі від сітки 4 знаків, округлюються назовні', () => {
    expect(new Interval(-0.00002, 0.00002).toString()).toBe('[-0.0001; 0.0001]')
  })
})
