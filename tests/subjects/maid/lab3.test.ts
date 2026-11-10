import { describe, expect, it } from 'vitest'
import {
  DomainError,
  FuncError,
  Interval,
  LAB3_VARIANTS,
  derivativeMismatch,
  evalAt,
  evalInterval,
  formatFunction,
  lab3FromText,
  parseFunction,
  solveLab3,
  validateLab3,
} from '../../../src/subjects/maid/core'

const at = (src: string, x: number) => evalAt(parseFunction(src), x)
const on = (src: string, lo: number, hi: number) => evalInterval(parseFunction(src), new Interval(lo, hi))

describe('МАІД ЛР3: розбір формул', () => {
  it('арифметика, пріоритети, неявне множення', () => {
    expect(at('2 + 3*4', 0)).toBe(14)
    expect(at('2x + 1', 3)).toBe(7)
    expect(at('-x^2', 3)).toBe(-9)
    expect(at('2^3^2', 0)).toBe(512)
    expect(at('x^-1', 4)).toBe(0.25)
    expect(at('2sin(x)', Math.PI / 2)).toBeCloseTo(2, 12)
    expect(at('(x+1)(x-1)', 3)).toBe(8)
    expect(at('xsin(x)', Math.PI / 2)).toBeCloseTo(Math.PI / 2, 12)
    expect(at('sin^2(x) + cos(x)^2', 0.7)).toBeCloseTo(1, 12)
    expect(at('2·x − 1', 2)).toBe(3)
    expect(at('x² + π', 1)).toBeCloseTo(1 + Math.PI, 12)
  })

  it('корені й степені', () => {
    expect(at('root(x, 3)', -8)).toBeCloseTo(-2, 12)
    expect(at('root((x - 2)^3, 5)', 1)).toBeCloseTo(-1, 12)
    expect(() => at('root(x, 2)', -1)).toThrow(DomainError)
    expect(() => at('x^0.5', -1)).toThrow(DomainError)
    expect(() => at('ln(x)', 0)).toThrow(DomainError)
    expect(() => at('1/x', 0)).toThrow(DomainError)
  })

  it('помилки розбору з позицією', () => {
    expect(() => parseFunction('sn(x)')).toThrow(/Невідома назва «sn» на позиції 1/)
    expect(() => parseFunction('sin(x')).toThrow(FuncError)
    expect(() => parseFunction('2 + ')).toThrow(/обірвався/)
    expect(() => parseFunction('x $ 1')).toThrow(/позиції 3/)
    expect(() => parseFunction('root(x)')).toThrow(/два аргументи/)
    expect(() => parseFunction('root(x, 2.5)')).toThrow(/ціле число/)
    expect(() => parseFunction('')).toThrow(/Введіть/)
  })

  it('запис формули', () => {
    expect(formatFunction(parseFunction('sin(2x^2) - cos(x)*x^3'))).toBe('sin(2·x^2) − cos(x)·x^3')
    expect(formatFunction(parseFunction('x - (x - 1)'))).toBe('x − (x − 1)')
    expect(formatFunction(parseFunction('1/(2x)'))).toBe('1/(2·x)')
  })
})

describe('МАІД ЛР3: інтервальні функції', () => {
  it('інтервал містить усі значення функції (перевірка сіткою)', () => {
    const cases: [string, number, number][] = [
      ['sin(x)', 1, 2], ['sin(x)', -2, 4], ['cos(x)', 2, 4], ['x^2', -1, 2], ['x^3 - 2x', -2, 1],
      ['exp(x)*ln(x)', 0.5, 2], ['root(x, 5)', -2, 3], ['2^sin(x)*3^x', 1, 2], ['ctg(x)', 0.3, 3],
      ['abs(x - 1)', 0, 3], ['sqrt(x)/x', 1, 4], ['(cos(x)/sin(x))^2', 2.4, 2.95],
    ]
    for (const [src, lo, hi] of cases) {
      const F = on(src, lo, hi)
      for (let i = 0; i <= 200; i++) {
        const x = lo + ((hi - lo) * i) / 200
        const y = at(src, x)
        expect(F.lo, `${src} при x = ${x}`).toBeLessThanOrEqual(y)
        expect(F.hi, `${src} при x = ${x}`).toBeGreaterThanOrEqual(y)
      }
    }
  })

  it('точні межі для монотонних і періодичних функцій', () => {
    expect(on('sin(x)', 0, Math.PI).hi).toBeCloseTo(1, 12)
    expect(on('cos(x)', -1, 1).hi).toBeCloseTo(1, 12)
    const sq = on('x^2', -1, 2)
    expect([sq.lo, sq.hi]).toEqual([0, expect.closeTo(4, 12)])
  })

  it('недопустимі області', () => {
    expect(() => on('ln(x)', -1, 1)).toThrow(DomainError)
    expect(() => on('1/x', -1, 1)).toThrow(/містить 0/)
    expect(() => on('tan(x)', 1, 2)).toThrow(/розрив/)
    expect(() => on('ctg(x)', 3, 3.5)).toThrow(/розрив/)
  })
})

