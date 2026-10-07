export const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length

/** Вибіркове стандартне відхилення (n − 1) */
export function sampleStd(xs: readonly number[]): number {
  const m = mean(xs)
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1))
}

export interface Bin {
  from: number
  to: number
  count: number
}

/** Інтервали [a; a + h) від 0; значення на межі потрапляє в правий інтервал */
export function histogram(xs: readonly number[], h: number): Bin[] {
  const k = Math.floor(Math.max(...xs) / h) + 1
  const bins = Array.from({ length: k }, (_, i): Bin => ({ from: i * h, to: (i + 1) * h, count: 0 }))
  for (const x of xs) bins[Math.floor(x / h)].count++
  return bins
}

/** Частка об'єктів, що пропрацювали більше t */
export const empiricalP = (xs: readonly number[], t: number): number => xs.filter((x) => x > t).length / xs.length
