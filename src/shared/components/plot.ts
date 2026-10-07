// Поділки осей і масштабування для SVG-графіків

export function niceTicks(min: number, max: number, count = 6): number[] {
  if (min === max) { min -= 1; max += 1 }
  const raw = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const ticks: number[] = []
  for (let t = Math.ceil(min / step) * step; t <= max + step * 1e-9; t += step) ticks.push(Math.abs(t) < step * 1e-9 ? 0 : t)
  return ticks
}

export function scale(d0: number, d1: number, r0: number, r1: number): (x: number) => number {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  return (x) => r0 + (x - d0) * k
}

export function padded(min: number, max: number, frac = 0.08): [number, number] {
  const span = max - min || Math.abs(max) || 1
  return [min - span * frac, max + span * frac]
}

export const fmtTick = (t: number): string => (Math.abs(t) >= 1000 ? `${t / 1000}k` : String(Number(t.toPrecision(6))))