describe('МАІД ЛР3: інтервальний метод Ньютона', () => {
  it('приклад 1 з лекції 5: x³ − 2x − 5 на [2; 3]', () => {
    const r = solveLab3(lab3FromText('x^3 - 2x - 5', '3x^2 - 2', 2, 3))
    // перша ітерація: m = 2,5; f(m) = 5,625; M = [10; 25]; X₁ = [2; 2,275]
    const first = r.rows[0]
    expect(first.m).toBe(2.5)
    expect(first.fm).toBeCloseTo(5.625, 12)
    expect(first.M!.lo).toBeCloseTo(10, 10)
    expect(first.M!.hi).toBeCloseTo(25, 10)
    expect(first.next.lo).toBe(2)
    expect(first.next.hi).toBeCloseTo(2.275, 10)
    expect(first.boundOk).toBe(true)
    expect(r.X.contains(2.0945514815423265)).toBe(true)
    expect(r.X.width).toBeLessThan(1e-4)
    expect(r.stop).toBe('eps')
  })

  it('приклад 2 з лекції 5: sin 2x + x + 2 на [−3,5; −2,5]', () => {
    const r = solveLab3(lab3FromText('sin(2x) + x + 2', '2cos(2x) + 1', -3.5, -2.5))
    // у лекції M = [1,57; 2,51] за значеннями f′ на кінцях; але f′ = 2cos 2x + 1 досягає 3 при x = −π,
    // тож гарантоване M = [1,57; 3] і X₁ = [−2,7598; −2,5402] замість [−2,71; −2,55]
    expect(r.rows[0].M!.hi).toBeCloseTo(3, 10)
    expect(r.rows[0].next.lo).toBeCloseTo(-2.7598, 4)
    expect(r.rows[0].next.hi).toBeCloseTo(-2.5402, 4)
    const root = r.X.mid
    expect(Math.abs(at('sin(2x) + x + 2', root))).toBeLessThan(1e-3)
  })

  it('варіант 1: нуль ≈ −1,35952', () => {
    const v = LAB3_VARIANTS[0]
    const r = solveLab3(lab3FromText(v.f, v.df, v.a, v.b))
    expect(r.X.contains(-1.3595218)).toBe(true)
    expect(r.iterations).toBeLessThanOrEqual(5)
    expect(r.rows.every((x) => x.kind === 'newton')).toBe(true)
    expect(r.timeMs).toBeGreaterThanOrEqual(0)
  })

  it('усі 25 варіантів: похідна правильна, інтервал звужується до нуля f', () => {
    expect(LAB3_VARIANTS).toHaveLength(25)
    LAB3_VARIANTS.forEach((v, i) => {
      const inp = lab3FromText(v.f, v.df, v.a, v.b)
      expect(validateLab3(inp), `варіант ${i + 1}`).toEqual([])
      expect(derivativeMismatch(inp.f, inp.df, v.a, v.b), `похідна, варіант ${i + 1}`).toBeNull()
      const r = solveLab3(inp)
      expect(r.X.width, `варіант ${i + 1}`).toBeLessThan(1e-4)
      // f змінює знак на кінцях результуючого інтервалу (або дорівнює 0)
      expect(at(v.f, r.X.lo) * at(v.f, r.X.hi), `варіант ${i + 1}`).toBeLessThanOrEqual(0)
    })
  })

  it('варіант 10: f′ змінює знак — перші кроки поділом навпіл', () => {
    const v = LAB3_VARIANTS[9]
    const r = solveLab3(lab3FromText(v.f, v.df, v.a, v.b))
    expect(r.rows[0].kind).toBe('bisect')
    expect(r.rows.at(-1)!.kind).toBe('newton')
  })

  it('перевірка даних і похідної', () => {
    const inp = lab3FromText('x^2 - 2', '2x', 0, 1)
    expect(validateLab3(inp)[0]).toMatch(/однаковий знак/)
    expect(validateLab3({ ...inp, a: 2, b: 1 })).toEqual(['Ліва межа має бути меншою за праву'])
    expect(validateLab3({ ...inp, b: 2, eps: 0 })).toEqual(['Точність ε — додатне число'])
    expect(validateLab3(lab3FromText('ln(x) - 1', '1/x', -1, 5))[0]).toMatch(/не обчислюється/)
    const wrong = lab3FromText('x^3 - 2x - 5', '3x^2', 2, 3)
    expect(derivativeMismatch(wrong.f, wrong.df, 2, 3)).not.toBeNull()
    expect(() => solveLab3(inp)).toThrow()
  })
})
