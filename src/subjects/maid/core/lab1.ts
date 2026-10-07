// ЛР1: K = X + i·Y, де X — значення виразу, Y — за правилом варіанту
import { ComplexInterval } from './complex'
import { Interval, type Warn } from './interval'
import { evaluate, type EvalResult } from './parser'
import type { ImagRule } from './variants'

export function imagPart(x: Interval, rule: ImagRule, warn?: Warn): Interval {
  const arg = Interval.from(rule.arg)
  switch (rule.op) {
    case '+': return x.add(arg)
    case '-': return x.sub(arg)
    case '*': return x.mul(arg)
    case '/': return x.div(arg, warn)
  }
}

export interface Lab1Result {
  expr1: EvalResult
  expr2: EvalResult
  k1: ComplexInterval
  k2: ComplexInterval
  sum: ComplexInterval
  diff: ComplexInterval
  prod: ComplexInterval
  warnings: string[]
}

export function solveLab1(e1: string, e2: string, rule: ImagRule): Lab1Result {
  const expr1 = evaluate(e1)
  const expr2 = evaluate(e2)
  const warnings = [
    ...expr1.warnings.map((w) => `Вираз 1: ${w}`),
    ...expr2.warnings.map((w) => `Вираз 2: ${w}`),
  ]
  const warn: Warn = (w) => warnings.push(`Уявна частина: ${w}`)
  const k1 = new ComplexInterval(expr1.value, imagPart(expr1.value, rule, warn))
  const k2 = new ComplexInterval(expr2.value, imagPart(expr2.value, rule, warn))
  return { expr1, expr2, k1, k2, sum: k1.add(k2), diff: k1.sub(k2), prod: k1.mul(k2), warnings }
}
