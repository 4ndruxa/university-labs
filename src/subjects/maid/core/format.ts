// Межі округлюються назовні (ліва вниз, права вгору), щоб показаний інтервал містив точний

export const DIGITS = 4

const noMinusZero = (x: number): number => (Object.is(x, -0) ? 0 : x)

function roundDir(x: number, digits: number, dir: 'down' | 'up'): number {
  const k = 10 ** digits
  const scaled = x * k
  if (!Number.isFinite(scaled)) return x
  const nearest = Math.round(scaled)
  // Не розширюємо інтервал через похибку float (0.1 + 0.2)
  if (Math.abs(scaled - nearest) < 1e-9 * Math.max(1, Math.abs(scaled))) return noMinusZero(nearest / k)
  return noMinusZero((dir === 'down' ? Math.floor(scaled) : Math.ceil(scaled)) / k)
}

export const fmtLo = (x: number, digits = DIGITS): string => String(roundDir(x, digits, 'down'))
export const fmtHi = (x: number, digits = DIGITS): string => String(roundDir(x, digits, 'up'))
export const fmtNum = (x: number, digits = DIGITS): string => String(noMinusZero(Number(x.toFixed(digits))))
