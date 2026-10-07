// Дійсний інтервал [a1; a2]
import { fmtHi, fmtLo } from './format'

export type Warn = (message: string) => void
export type IntervalLike = Interval | readonly [number, number] | number

export class Interval {
  readonly lo: number
  readonly hi: number

  constructor(lo: number, hi: number = lo) {
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) throw new Error('Межі інтервалу мають бути скінченними числами')
    if (lo > hi) throw new Error(`Некоректний інтервал [${lo}; ${hi}]: ліва межа більша за праву`)
    this.lo = lo + 0 // −0 → 0
    this.hi = hi + 0
  }

  static from(x: IntervalLike): Interval {
    if (x instanceof Interval) return x
    if (typeof x === 'number') return new Interval(x, x)
    return new Interval(x[0], x[1])
  }

  /** A + B = [a1 + b1; a2 + b2] */
  add(other: IntervalLike): Interval {
    const b = Interval.from(other)
    return new Interval(this.lo + b.lo, this.hi + b.hi)
  }

  /** A − B = [a1 − b2; a2 − b1] */
  sub(other: IntervalLike): Interval {
    const b = Interval.from(other)
    return new Interval(this.lo - b.hi, this.hi - b.lo)
  }

  /** Чотири добутки кінців {a1b1, a1b2, a2b1, a2b2} */
  products(other: IntervalLike): number[] {
    const b = Interval.from(other)
    return [this.lo * b.lo, this.lo * b.hi, this.hi * b.lo, this.hi * b.hi]
  }

  /** Чотири частки кінців {a1/b1, a1/b2, a2/b1, a2/b2} */
  quotients(other: IntervalLike): number[] {
    const b = Interval.from(other)
    return [this.lo / b.lo, this.lo / b.hi, this.hi / b.lo, this.hi / b.hi]
  }

  /** A · B = [min{a1b1, a1b2, a2b1, a2b2}; max{…}] */
  mul(other: IntervalLike): Interval {
    const p = this.products(other)
    return new Interval(Math.min(...p), Math.max(...p))
  }

  /**
   * A / B = [min{a1/b1, a1/b2, a2/b1, a2/b2}; max{…}]
   * 0 усередині B: те саме правило, що в лекції (приклад 3), з попередженням через warn.
   */
  div(other: IntervalLike, warn?: Warn): Interval {
    const b = Interval.from(other)
    if (b.lo === 0 || b.hi === 0) throw new Error(`Ділення на ${b} неможливе: межа дільника дорівнює 0`)
    if (b.lo < 0 && b.hi > 0) warn?.(`дільник ${b} містить 0 — застосовано правило min/max чотирьох часток (лекція 1, приклад 3)`)
    const q = this.quotients(b)
    return new Interval(Math.min(...q), Math.max(...q))
  }

  /** −A = [−a2; −a1] */
  neg(): Interval {
    return new Interval(-this.hi, -this.lo)
  }

  /** {x² | x ∈ A} */
  sqr(): Interval {
    const a = this.lo * this.lo
    const b = this.hi * this.hi
    return this.contains(0) ? new Interval(0, Math.max(a, b)) : new Interval(Math.min(a, b), Math.max(a, b))
  }

  contains(x: number): boolean {
    return this.lo <= x && x <= this.hi
  }

  /** wid(A) = a2 − a1 */
  get width(): number {
    return this.hi - this.lo
  }

  /** mid(A) = (a1 + a2) / 2 */
  get mid(): number {
    return (this.lo + this.hi) / 2
  }

  equals(other: IntervalLike, eps = 1e-9): boolean {
    const b = Interval.from(other)
    return Math.abs(this.lo - b.lo) <= eps && Math.abs(this.hi - b.hi) <= eps
  }

  toString(digits?: number): string {
    return `[${fmtLo(this.lo, digits)}; ${fmtHi(this.hi, digits)}]`
  }
}
