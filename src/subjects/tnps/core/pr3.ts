// ПР3: надійність і ризик нерезервованої невідновлювальної системи (лекція, тема 3)
// Елементи рівнонадійні, закон експоненціальний: P(t) = e^(−nλt)
// Ризик системи (точна формула):  R(t) = (1 − e^(−nλt))·r
// Сума ризиків елементів (наближена): R*(t) = n·(1 − e^(−λt))·r
// Функція ризику: Gr(t, n) = R(t) / R*(t) = (1 − e^(−nλt)) / (n·(1 − e^(−λt)))

export interface Pr3Variant {
  n0: number // елементів у досліджуваній системі
  t0: number // час, за який відома P, год
  p0: number // P(t0) системи
  r: number // ризик відмови одного елемента, ум. од.
  n: number // елементів у новій системі
  tMax: number // функція ризику до tMax, год
  step: number // крок за часом, год
}

export const PR3_VARIANTS: readonly Pr3Variant[] = [
  { n0: 5, t0: 500, p0: 0.78, r: 1000, n: 40, tMax: 300, step: 50 },
  { n0: 7, t0: 350, p0: 0.95, r: 750, n: 80, tMax: 360, step: 60 },
  { n0: 4, t0: 150, p0: 0.57, r: 620, n: 25, tMax: 240, step: 40 },
  { n0: 10, t0: 230, p0: 0.71, r: 550, n: 50, tMax: 600, step: 100 },
  { n0: 3, t0: 850, p0: 0.46, r: 1200, n: 15, tMax: 300, step: 50 },
]

export interface Pr3Row {
  t: number
  p: number // P(t) нової системи
  risk: number // R(t)
  riskSum: number // R*(t)
  g: number // Gr(t, n); при t = 0 — границя, 1
}

export interface Pr3Result {
  lambdaSys0: number // λ досліджуваної системи, год⁻¹
  lambda: number // λ одного елемента, год⁻¹
  lambdaSys: number // λ нової системи = n·λ
  T: number // середнє напрацювання нової системи, год
  rows: Pr3Row[]
}

export function validatePr3(v: Pr3Variant): string[] {
  const errors: string[] = []
  const posInt = (x: number) => Number.isInteger(x) && x >= 1
  if (!posInt(v.n0) || !posInt(v.n)) errors.push('Кількість елементів — ціле додатне число')
  if (!(v.t0 > 0)) errors.push('Час t₀ — додатне число')
  if (!(v.p0 > 0 && v.p0 < 1)) errors.push('P(t₀) — число між 0 і 1')
  if (!(v.r >= 0)) errors.push('Ризик r — невід’ємне число')
  if (!(v.tMax > 0) || !(v.step > 0)) errors.push('Час і крок — додатні числа')
  else if (v.tMax / v.step > 50) errors.push('Замалий крок за часом')
  return errors
}

export function solvePr3(v: Pr3Variant): Pr3Result {
  const errors = validatePr3(v)
  if (errors.length) throw new Error(errors.join('\n'))
  const lambdaSys0 = -Math.log(v.p0) / v.t0
  const lambda = lambdaSys0 / v.n0
  const lambdaSys = v.n * lambda
  const rows: Pr3Row[] = []
  for (let t = 0; t <= v.tMax + 1e-9; t += v.step) {
    const risk = (1 - Math.exp(-lambdaSys * t)) * v.r
    const riskSum = v.n * (1 - Math.exp(-lambda * t)) * v.r
    rows.push({ t, p: Math.exp(-lambdaSys * t), risk, riskSum, g: t === 0 ? 1 : risk / riskSum })
  }
  return { lambdaSys0, lambda, lambdaSys, T: 1 / lambdaSys, rows }
}
