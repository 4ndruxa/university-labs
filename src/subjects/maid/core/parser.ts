// Розбір і обчислення інтервальних виразів.
//
//   expr     := term (('+' | '−') term)*
//   term     := unary (('·' | '/') unary)*
//   unary    := ('−' | '+') unary | primary
//   primary  := interval | number | '(' expr ')'
//   interval := '[' signed (',' | ';') signed ']'
//
// Кожна виконана операція записується в trace.
import { Interval } from './interval'

export type BinaryOp = '+' | '-' | '*' | '/'

export type Step =
  | { kind: 'binary'; op: BinaryOp; a: Interval; b: Interval; result: Interval; candidates?: number[] }
  | { kind: 'neg'; a: Interval; result: Interval }

export interface EvalResult {
  value: Interval
  trace: Step[]
  warnings: string[]
}

/** pos — індекс символу (з 0) */
export class ParseError extends Error {
  readonly pos: number
  constructor(message: string, pos: number) {
    super(message)
    this.name = 'ParseError'
    this.pos = pos
  }
}

type Token =
  | { kind: 'num'; value: number; pos: number }
  | { kind: 'sym'; value: string; pos: number }
  | { kind: 'end'; pos: number }

const SYMBOL_ALIASES: Record<string, string> = { '−': '-', '–': '-', '·': '*', '×': '*', '÷': '/', ':': '/' }
const SYMBOLS = '+-*/()[],;'

function describe(t: Token): string {
  if (t.kind === 'end') return 'кінець виразу'
  if (t.kind === 'num') return `число ${t.value}`
  return `«${t.value}»`
}

export function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = SYMBOL_ALIASES[src[i]] ?? src[i]
    if (/\s/.test(c)) { i++; continue }
    if (SYMBOLS.includes(c)) { tokens.push({ kind: 'sym', value: c, pos: i }); i++; continue }
    const m = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(src.slice(i))
    if (m) { tokens.push({ kind: 'num', value: Number(m[0]), pos: i }); i += m[0].length; continue }
    throw new ParseError(`Невідомий символ «${src[i]}» (дробові числа пишуться через крапку: 0.5)`, i)
  }
  tokens.push({ kind: 'end', pos: src.length })
  return tokens
}

export function evaluate(src: string): EvalResult {
  const tokens = tokenize(src)
  const trace: Step[] = []
  const warnings: string[] = []
  let p = 0

  const peek = (): Token => tokens[p]
  const isSym = (...values: string[]): boolean => {
    const t = peek()
    return t.kind === 'sym' && values.includes(t.value)
  }
  const fail = (expected: string): never => {
    const t = peek()
    throw new ParseError(`Очікувалося ${expected}, а знайдено ${describe(t)}`, t.pos)
  }
  const expectSym = (value: string, expected = `«${value}»`): void => {
    if (!isSym(value)) fail(expected)
    p++
  }

  function signedNumber(): number {
    let sign = 1
    if (isSym('-')) { p++; sign = -1 } else if (isSym('+')) p++
    const t = peek()
    if (t.kind !== 'num') return fail('число')
    p++
    return sign * t.value
  }

  // pos — початок правого операнда, щоб помилка ділення вказувала на дільник
  function apply(op: BinaryOp, a: Interval, b: Interval, pos: number): Interval {
    let result: Interval
    let candidates: number[] | undefined
    try {
      switch (op) {
        case '+': result = a.add(b); break
        case '-': result = a.sub(b); break
        case '*': candidates = a.products(b); result = a.mul(b); break
        case '/': result = a.div(b, (w) => warnings.push(w)); candidates = a.quotients(b); break
      }
    } catch (e) {
      throw new ParseError((e as Error).message, pos)
    }
    trace.push({ kind: 'binary', op, a, b, result, candidates })
    return result
  }

  function primary(): Interval {
    const t = peek()
    if (isSym('[')) {
      p++
      const lo = signedNumber()
      if (isSym(',', ';')) p++; else fail('«,» або «;» між межами інтервалу')
      const hi = signedNumber()
      if (isSym(';', ',')) fail('«]» (дробові числа пишуться через крапку: [0.5; 1])')
      expectSym(']')
      if (lo > hi) throw new ParseError(`Некоректний інтервал [${lo}; ${hi}]: ліва межа більша за праву`, t.pos)
      return new Interval(lo, hi)
    }
    if (isSym('(')) {
      p++
      const v = expr()
      expectSym(')')
      return v
    }
    if (t.kind === 'num') { p++; return new Interval(t.value) }
    return fail('інтервал, число або «(»')
  }

  function unary(): Interval {
    if (isSym('+')) {
      p++
      return unary()
    }
    if (isSym('-')) {
      p++
      const a = unary()
      const result = a.neg()
      trace.push({ kind: 'neg', a, result })
      return result
    }
    return primary()
  }

  function term(): Interval {
    let v = unary()
    while (isSym('*', '/')) {
      const op = (tokens[p++] as { value: BinaryOp }).value
      const pos = peek().pos
      v = apply(op, v, unary(), pos)
    }
    return v
  }

  function expr(): Interval {
    let v = term()
    while (isSym('+', '-')) {
      const op = (tokens[p++] as { value: BinaryOp }).value
      const pos = peek().pos
      v = apply(op, v, term(), pos)
    }
    return v
  }

  if (peek().kind === 'end') throw new ParseError('Вираз порожній', 0)
  let value: Interval
  try {
    value = expr()
  } catch (e) {
    if (e instanceof ParseError) throw e
    if (e instanceof RangeError) throw new ParseError('Вираз занадто глибоко вкладений', 0)
    throw new ParseError((e as Error).message, peek().pos)
  }
  if (peek().kind !== 'end') fail('оператор або кінець виразу')
  return { value, trace, warnings }
}
