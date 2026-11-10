// ЛР3: інтервальний метод Ньютона — локалізація нуля функції на проміжку (лекція 5)
//   X₀ = [a; b],  f(a)·f(b) < 0
//   Xₖ₊₁ = { m(Xₖ) − f(m(Xₖ)) / M } ∩ Xₖ,   M = f′(Xₖ) — інтервальне розширення похідної
// Якщо 0 ∈ M (похідна на Xₖ змінює знак), крок Ньютона не визначений — ділимо Xₖ навпіл
// і залишаємо половину, на кінцях якої f має різні знаки.
import { DomainError, evalAt, evalInterval, parseFunction, type Node } from './func'
import { Interval } from './interval'

export interface Lab3Variant {
  f: string
  df: string
  a: number
  b: number
}

// Варіанти з методичних вказівок; похідні знайдено аналітично (перевіряються тестом)
export const LAB3_VARIANTS: readonly Lab3Variant[] = [
  { f: 'sin(2x^2) - cos(x)*x^3', df: '4x*cos(2x^2) + sin(x)*x^3 - 3x^2*cos(x)', a: -1.4, b: -1.05 },
  { f: 'cos(x^2)^2 + 2sin(x)', df: '-4x*cos(x^2)*sin(x^2) + 2cos(x)', a: -1, b: 0.5 },
  { f: '1/sqrt(x) + 2sin(2x)*x', df: '-1/(2x*sqrt(x)) + 4x*cos(2x) + 2sin(2x)', a: 2.6, b: 3.5 },
  { f: '4^cos(x^2) - 1', df: '-2x*ln(4)*sin(x^2)*4^cos(x^2)', a: -1.5, b: -0.8 },
  { f: '-0.3 + ln(x)/x', df: '(1 - ln(x))/x^2', a: 1.2, b: 1.9 },
  { f: '2cos(4x^2)^2 - 0.2', df: '-32x*cos(4x^2)*sin(4x^2)', a: 1.1, b: 1.2 },
  { f: '2^(sin(x)*cos(x)) - 1.2', df: 'ln(2)*cos(2x)*2^(sin(x)*cos(x))', a: 3.15, b: 3.8 },
  { f: 'x^3/ln(x) - 10', df: '(3x^2*ln(x) - x^2)/ln(x)^2', a: 1.5, b: 2.3 },
  { f: 'cos(2x)^3/sqrt(x) + 0.2', df: '-6cos(2x)^2*sin(2x)/sqrt(x) - cos(2x)^3/(2x*sqrt(x))', a: 1.9, b: 2.1 },
  { f: 'sin(2x^3)/root(x, 5) - 0.5', df: '6x^2*cos(2x^3)/root(x, 5) - sin(2x^3)/(5x*root(x, 5))', a: 0.25, b: 1 },
  { f: '3^(sin(x^2)^2) - 1.5', df: '2x*ln(3)*sin(2x^2)*3^(sin(x^2)^2)', a: 0.6, b: 1.1 },
  { f: 'x*ln(x)/sqrt(x) + cos(x) - 0.7', df: '(ln(x) + 2)/(2sqrt(x)) - sin(x)', a: 2.1, b: 3.1 },
  { f: 'root(cos(x)*sin(x), 7) + 0.8', df: 'cos(2x)/(7*root(cos(x)*sin(x), 7)^6)', a: 2.8, b: 3.05 },
  { f: '(cos(x)/sin(x))^2 - 8', df: '-2cos(x)/sin(x)^3', a: 2.4, b: 2.95 },
  { f: 'root(4^(x^2), 5) - 2', df: '2x*ln(4)/5*root(4^(x^2), 5)', a: 1.5, b: 1.7 },
  { f: '2^sin(x)*3^x - 8', df: '2^sin(x)*3^x*(ln(2)*cos(x) + ln(3))', a: 1.1, b: 1.9 },
  { f: 'sin(exp(5x^3))^3 - 0.7', df: '45x^2*exp(5x^3)*sin(exp(5x^3))^2*cos(exp(5x^3))', a: 0.16, b: 0.4 },
  { f: 'cos(ln(x)*x/6)', df: '-sin(ln(x)*x/6)*(ln(x) + 1)/6', a: 11, b: 11.75 },
  { f: 'cos(x/3)^2*root(x^3, 5) - 2', df: '-2/3*cos(x/3)*sin(x/3)*root(x^3, 5) + 3cos(x/3)^2/(5root(x^2, 5))', a: 7.2, b: 9 },
  { f: 'sin(x)^3*root((x - 2)^3, 5) + 0.8', df: '3sin(x)^2*cos(x)*root((x - 2)^3, 5) + 3sin(x)^3/(5root((x - 2)^2, 5))', a: 5, b: 7.2 },
  { f: '3^root(x^2 - 2, 6) - 8/x', df: 'ln(3)*x*3^root(x^2 - 2, 6)/(3root((x^2 - 2)^5, 6)) + 8/x^2', a: 1.6, b: 3.6 },
  { f: '2sin(2x)^2 - 8x^3 - 1/4', df: '4sin(4x) - 24x^2', a: 0.13, b: 0.25 },
  { f: '2sin(x)^2 - 4x^3*cos(2x) - 0.5', df: '2sin(2x) - 12x^2*cos(2x) + 8x^3*sin(2x)', a: 0.3, b: 0.874 },
  { f: '(6^(4x^3) + 3)^2 - 8x^2', df: '24x^2*ln(6)*(6^(4x^3) + 3)*6^(4x^3) - 16x', a: -2, b: -0.3 },
  { f: 'ln(x)*root((cos(x)/sin(x))^2, 5) - 3', df: 'root((cos(x)/sin(x))^2, 5)/x - 2ln(x)*root((cos(x)/sin(x))^2, 5)/(5cos(x)*sin(x))', a: 5, b: 6.2 },
]

