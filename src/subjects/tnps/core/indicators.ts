// Статистичні показники надійності за даними випробувань (лекція 1)

export interface TestData {
  n0: number // кількість зразків
  totalTime: number // сумарний час випробувань, год
  failures: number[] // відмови по однакових інтервалах
}

export interface IntervalRow {
  index: number // 1…k
  t0: number
  t1: number
  failed: number // n(Δt)
  nStart: number // N(t0)
  nEnd: number // N(t1)
  p: number // P(t1) = N(t1)/N0
  q: number // Q(t1) = 1 − P(t1)
  f: number // n/(N0·Δt)
  lambda: number | null // n/(N(t0)·Δt); null, якщо N(t0) = 0
  lambdaAvg: number | null // n/(Nсер·Δt), Nсер = (N(t0) + N(t1))/2
  tMid: number
}

export interface Indicators {
  dt: number
  rows: IntervalRow[]
  meanTime: number // T = Σ nᵢ·tᵢ / N0, tᵢ — середина інтервалу
}

export function validateTestData(d: TestData): string[] {
  const errors: string[] = []
  if (!Number.isInteger(d.n0) || d.n0 < 1) errors.push('Кількість зразків — ціле число ≥ 1')
  if (!Number.isFinite(d.totalTime) || d.totalTime <= 0) errors.push('Сумарний час — додатне число')
  if (d.failures.length === 0) errors.push('Вкажіть відмови хоча б для одного інтервалу')
  else if (d.failures.some((n) => !Number.isInteger(n) || n < 0)) errors.push('Відмови — цілі невід\'ємні числа')
  else if (Number.isInteger(d.n0) && d.failures.reduce((a, b) => a + b, 0) !== d.n0) {
    errors.push(`Сума відмов (${d.failures.reduce((a, b) => a + b, 0)}) має дорівнювати кількості зразків (${d.n0})`)
  }
  return errors
}

export function computeIndicators(d: TestData): Indicators {
  const errors = validateTestData(d)
  if (errors.length) throw new Error(errors.join('\n'))
  const dt = d.totalTime / d.failures.length
  let alive = d.n0
  const rows = d.failures.map((failed, i): IntervalRow => {
    const nStart = alive
    const nEnd = alive - failed
    alive = nEnd
    const t0 = i * dt
    const t1 = (i + 1) * dt
    const nAvg = (nStart + nEnd) / 2
    return {
      index: i + 1,
      t0,
      t1,
      failed,
      nStart,
      nEnd,
      p: nEnd / d.n0,
      q: 1 - nEnd / d.n0,
      f: failed / (d.n0 * dt),
      lambda: nStart > 0 ? failed / (nStart * dt) : null,
      lambdaAvg: nAvg > 0 ? failed / (nAvg * dt) : null,
      tMid: (t0 + t1) / 2,
    }
  })
  const meanTime = rows.reduce((s, r) => s + r.failed * r.tMid, 0) / d.n0
  return { dt, rows, meanTime }
}
