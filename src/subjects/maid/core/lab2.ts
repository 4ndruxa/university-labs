// ЛР2: Q = B × C − A, елементи матриць 1…27 — за формулами з умови
import { ComplexInterval } from './complex'
import { Interval } from './interval'
import { matMul, matSub, type Matrix } from './matrix'

export interface StudentData {
  day: number // день народження
  month: number // місяць народження
  zal: number // остання цифра залікової книжки
  stud: number // остання цифра студентського квитка
  jrn: number // порядковий номер у журналі
  lab: number // порядковий номер на лабораторній
}

export const FIELD_LABELS: Record<keyof StudentData, string> = {
  day: 'День народження',
  month: 'Місяць народження',
  zal: 'Остання цифра залікової книжки',
  stud: 'Остання цифра студентського квитка',
  jrn: 'Порядковий номер у журналі',
  lab: 'Порядковий номер на лабораторній',
}

/** [c ± d] = [c − d; c + d] */
const pm = (c: number, d: number): Interval => new Interval(c - d, c + d)
const I = (a: number, b: number): Interval => new Interval(a, b)
const C = (re: Interval, im: Interval): ComplexInterval => new ComplexInterval(re, im)

/** Індекс 0 не використовується */
export function buildElements(d: StudentData): ComplexInterval[] {
  const dm = d.day + d.month
  const sz = d.stud + d.zal
  const jl = d.jrn + d.lab
  return [
    C(I(0, 0), I(0, 0)),
    C(I(-1, 1), pm(d.stud, 3)), // 1
    C(pm(d.day, 10), I(-4, 0)), // 2
    C(I(-2, 2), I((jl - 4) / 5, (jl + 4) / 5)), // 3
    C(pm(d.month, 5), I(0, 1)), // 4
    C(I(-3, 3), I((sz - 6) / 4, (sz + 6) / 4)), // 5
    C(pm(dm / 2, 5), I(-2, 2)), // 6
    C(I(-4, 4), pm(d.day, 10)), // 7
    C(I((dm - 5) / 4, (dm + 5) / 4), I(0, 3)), // 8
    C(I(-5, 5), pm(d.jrn, 2)), // 9
    C(I(0, 1), pm(d.month, 5)), // 10
    C(pm(d.zal, 2), I(-1, 0)), // 11
    C(I(0, 2), pm(jl / 3, 4)), // 12
    C(pm(d.stud, 3), I(0, 5)), // 13
    C(I(0, 3), pm(dm / 2, 5)), // 14
    C(pm(sz / 2, 4), I(-1, 1)), // 15
    C(I(0, 4), pm(d.lab, 5)), // 16
    C(I((sz - 6) / 4, (sz + 6) / 4), I(-4, 4)), // 17
    C(I(0, 5), I((dm - 5) / 4, (dm + 5) / 4)), // 18
    C(I(-5, 0), pm(sz / 2, 4)), // 19
    C(pm(d.jrn, 2), I(0, 2)), // 20
    C(I(-4, 0), pm(d.zal, 2)), // 21
    C(pm(d.lab, 5), I(-3, 3)), // 22
    C(I(-3, 0), I(-5, 0)), // 23
    C(pm(jl / 3, 4), I(-2, 0)), // 24
    C(I(-2, 0), I(-5, 5)), // 25
    C(I((jl - 4) / 5, (jl + 4) / 5), I(0, 4)), // 26
    C(I(-1, 0), I(-3, 0)), // 27
  ]
}

/** Номери елементів у матрицях — по стовпцях */
export const LAYOUT = {
  A: [[1, 4, 7], [2, 5, 8], [3, 6, 9]],
  B: [[10, 13, 16], [11, 14, 17], [12, 15, 18]],
  C: [[19, 22, 25], [20, 23, 26], [21, 24, 27]],
} as const

// Рік невідомий, тому 29.02 допустиме
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTH_IN = ['січні', 'лютому', 'березні', 'квітні', 'травні', 'червні', 'липні', 'серпні', 'вересні', 'жовтні', 'листопаді', 'грудні']

/** Лише звичайне ціле число (без '1e1', '-0', '0x10', '2.5'); інакше NaN */
export function parseField(s: string): number {
  const t = s.trim()
  return /^\d{1,3}$/.test(t) ? Number(t) : Number.NaN
}

/** Порожній об'єкт — дані коректні */
export function validate(d: StudentData): Partial<Record<keyof StudentData, string>> {
  const errors: Partial<Record<keyof StudentData, string>> = {}
  const check = (k: keyof StudentData, lo: number, hi: number, message: string) => {
    const v = d[k]
    if (!Number.isInteger(v) || v < lo || v > hi) errors[k] = message
  }
  check('day', 1, 31, 'День — від 1 до 31')
  check('month', 1, 12, 'Місяць — від 1 до 12')
  check('zal', 0, 9, 'Одна цифра, 0–9')
  check('stud', 0, 9, 'Одна цифра, 0–9')
  check('jrn', 1, 100, 'Число від 1 до 100')
  check('lab', 1, 100, 'Число від 1 до 100')
  if (!errors.day && !errors.month && d.day > DAYS_IN_MONTH[d.month - 1]) {
    errors.day = `У ${MONTH_IN[d.month - 1]} ${d.month === 2 ? 'не більше 29' : DAYS_IN_MONTH[d.month - 1]} днів`
  }
  return errors
}

export interface Lab2Result {
  A: Matrix
  B: Matrix
  C: Matrix
  BC: Matrix
  Q: Matrix
}

export function solveLab2(d: StudentData): Lab2Result {
  const errors = validate(d)
  const keys = Object.keys(errors) as (keyof StudentData)[]
  if (keys.length) throw new Error(keys.map((k) => `${FIELD_LABELS[k]}: ${errors[k]}`).join('\n'))
  const e = buildElements(d)
  const place = (layout: readonly (readonly number[])[]): Matrix => layout.map((row) => row.map((n) => e[n]))
  const A = place(LAYOUT.A)
  const B = place(LAYOUT.B)
  const C = place(LAYOUT.C)
  const BC = matMul(B, C)
  return { A, B, C, BC, Q: matSub(BC, A) }
}
