// ЛР2: надійність і ризик відновлювальної нерезервованої системи
// λc = Σλi;  μc = λc / Σ(λi/μi);  T = 1/λc;  Kr = 1 / (1 + Σλi/μi)
// Kr(t) = μc/(λc+μc) + λc/(λc+μc)·e^(−(λc+μc)t)
// R(t) = ∫₀ᵗ Kr(τ)dτ · Σλi·ri;  оцінки: Kr·t·Σλi·ri ≤ R(t) ≤ t·Σλi·ri

/** Множник таблиць варіантів для λ і μ (уточнення викладача: μ теж ×10⁻⁴) */
export const LR2_SCALE = 1e-4
/** Графік функції готовності — від 0 до 300 год */
export const LR2_T_MAX = 300
export const LR2_T_STEP = 30

export interface Lr2Data {
  lambda: number[] // λi у таблиці (×10⁻⁴ год⁻¹)
  mu: number[] // μi у таблиці (×10⁻⁴ год⁻¹)
  r: number[] // ризик через відмову i-го елемента, ум. од.
  tn: number // загальний час роботи, год
  rd: number // допустимий ризик, ум. од.
}

const BASE: readonly Lr2Data[] = [
  { lambda: [0.2, 0.25, 0.05, 0.06, 0.1, 0.7, 0.34, 0.08], mu: [0.2, 0.16, 0.07, 0.08, 0.8, 1, 0.85, 0.6], r: [65, 38, 3000, 12000, 800, 340, 640, 830], tn: 1200, rd: 1300 },
  { lambda: [0.7, 0.25, 0.3, 0.006, 0.2, 0.6, 0.3, 0.04], mu: [0.1, 0.13, 0.7, 0.03, 0.4, 0.9, 0.01, 0.68], r: [345, 28, 1450, 9000, 675, 34, 165, 15], tn: 1000, rd: 2000 },
  { lambda: [0.2, 0.16, 0.07, 0.08, 0.8, 1, 0.85, 0.6], mu: [0.7, 0.12, 0.5, 0.65, 0.9, 0.03, 1, 0.05], r: [1000, 1390, 23, 678, 435, 8, 11000, 49], tn: 600, rd: 400 },
  { lambda: [0.4, 0.05, 0.78, 0.08, 0.5, 0.9, 0.07, 0.8], mu: [1, 0.09, 0.6, 0.4, 0.55, 0.2, 0.08, 0.7], r: [100, 230, 65, 98, 1289, 3498, 900, 8700], tn: 2000, rd: 500 },
  { lambda: [0.1, 0.2, 0.3, 0.01, 0.02, 0.03, 0.9, 0.7], mu: [0.9, 1, 0.04, 0.05, 0.6, 0.3, 0.76, 0.8], r: [250, 650, 4000, 78, 36, 1389, 6753, 89], tn: 900, rd: 800 },
  { lambda: [0.8, 0.9, 0.8, 0.7, 0.05, 0.04, 0.3, 0.25], mu: [0.05, 1, 0.04, 0.06, 0.5, 0.8, 0.3, 0.7], r: [9000, 489, 675, 659, 239, 45, 98, 3789], tn: 3000, rd: 1300 },
  { lambda: [0.7, 0.6, 0.05, 0.04, 0.8, 0.46, 0.75, 1], mu: [1, 0.6, 0.8, 0.3, 0.5, 1, 0.7, 0.8], r: [400, 789, 10000, 34, 67, 345, 764, 298], tn: 900, rd: 400 },
  { lambda: [1, 0.9, 0.8, 0.7, 0.6, 0.05, 0.43, 0.21], mu: [0.2, 0.7, 1, 0.65, 0.34, 0.9, 0.2, 0.5], r: [987, 3000, 6000, 76, 456, 960, 32, 7896], tn: 800, rd: 300 },
  { lambda: [0.7, 0.83, 0.06, 0.1, 0.53, 0.79, 0.36, 0.56], mu: [0.2, 0.5, 0.7, 0.4, 0.9, 0.5, 0.2, 0.5], r: [500, 39, 5279, 463, 890, 10000, 76, 145], tn: 6000, rd: 1300 },
  { lambda: [0.03, 0.2, 0.6, 0.4, 0.8, 0.4, 1, 1], mu: [0.2, 0.6, 0.5, 0.9, 0.45, 0.36, 0.78, 0.5], r: [876, 450, 95, 1278, 6290, 65, 12000, 547], tn: 1000, rd: 500 },
]

