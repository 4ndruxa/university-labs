// Комплексний інтервал у прямокутній формі A = A1 + i·A2
import { Interval, type IntervalLike, type Warn } from './interval'

export class ComplexInterval {
  readonly re: Interval
  readonly im: Interval

  constructor(re: IntervalLike, im: IntervalLike) {
    this.re = Interval.from(re)
    this.im = Interval.from(im)
  }

  static readonly ZERO = new ComplexInterval(0, 0)

  /** A + B = (A1 + B1) + i(A2 + B2) */
  add(b: ComplexInterval): ComplexInterval {
    return new ComplexInterval(this.re.add(b.re), this.im.add(b.im))
  }

  /** A − B = (A1 − B1) + i(A2 − B2) */
  sub(b: ComplexInterval): ComplexInterval {
    return new ComplexInterval(this.re.sub(b.re), this.im.sub(b.im))
  }

  /** A · B = (A1B1 − A2B2) + i(A1B2 + A2B1) */
  mul(b: ComplexInterval): ComplexInterval {
    return new ComplexInterval(
      this.re.mul(b.re).sub(this.im.mul(b.im)),
      this.re.mul(b.im).add(this.im.mul(b.re)),
    )
  }

  /** A ÷ B = (A1B1 + A2B2)/(B1² + B2²) + i(A2B1 − A1B2)/(B1² + B2²) */
  div(b: ComplexInterval, warn?: Warn): ComplexInterval {
    const den = b.re.sqr().add(b.im.sqr())
    return new ComplexInterval(
      this.re.mul(b.re).add(this.im.mul(b.im)).div(den, warn),
      this.im.mul(b.re).sub(this.re.mul(b.im)).div(den, warn),
    )
  }

  equals(b: ComplexInterval, eps = 1e-9): boolean {
    return this.re.equals(b.re, eps) && this.im.equals(b.im, eps)
  }

  toString(digits?: number): string {
    return `${this.re.toString(digits)} + i·${this.im.toString(digits)}`
  }
}
