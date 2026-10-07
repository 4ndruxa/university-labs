import { laplace, laplaceTable } from './laplace'
import { empiricalP, histogram, mean, sampleStd, type Bin } from './statistics'

export interface Lab2Variant {
  data: number[] // напрацювання 25 об'єктів до відмови, год
  step: number // крок гістограми, год
}

export const LAB2_VARIANTS: readonly Lab2Variant[] = [
  { data: [1, 24, 32, 18, 34, 26, 10, 25, 13, 34, 16, 35, 23, 16, 25, 11, 7, 5, 46, 47, 4, 28, 15, 1, 28], step: 10 },
  { data: [9, 18, 1, 20, 2, 6, 13, 23, 6, 25, 22, 19, 22, 24, 7, 17, 13, 19, 14, 18, 10, 25, 11, 16, 6], step: 5 },
  { data: [38, 52, 26, 22, 53, 62, 8, 72, 48, 25, 50, 71, 24, 70, 41, 35, 74, 61, 59, 55, 47, 16, 60, 68, 18], step: 15 },
]

/** P(t) рахуємо протягом 20 год з кроком 5 год */
export const LAB2_TIMES = [0, 5, 10, 15, 20]

export interface PRow {
  t: number
  pExp: number // e^(−λt)
  x: number // (t − t̄) / s
  xTable: number // x, округлене до 0,01
  phiTable: number // Φ(x) з таблиці
  pNormal: number // 0,5 − Φ(x) за таблицею
  pNormalExact: number // 0,5 − Φ(x) точно
  pEmp: number
}

export interface Lab2Result {
  n: number
  mean: number
  std: number
  lambda: number
  bins: Bin[]
  rows: PRow[]
}

export function validateLab2(data: readonly number[], step: number): string[] {
  const errors: string[] = []
  if (data.length < 2) errors.push('Потрібно щонайменше 2 значення')
  if (data.some((x) => !Number.isFinite(x) || x <= 0)) errors.push('Напрацювання — додатні числа')
  else if (data.length >= 2 && data.every((x) => x === data[0])) errors.push('Значення не можуть бути всі однакові')
  if (!Number.isFinite(step) || step <= 0) errors.push('Крок гістограми — додатне число')
  else if (data.every((x) => Number.isFinite(x)) && Math.max(...data) / step > 100) errors.push('Замалий крок гістограми')
  return errors
}

export function solveLab2(data: readonly number[], step: number, times: readonly number[] = LAB2_TIMES): Lab2Result {
  const errors = validateLab2(data, step)
  if (errors.length) throw new Error(errors.join('\n'))
  const m = mean(data)
  const s = sampleStd(data)
  const lambda = 1 / m
  const rows = times.map((t): PRow => {
    const x = (t - m) / s
    const table = laplaceTable(x)
    return {
      t,
      pExp: Math.exp(-lambda * t),
      x,
      xTable: table.x,
      phiTable: table.phi,
      pNormal: 0.5 - table.phi,
      pNormalExact: 0.5 - laplace(x),
      pEmp: empiricalP(data, t),
    }
  })
  return { n: data.length, mean: m, std: s, lambda, bins: histogram(data, step), rows }
}
