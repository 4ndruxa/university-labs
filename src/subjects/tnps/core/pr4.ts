// ПР4: метод структурних схем (лекція, тема 5)
// Послідовне з'єднання: P = ΠPᵢ;  паралельне: P = 1 − Π(1 − Pᵢ)
// Схема описується деревом; з того самого опису малюється рисунок і рахується згортка

export type Scheme =
  | { type: 'el'; id: number }
  | { type: 'ser'; items: Scheme[] }
  | { type: 'par'; items: Scheme[] }

const el = (id: number): Scheme => ({ type: 'el', id })
const ser = (...items: Scheme[]): Scheme => ({ type: 'ser', items })
const par = (...items: Scheme[]): Scheme => ({ type: 'par', items })

/** Схема з бланка ПР4 */
export const PR4_SCHEME: Scheme = ser(
  el(1),
  par(par(el(2), el(3)), el(4)),
  par(el(6), el(5)),
  par(ser(par(el(7), el(8), el(9)), par(el(10), el(11))), el(12)),
  el(13),
  par(par(el(16), el(17)), par(el(14), el(15))),
  par(el(18), el(19)),
  el(20),
)

/** Показник надійності елемента: відома P, Q або λ (у таблиці ×10⁻⁴ год⁻¹) */
export type ElementData = { p: number } | { q: number } | { lambda: number }

export const PR4_SCALE = 1e-4
export const PR4_TIME = 400

export const PR4_DATA: Record<number, ElementData> = {
  1: { p: 0.7 },
  2: { lambda: 5 },
  3: { lambda: 8 },
  4: { q: 0.13 },
  5: { lambda: 1 },
  6: { p: 0.78 },
  7: { lambda: 2 },
  8: { lambda: 6 },
  9: { q: 0.1 },
  10: { lambda: 1.5 },
  11: { lambda: 13 },
  12: { p: 0.9 },
  13: { q: 0.25 },
  14: { p: 0.94 },
  15: { lambda: 4 },
  16: { q: 0.2 },
  17: { lambda: 0.1 },
  18: { q: 0.18 },
  19: { lambda: 7 },
  20: { p: 0.95 },
}

export function elementP(d: ElementData, t: number): number {
  if ('p' in d) return d.p
  if ('q' in d) return 1 - d.q
  return Math.exp(-d.lambda * PR4_SCALE * t)
}

/** Номери елементів схеми зліва направо */
export function elementIds(s: Scheme): number[] {
  return s.type === 'el' ? [s.id] : s.items.flatMap(elementIds)
}

export interface Step {
  name: string // позначення блоку: I, II, …
  type: 'ser' | 'par'
  parts: string[] // складові: «P₂», «P_I»
  values: number[]
  p: number
}

export interface Pr4Result {
  elements: { id: number; data: ElementData; p: number }[]
  steps: Step[]
  p: number
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI']

/** Згортка схеми знизу вгору; останній крок — уся система */
export function solvePr4(scheme: Scheme, data: Record<number, ElementData>, t: number): Pr4Result {
  const ids = elementIds(scheme)
  const missing = ids.filter((id) => !data[id])
  if (missing.length) throw new Error(`Немає даних для елементів: ${missing.join(', ')}`)
  const pOf = new Map(ids.map((id) => [id, elementP(data[id], t)]))
  const steps: Step[] = []

  const walk = (s: Scheme): { label: string; p: number } => {
    if (s.type === 'el') return { label: `P${s.id}`, p: pOf.get(s.id)! }
    const kids = s.items.map(walk)
    const values = kids.map((k) => k.p)
    const p = s.type === 'ser' ? values.reduce((a, x) => a * x, 1) : 1 - values.reduce((a, x) => a * (1 - x), 1)
    const name = s === scheme ? 'сист' : ROMAN[steps.length]
    steps.push({ name, type: s.type, parts: kids.map((k) => k.label), values, p })
    return { label: `P${name}`, p }
  }

  const p = walk(scheme).p
  return { elements: [...ids].sort((a, b) => a - b).map((id) => ({ id, data: data[id], p: pOf.get(id)! })), steps, p }
}
