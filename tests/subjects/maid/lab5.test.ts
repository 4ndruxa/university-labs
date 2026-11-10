import { describe, expect, it } from 'vitest'
import {
  LAB5_VARIANTS,
  LAB5_X,
  combinations,
  det,
  evalAt,
  inverse,
  lab5FromText,
  mul,
  parseFunction,
  solveLab5,
  validateLab5,
} from '../../../src/subjects/maid/core'

// Приклад з лекції 7: f = a(x − 2)² + bx + 2, a = −0,3, b = 3, коридор 15 %, x = 3, 5, 7, 9, 11
const lecture = () => lab5FromText('a*(x - 2)^2 + b*x + 2', { a: -0.3, b: 3 }, 15, [3, 5, 7, 9, 11], ['a', 'b'])

describe('МАІД ЛР5: допоміжне', () => {
  it('параметри у формулі', () => {
    const y = parseFunction('ax^2 + bsin(x) - cx', ['a', 'b', 'c'])
    expect(evalAt(y, 2, { a: 1, b: 0, c: 3 })).toBe(-2)
    expect(() => evalAt(y, 2, { a: 1 })).toThrow(/параметра b/)
    // без оголошених параметрів «a» — невідома назва
    expect(() => parseFunction('a*x')).toThrow(/Невідома назва «a»/)
  })

  it('лінійна алгебра', () => {
    expect(det([[1, 2], [3, 4]])).toBeCloseTo(-2, 12)
    expect(det([[2, 0, 1], [1, 3, 2], [1, 1, 2]])).toBeCloseTo(6, 12)
    const A = [[4, 7, 2], [3, 6, 1], [2, 5, 3]]
    const I = mul(A, inverse(A))
    I.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(i === j ? 1 : 0, 12)))
    expect(() => inverse([[1, 2], [2, 4]])).toThrow(/вироджена/)
    expect(combinations(5, 2)).toHaveLength(10)
    expect(combinations(6, 3)).toHaveLength(20)
  })
})

describe('МАІД ЛР5: приклад з лекції 7', () => {
  it('коридор і матриця чутливості — як на слайді', () => {
    const r = solveLab5(lecture())
    expect(r.y.map((v) => +v.toFixed(2))).toEqual([10.7, 14.3, 15.5, 14.3, 10.7])
    expect(r.dyPlus[0]).toBeCloseTo(1.605, 10)
    expect(r.S.map((row) => row.map((v) => +v.toFixed(6)))).toEqual([[-0.3, 9], [-2.7, 15], [-7.5, 21], [-14.7, 27], [-24.3, 33]])
  })

  it('критерії блоків — як у таблиці слайда (крім помилкового −0,6072)', () => {
    const r = solveLab5(lecture())
    const crit = (a: number, b: number) => r.blocks.find((x) => x.rows.join() === `${a},${b}`)!.criterion!
    expect(crit(0, 1)).toBeCloseTo(0.4738, 1) // на слайді 189,52 · 0,0025 — det⁻¹ округлено
    expect(crit(0, 4)).toBeCloseTo(0.00243, 4)
    expect(crit(2, 4)).toBeCloseTo(0.00323, 4)
    // на слайді для блоку x = 9; 11 вказано −0,6072, але критерій не може бути від'ємним
    expect(crit(3, 4)).toBeCloseTo(0.00649, 4)
    expect(r.bestBlock).toEqual([0, 4])
  })

  it('блок як на слайді (x = 9; 11): H, r = 0,31, δa = 1,9 %, δb = 1,3 %', () => {
    const r = solveLab5({ ...lecture(), block: [3, 4] })
    expect(r.E2[0]).toBeCloseTo(0.217, 3)
    expect(r.E2[1]).toBeCloseTo(0.388, 3)
    expect(r.H[0][0]).toBeCloseTo(276.19, 1)
    expect(r.H[0][1]).toBeCloseTo(-397.56, 1)
    expect(r.H[1][1]).toBeCloseTo(581.19, 1)
    expect(r.r).toBeCloseTo(0.31, 2)
    expect(r.tolerances[0]).toBeCloseTo(1.9, 1)
    expect(r.tolerances[1]).toBeCloseTo(1.3, 1)
  })

  it('правильно обраний блок (x = 3; 11): r = 1, δa ≈ 6,6 %, δb ≈ 4,7 %', () => {
    const r = solveLab5(lecture())
    expect(r.block).toEqual([0, 4])
    expect(r.r).toBeCloseTo(1, 6)
    expect(r.tolerances[0]).toBeCloseTo(6.6, 1)
    expect(r.tolerances[1]).toBeCloseTo(4.69, 2)
  })
})

describe('МАІД ЛР5: варіанти', () => {
  it('варіант 1: блок x = 3, 4, 8; δa ≈ 8,35 %, δb ≈ 33,4 %, δc ≈ 28,8 %', () => {
    const v = LAB5_VARIANTS[0]
    const r = solveLab5(lab5FromText(v.y, { a: v.a, b: v.b, c: v.c }, v.eps, LAB5_X))
    expect(r.block.map((i) => LAB5_X[i])).toEqual([3, 4, 8])
    expect(r.r).toBeCloseTo(0.9191, 4)
    expect(r.tolerances.map((t) => +t.toFixed(2))).toEqual([8.35, 33.44, 28.82])
    expect(r.semiAxes[0]).toBeCloseTo(8.71, 2)
    // еліпсоїд вписаний у коридор: на межі r усі точки в коридорі
    expect(Math.min(...r.ratios)).toBe(r.r)
  })

  it('усі 20 варіантів: дані коректні; залежні параметри (9, 15) — зрозуміла помилка', () => {
    expect(LAB5_VARIANTS).toHaveLength(20)
    LAB5_VARIANTS.forEach((v, i) => {
      const inp = lab5FromText(v.y, { a: v.a, b: v.b, c: v.c }, v.eps, v.x ?? LAB5_X)
      expect(validateLab5(inp).errors, `варіант ${i + 1}`).toEqual([])
      if (i + 1 === 9 || i + 1 === 15) {
        expect(() => solveLab5(inp), `варіант ${i + 1}`).toThrow(/вироджені/)
        return
      }
      const r = solveLab5(inp)
      expect(r.r, `варіант ${i + 1}`).toBeGreaterThan(0)
      r.tolerances.forEach((t) => expect(Number.isFinite(t) && t > 0, `варіант ${i + 1}`).toBe(true))
    })
  })

  it('перевірка вхідних даних', () => {
    const base = lab5FromText('a*x + b*x^2 + c', { a: 1, b: 1, c: 1 }, 10, [1, 2, 3])
    expect(validateLab5(base).errors).toEqual([])
    expect(validateLab5({ ...base, eps: 0 }).errors).toEqual(['Коридор ε — число від 0 до 100 %'])
    expect(validateLab5({ ...base, x: [1, 2] }).errors[0]).toMatch(/щонайменше 3/)
    expect(validateLab5({ ...base, x: [1, 1, 2] }).errors[0]).toMatch(/повторюватися/)
    expect(validateLab5({ ...base, values: { a: 0, b: 1, c: 1 } }).errors[0]).toMatch(/a = 0/)
    const ln = lab5FromText('a*ln(x) + b + c*x', { a: 1, b: 1, c: 1 }, 10, [0, 1, 2])
    expect(validateLab5(ln).errors[0]).toMatch(/y\(0\) не обчислюється/)
    const small = lab5FromText('a*x + b + c*x^2', { a: 1, b: -1.01, c: 0.01 }, 10, [1, 5, 10])
    expect(validateLab5(small).warnings[0]).toMatch(/вузький коридор/)
  })
})
