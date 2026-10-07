// Функція Лапласа Φ(x) = (1/√(2π))·∫₀ˣ e^(−z²/2) dz, Φ(−x) = −Φ(x)

/** Точне значення: ряд Φ(x) = φ(x)·(x + x³/3 + x⁵/(3·5) + …) (Марсалья) */
export function laplace(x: number): number {
  const a = Math.abs(x)
  if (a > 8) return Math.sign(x) * 0.5
  let term = a
  let sum = a
  for (let n = 1; term > 1e-17 * sum; n++) {
    term *= (a * a) / (2 * n + 1)
    sum += term
  }
  const phi = Math.exp(-a * a / 2) / Math.sqrt(2 * Math.PI)
  return Math.sign(x) * phi * sum
}

const round = (x: number, digits: number) => Math.round(x * 10 ** digits) / 10 ** digits

/** Як із таблиці: x округлено до 0,01, Φ — до 4 знаків */
export function laplaceTable(x: number): { x: number; phi: number } {
  const xr = round(x, 2)
  return { x: xr, phi: round(laplace(xr), 4) }
}