// Варіанти 11–24: кожен показник береться з варіанта, номер якого вказано в таблиці методички
const COMPOSE = {
  lambda: [1, 6, 2, 7, 3, 8, 4, 9, 5, 10, 1, 2, 3, 4],
  mu: [2, 7, 3, 8, 4, 9, 5, 10, 6, 1, 3, 4, 5, 6],
  r: [3, 8, 4, 9, 5, 10, 6, 1, 7, 2, 5, 6, 7, 8],
  tn: [4, 9, 5, 10, 6, 1, 7, 2, 8, 3, 7, 8, 9, 10],
  rd: [5, 10, 6, 1, 7, 2, 8, 3, 9, 4, 9, 10, 1, 2],
}

export const LR2_VARIANTS: readonly Lr2Data[] = [
  ...BASE,
  ...COMPOSE.lambda.map((_, k): Lr2Data => ({
    lambda: BASE[COMPOSE.lambda[k] - 1].lambda,
    mu: BASE[COMPOSE.mu[k] - 1].mu,
    r: BASE[COMPOSE.r[k] - 1].r,
    tn: BASE[COMPOSE.tn[k] - 1].tn,
    rd: BASE[COMPOSE.rd[k] - 1].rd,
  })),
]

/** Звідки взято показники складеного варіанта (11–24), напр. { lambda: 1, mu: 2, … } */
export function lr2Source(variant: number): Record<keyof typeof COMPOSE, number> | null {
  const k = variant - 11
  if (k < 0 || k >= COMPOSE.lambda.length) return null
  return { lambda: COMPOSE.lambda[k], mu: COMPOSE.mu[k], r: COMPOSE.r[k], tn: COMPOSE.tn[k], rd: COMPOSE.rd[k] }
}

export interface Lr2Point {
  t: number
  kr: number
}

export interface Lr2Result {
  lambdaC: number // інтенсивність відмови системи, год⁻¹
  muC: number // інтенсивність відновлення системи, год⁻¹
  sumRatio: number // Σλi/μi
  T: number // напрацювання на відмову, год
  kr: number // коефіцієнт готовності
  sumLr: number // Σλi·ri, ум. од./год
  riskLow: number // Kr·Tn·Σλi·ri
  riskHigh: number // Tn·Σλi·ri
  risk: number // точне значення ∫₀^Tn Kr(τ)dτ · Σλi·ri
  acceptable: boolean // ризик не перевищує допустимого
  points: Lr2Point[]
}

export function validateLr2(d: Lr2Data): string[] {
  const errors: string[] = []
  const n = d.lambda.length
  if (n < 1) errors.push('Потрібен хоча б один елемент')
  if (d.mu.length !== n || d.r.length !== n) errors.push('Для кожного елемента потрібні λ, μ і r')
  if (d.lambda.some((x) => !Number.isFinite(x) || x <= 0)) errors.push('λ — додатні числа')
  if (d.mu.some((x) => !Number.isFinite(x) || x <= 0)) errors.push('μ — додатні числа')
  if (d.r.some((x) => !Number.isFinite(x) || x < 0)) errors.push('r — невід’ємні числа')
  if (!Number.isFinite(d.tn) || d.tn <= 0) errors.push('Tn — додатне число')
  if (!Number.isFinite(d.rd) || d.rd < 0) errors.push('Rд — невід’ємне число')
  return errors
}

/** Функція готовності Kr(t) */
export const readiness = (lambdaC: number, muC: number, t: number): number =>
  muC / (lambdaC + muC) + (lambdaC / (lambdaC + muC)) * Math.exp(-(lambdaC + muC) * t)

export function solveLr2(d: Lr2Data, tMax = LR2_T_MAX, tStep = LR2_T_STEP): Lr2Result {
  const errors = validateLr2(d)
  if (errors.length) throw new Error(errors.join('\n'))
  const lambda = d.lambda.map((x) => x * LR2_SCALE)
  const mu = d.mu.map((x) => x * LR2_SCALE)
  const lambdaC = lambda.reduce((s, x) => s + x, 0)
  const sumRatio = lambda.reduce((s, x, i) => s + x / mu[i], 0)
  const muC = lambdaC / sumRatio
  const kr = 1 / (1 + sumRatio)
  const sumLr = lambda.reduce((s, x, i) => s + x * d.r[i], 0)
  const a = lambdaC + muC
  const integralKr = kr * d.tn + (lambdaC / (a * a)) * (1 - Math.exp(-a * d.tn))
  const risk = integralKr * sumLr
  const points: Lr2Point[] = []
  for (let t = 0; t <= tMax + 1e-9; t += tStep) points.push({ t, kr: readiness(lambdaC, muC, t) })
  return {
    lambdaC,
    muC,
    sumRatio,
    T: 1 / lambdaC,
    kr,
    sumLr,
    riskLow: kr * d.tn * sumLr,
    riskHigh: d.tn * sumLr,
    risk,
    acceptable: risk <= d.rd,
    points,
  }
}
