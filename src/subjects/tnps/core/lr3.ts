// ЛР3: надійність складної системи з резервуванням (лекція, тема 6)
// Система з n послідовних елементів, закон експоненціальний, m — кратність резервування

/** Множник таблиць варіантів для λ (уточнення викладача: ×10⁻³ замість ×10⁻⁵) */
export const LR3_SCALE = 1e-3
/** Графіки — від 0 до 500 год */
export const LR3_T_MAX = 500
export const LR3_T_STEP = 25

export interface Lr3Data {
  lambda: number[] // λi у таблиці (×10⁻³ год⁻¹)
  m: number // кратність резервування
}

export const LR3_VARIANTS: readonly Lr3Data[] = [
  { lambda: [1.1, 0.5, 3, 4.2, 3.6, 2.1, 4.4, 4.8], m: 4 },
  { lambda: [2.6, 3.2, 6.4, 1.2, 3, 1.8, 5.1, 4.2], m: 4 },
  { lambda: [0.5, 0.2, 1, 1.2, 0.6, 2.1, 1.2, 0.7], m: 5 },
  { lambda: [0.2, 0.8, 2.3, 0.1, 0.5, 1.2, 3.4, 0.7], m: 5 },
  { lambda: [1.1, 2.3, 4.7, 0.6, 5, 4.8, 3.2, 2.6], m: 6 },
  { lambda: [1.2, 0.8, 1.6, 0.2, 0.1, 0.05, 6.2, 2.4], m: 6 },
  { lambda: [3.2, 0.1, 1, 0.7, 1.2, 0.3, 0.1, 1.2], m: 3 },
  { lambda: [1.1, 3.4, 2.7, 2, 2.4, 2.7, 1.5, 1.8], m: 4 },
  { lambda: [2.5, 2, 3.6, 4, 4.1, 1.1, 3.2, 2], m: 4 },
  { lambda: [2.3, 2.5, 2, 1.7, 1.3, 3.7, 3.1, 2.3], m: 5 },
  { lambda: [3.6, 1.1, 3.1, 2.6, 1, 3.5, 1.8, 3], m: 5 },
  { lambda: [1.3, 1.6, 2, 1.5, 1.9, 3.4, 4.2, 2], m: 6 },
  { lambda: [1.8, 2.7, 2.5, 1.5, 2.3, 3.2, 4, 3], m: 6 },
  { lambda: [2.7, 3.5, 1.1, 1.9, 2, 3.4, 4.8, 1.5], m: 3 },
]

export type Lr3Kind = 'general' | 'separate' | 'substitution' | 'sliding'

export const LR3_KINDS: readonly { kind: Lr3Kind; title: string }[] = [
  { kind: 'general', title: 'Загальне з постійно включеним резервом' },
  { kind: 'separate', title: 'Роздільне з постійно включеним резервом' },
  { kind: 'substitution', title: 'Резервування заміщенням' },
  { kind: 'sliding', title: 'Ковзне резервування' },
]

/** Σ_{i=0..m} x^i / i! */
function poissonSum(x: number, m: number): number {
  let term = 1
  let sum = 1
  for (let i = 1; i <= m; i++) {
    term *= x / i
    sum += term
  }
  return sum
}

/** Загальне з постійно включеним резервом: P = 1 − (1 − e^(−λc·t))^(m+1) */
export const pGeneral = (lambda: number[], m: number, t: number): number => {
  const lc = lambda.reduce((s, x) => s + x, 0)
  return 1 - (1 - Math.exp(-lc * t)) ** (m + 1)
}

/** Роздільне з постійно включеним резервом: P = Π(1 − (1 − e^(−λi·t))^(m+1)) */
export const pSeparate = (lambda: number[], m: number, t: number): number =>
  lambda.reduce((p, li) => p * (1 - (1 - Math.exp(-li * t)) ** (m + 1)), 1)

/** Заміщенням (резервується вся система): P = e^(−λc·t) · Σ_{i=0..m} (λc·t)^i / i! */
export const pSubstitution = (lambda: number[], m: number, t: number): number => {
  const lc = lambda.reduce((s, x) => s + x, 0)
  return Math.exp(-lc * t) * poissonSum(lc * t, m)
}

/**
 * Ковзне: n елементів, з них m резервних, λ = λсер = λc / n:
 * P = e^(−(n−m)λt) · Σ_{i=0..m} ((n−m)λt)^i / i!
 */
export const pSliding = (lambda: number[], m: number, t: number): number => {
  const n = lambda.length
  const rate = ((n - m) * lambda.reduce((s, x) => s + x, 0)) / n
  return Math.exp(-rate * t) * poissonSum(rate * t, m)
}

const P_OF: Record<Lr3Kind, (lambda: number[], m: number, t: number) => number> = {
  general: pGeneral,
  separate: pSeparate,
  substitution: pSubstitution,
  sliding: pSliding,
}

/** Середній час безвідмовної роботи: формули лекції, для роздільного — T = ∫₀^∞ P(t)dt чисельно */
export function meanTime(kind: Lr3Kind, lambda: number[], m: number): number {
  const n = lambda.length
  const lc = lambda.reduce((s, x) => s + x, 0)
  if (kind === 'general') {
    let h = 0
    for (let i = 1; i <= m + 1; i++) h += 1 / i
    return h / lc
  }
  if (kind === 'substitution') return (m + 1) / lc
  if (kind === 'sliding') return (m + 1) / (((n - m) * lc) / n)
  return integrate((t) => pSeparate(lambda, m, t))
}

/** ∫₀^∞ f(t)dt для спадної f: межа — де f < 1e-12, далі формула Сімпсона */
function integrate(f: (t: number) => number): number {
  let end = 1
  while (f(end) > 1e-12) end *= 2
  const steps = 20000
  const h = end / steps
  let s = f(0) + f(end)
  for (let i = 1; i < steps; i++) s += f(i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}

export interface Lr3Result {
  lambda: number[] // λi, год⁻¹
  lambdaC: number // λc = Σλi
  T0: number // без резервування, 1/λc
  times: number[]
  curves: { kind: Lr3Kind; title: string; T: number; p: number[] }[]
}

export function validateLr3(d: Lr3Data): string[] {
  const errors: string[] = []
  if (d.lambda.length < 2) errors.push('Потрібно щонайменше 2 елементи')
  if (d.lambda.some((x) => !Number.isFinite(x) || x <= 0)) errors.push('λ — додатні числа')
  if (!Number.isInteger(d.m) || d.m < 1) errors.push('Кратність m — ціле число від 1')
  else if (d.m >= d.lambda.length) errors.push('Для ковзного резервування m має бути меншим за кількість елементів')
  return errors
}

export function solveLr3(d: Lr3Data, tMax = LR3_T_MAX, tStep = LR3_T_STEP): Lr3Result {
  const errors = validateLr3(d)
  if (errors.length) throw new Error(errors.join('\n'))
  const lambda = d.lambda.map((x) => x * LR3_SCALE)
  const lambdaC = lambda.reduce((s, x) => s + x, 0)
  const times: number[] = []
  for (let t = 0; t <= tMax + 1e-9; t += tStep) times.push(t)
  return {
    lambda,
    lambdaC,
    T0: 1 / lambdaC,
    times,
    curves: LR3_KINDS.map(({ kind, title }) => ({
      kind,
      title,
      T: meanTime(kind, lambda, d.m),
      p: times.map((t) => P_OF[kind](lambda, d.m, t)),
    })),
  }
}