export const LAB3_EPS = 1e-4
export const LAB3_MAX_ITER = 100

export interface Lab3Row {
  k: number // номер ітерації (1, 2, …)
  X: Interval // Xₖ₋₁ — інтервал на початку ітерації
  m: number // m(Xₖ₋₁)
  fm: number // f(m)
  M: Interval | null // f′(Xₖ₋₁); null — похідна не обчислюється на всьому Xₖ₋₁
  /** 'newton' — крок Ньютона, 'bisect' — 0 ∈ M, поділ навпіл */
  kind: 'newton' | 'bisect'
  N: Interval | null // m − f(m)/M (для кроку Ньютона)
  next: Interval // Xₖ
  /** Умова з лекції: d(Xₖ) ≤ ½(1 − m₁/m₂)·d(Xₖ₋₁) */
  bound: number | null
  boundOk: boolean | null
}

export interface Lab3Result {
  rows: Lab3Row[]
  X: Interval // результуючий інтервал
  iterations: number
  timeMs: number
  stop: 'eps' | 'stagnation' | 'maxIter'
  /** Похибка за лекцією: |X⁺/m(X) − 1|·100 % */
  errorPct: number
}

export interface Lab3Input {
  f: Node
  df: Node
  a: number
  b: number
  eps: number
}

/** Перевірка вхідних даних; повертає список помилок (порожній — можна рахувати) */
export function validateLab3(inp: Lab3Input): string[] {
  const { f, df, a, b, eps } = inp
  const errors: string[] = []
  if (!Number.isFinite(a) || !Number.isFinite(b)) errors.push('Межі проміжку — числа')
  else if (a >= b) errors.push('Ліва межа має бути меншою за праву')
  if (!(eps > 0)) errors.push('Точність ε — додатне число')
  if (errors.length) return errors
  let fa: number, fb: number
  try {
    fa = evalAt(f, a)
    fb = evalAt(f, b)
  } catch (e) {
    return [`f(x) не обчислюється на кінцях проміжку: ${(e as Error).message}`]
  }
  if (fa * fb > 0) errors.push(`f(a) і f(b) мають однаковий знак (f(a) = ${fa.toPrecision(4)}, f(b) = ${fb.toPrecision(4)}) — нуль на проміжку не гарантований`)
  try {
    evalInterval(f, new Interval(a, b))
  } catch (e) {
    errors.push(`f(x) не визначена на всьому проміжку: ${(e as Error).message}`)
  }
  try {
    evalInterval(df, new Interval(a, b))
  } catch (e) {
    if (!(e instanceof DomainError && /містить 0/.test(e.message))) errors.push(`f′(x) не визначена на всьому проміжку: ${(e as Error).message}`)
  }
  return errors
}

/** f(m) як число для таблиці та знаку; f(m) як інтервал — для гарантованого кроку */
const pointInterval = (f: Node, m: number) => evalInterval(f, new Interval(m))

/** Інтервальний метод Ньютона. now — годинник (для тестів), за замовчуванням performance.now */
export function solveLab3(inp: Lab3Input, maxIter = LAB3_MAX_ITER, now: () => number = () => performance.now()): Lab3Result {
  const errors = validateLab3(inp)
  if (errors.length) throw new Error(errors.join('\n'))
  const { f, df, eps } = inp
  const rows: Lab3Row[] = []
  let X = new Interval(inp.a, inp.b)
  let stop: Lab3Result['stop'] = 'maxIter'
  const t0 = now()

  for (let k = 1; k <= maxIter; k++) {
    const m = X.mid
    const fm = evalAt(f, m)
    let M: Interval | null = null
    try {
      M = evalInterval(df, X)
    } catch (e) {
      if (!(e instanceof DomainError)) throw e
    }
    let next: Interval
    let N: Interval | null = null
    let bound: number | null = null
    let kind: Lab3Row['kind'] = 'newton'
    if (M === null || M.contains(0)) {
      kind = 'bisect'
      const fl = evalAt(f, X.lo)
      next = fl * fm <= 0 ? new Interval(X.lo, m) : new Interval(m, X.hi)
    } else {
      const Fm = pointInterval(f, m)
      const q = Fm.quotients(M)
      N = new Interval(m - Math.max(...q), m - Math.min(...q))
      const lo = Math.max(N.lo, X.lo)
      const hi = Math.min(N.hi, X.hi)
      if (lo > hi) throw new Error(`На інтервалі ${X} нуля немає: N ∩ X = ∅`)
      next = new Interval(lo, hi)
      const m1 = Math.min(Math.abs(M.lo), Math.abs(M.hi))
      const m2 = Math.max(Math.abs(M.lo), Math.abs(M.hi))
      bound = 0.5 * (1 - m1 / m2) * X.width
    }
    rows.push({ k, X, m, fm, M, kind, N, next, bound, boundOk: bound === null ? null : next.width <= bound + 1e-15 })
    const stagnated = next.lo === X.lo && next.hi === X.hi
    X = next
    if (X.width < eps) { stop = 'eps'; break }
    if (stagnated) { stop = 'stagnation'; break }
  }

  const timeMs = now() - t0
  const mid = X.mid
  return {
    rows,
    X,
    iterations: rows.length,
    timeMs,
    stop,
    errorPct: mid === 0 ? 0 : Math.abs(X.hi / mid - 1) * 100,
  }
}

/** Розбір і розв'язання з текстових формул (сторінка й звіт) */
export function lab3FromText(fSrc: string, dfSrc: string, a: number, b: number, eps = LAB3_EPS) {
  return { f: parseFunction(fSrc), df: parseFunction(dfSrc), a, b, eps }
}
