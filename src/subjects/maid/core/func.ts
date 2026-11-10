// Функції однієї змінної: розбір формули f(x) і обчислення — у точці (число) та на інтервалі
// (природне інтервальне розширення: кожна операція замінюється інтервальною).
//
//   expr    := term (('+' | '−') term)*
//   term    := unary (('·' | '/' | неявне множення) unary)*
//   unary   := ('−' | '+') unary | power
//   power   := primary ('^' unary)?                 — правоасоціативний: 2^3^2 = 2^(3^2)
//   primary := число | x | pi | e | функція | '(' expr ')'
//   функція := ім'я ('^' число)? '(' expr (',' expr)? ')'   — sin^2(x) = sin(x)^2
import { Interval } from './interval'

export type Node =
  | { k: 'num'; v: number }
  | { k: 'x' }
  | { k: 'neg'; a: Node }
  | { k: 'bin'; op: '+' | '-' | '*' | '/'; a: Node; b: Node }
  | { k: 'pow'; a: Node; b: Node }
  | { k: 'fn'; name: FnName; args: Node[] }

const FUNCTIONS = ['sin', 'cos', 'tan', 'ctg', 'ln', 'lg', 'exp', 'sqrt', 'abs', 'root'] as const
export type FnName = (typeof FUNCTIONS)[number]
const ALIASES: Record<string, FnName> = { tg: 'tan', cot: 'ctg', log: 'ln' }

/** pos — індекс символу (з 0) */
export class FuncError extends Error {
  readonly pos: number
  constructor(message: string, pos: number) {
    super(message)
    this.name = 'FuncError'
    this.pos = pos
  }
}

/** Значення не існує: ln від недодатного, ділення на 0 тощо */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

// ---------- Розбір ----------

type Token =
  | { t: 'num'; v: number; pos: number }
  | { t: 'id'; v: string; pos: number }
  | { t: 'sym'; v: string; pos: number }
  | { t: 'end'; pos: number }

const NORMALIZE: Record<string, string> = { '−': '-', '–': '-', '·': '*', '×': '*', '÷': '/', 'π': 'pi', '²': '^2', '³': '^3', ';': ',' }

function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) { i++; continue }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i))
      if (!m) throw new FuncError(`Некоректне число на позиції ${i + 1}`, i)
      tokens.push({ t: 'num', v: Number(m[0]), pos: i })
      i += m[0].length
      continue
    }
    if (/[a-zA-Zа-яА-Я]/.test(c)) {
      const m = /^[a-zA-Zа-яА-Я]+/.exec(src.slice(i))!
      // «xsin» або «2xx» — розбиваємо на x і решту, щоб працювало неявне множення
      let word = m[0].toLowerCase()
      let at = i
      while (word.startsWith('x') && word !== 'x' && !FUNCTIONS.some((f) => word === f) && !(word in ALIASES)) {
        tokens.push({ t: 'id', v: 'x', pos: at })
        word = word.slice(1)
        at++
      }
      tokens.push({ t: 'id', v: word, pos: at })
      i += m[0].length
      continue
    }
    const sym = NORMALIZE[c] ?? c
    if (sym.length > 1 && sym.startsWith('^')) {
      tokens.push({ t: 'sym', v: '^', pos: i }, { t: 'num', v: Number(sym.slice(1)), pos: i })
    } else if (sym === 'pi') {
      tokens.push({ t: 'id', v: 'pi', pos: i })
    } else if ('+-*/^(),'.includes(sym)) {
      tokens.push({ t: 'sym', v: sym, pos: i })
    } else {
      throw new FuncError(`Недопустимий символ «${c}» на позиції ${i + 1}`, i)
    }
    i++
  }
  tokens.push({ t: 'end', pos: src.length })
  return tokens
}

export function parseFunction(src: string): Node {
  if (!src.trim()) throw new FuncError('Введіть формулу', 0)
  const tokens = tokenize(src)
  let p = 0
  const peek = () => tokens[p]
  const isSym = (v: string) => peek().t === 'sym' && (peek() as { v: string }).v === v
  const expect = (v: string) => {
    if (!isSym(v)) throw new FuncError(`Очікується «${v}» на позиції ${peek().pos + 1}`, peek().pos)
    p++
  }

  function expr(): Node {
    let a = term()
    while (isSym('+') || isSym('-')) {
      const op = (tokens[p++] as { v: '+' | '-' }).v
      a = { k: 'bin', op, a, b: term() }
    }
    return a
  }
  // Неявне множення: 2x, 2sin(x), x(x+1), (x+1)(x−1)
  const startsPrimary = () => peek().t === 'num' || peek().t === 'id' || isSym('(')
  function term(): Node {
    let a = unary()
    for (;;) {
      if (isSym('*') || isSym('/')) {
        const op = (tokens[p++] as { v: '*' | '/' }).v
        a = { k: 'bin', op, a, b: unary() }
      } else if (startsPrimary()) {
        a = { k: 'bin', op: '*', a, b: power() }
      } else return a
    }
  }
  function unary(): Node {
    if (isSym('-')) { p++; return { k: 'neg', a: unary() } }
    if (isSym('+')) { p++; return unary() }
    return power()
  }
  function power(): Node {
    const a = primary()
    if (isSym('^')) { p++; return { k: 'pow', a, b: unary() } }
    return a
  }
  function primary(): Node {
    const tok = peek()
    if (tok.t === 'num') { p++; return { k: 'num', v: tok.v } }
    if (isSym('(')) {
      p++
      const e = expr()
      expect(')')
      return e
    }
    if (tok.t === 'id') {
      p++
      if (tok.v === 'x') return { k: 'x' }
      if (tok.v === 'pi') return { k: 'num', v: Math.PI }
      if (tok.v === 'e') return { k: 'num', v: Math.E }
      const name = (ALIASES[tok.v] ?? tok.v) as FnName
      if (!FUNCTIONS.includes(name)) throw new FuncError(`Невідома назва «${tok.v}» на позиції ${tok.pos + 1}`, tok.pos)
      // sin^2(x)
      let exponent: Node | null = null
      if (isSym('^')) {
        p++
        const e = peek()
        if (e.t !== 'num') throw new FuncError(`Після «${tok.v}^» очікується число`, e.pos)
        p++
        exponent = { k: 'num', v: e.v }
      }
      if (!isSym('(')) throw new FuncError(`Після «${tok.v}» очікується «(» на позиції ${peek().pos + 1}`, peek().pos)
      p++
      const args = [expr()]
      while (isSym(',')) { p++; args.push(expr()) }
      expect(')')
      const need = name === 'root' ? 2 : 1
      if (args.length !== need) {
        throw new FuncError(name === 'root' ? 'root(вираз, n) має два аргументи' : `${name}(…) має один аргумент`, tok.pos)
      }
      if (name === 'root') {
        const n = args[1]
        if (n.k !== 'num' || !Number.isInteger(n.v) || n.v < 2) throw new FuncError('Степінь кореня root(вираз, n) — ціле число від 2', tok.pos)
      }
      const call: Node = { k: 'fn', name, args }
      return exponent ? { k: 'pow', a: call, b: exponent } : call
    }
    if (tok.t === 'end') throw new FuncError('Вираз обірвався: очікується число, x або «(»', tok.pos)
    throw new FuncError(`Неочікуваний символ «${tok.v}» на позиції ${tok.pos + 1}`, tok.pos)
  }

  const node = expr()
  if (peek().t !== 'end') {
    const t = peek()
    throw new FuncError(`Зайвий символ «${t.t === 'end' ? '' : t.v}» на позиції ${t.pos + 1}`, t.pos)
  }
  return node
}

// ---------- Запис формули (для перегляду та звіту) ----------

const PREC = { add: 1, mul: 2, neg: 3, pow: 4, atom: 5 }
function prec(n: Node): number {
  if (n.k === 'bin') return n.op === '+' || n.op === '-' ? PREC.add : PREC.mul
  if (n.k === 'neg') return PREC.neg
  if (n.k === 'pow') return PREC.pow
  return n.k === 'num' && n.v < 0 ? PREC.neg : PREC.atom
}
const num = (v: number) => (v === Math.PI ? 'π' : v === Math.E ? 'e' : String(v).replace('-', '−'))

export function formatFunction(n: Node): string {
  const wrap = (c: Node, min: number) => (prec(c) < min ? `(${formatFunction(c)})` : formatFunction(c))
  switch (n.k) {
    case 'num': return num(n.v)
    case 'x': return 'x'
    case 'neg': return `−${wrap(n.a, PREC.neg)}`
    case 'pow': return `${wrap(n.a, PREC.atom)}^${wrap(n.b, PREC.atom)}`
    case 'fn': return `${n.name}(${n.args.map(formatFunction).join(', ')})`
    case 'bin': {
      const p = prec(n)
      const sign = { '+': ' + ', '-': ' − ', '*': '·', '/': '/' }[n.op]
      // права частина віднімання/ділення — у дужках, якщо того самого рівня
      return `${wrap(n.a, p)}${sign}${wrap(n.b, n.op === '-' || n.op === '/' ? p + 1 : p)}`
    }
  }
}

// ---------- Обчислення в точці ----------

function rootReal(u: number, n: number): number {
  if (u < 0) {
    if (n % 2 === 0) throw new DomainError(`корінь парного степеня ${n} з від’ємного числа`)
    return -((-u) ** (1 / n))
  }
  return u ** (1 / n)
}

function powReal(a: number, b: number): number {
  if (Number.isInteger(b)) return a ** b
  if (a < 0) throw new DomainError('нецілий степінь від’ємного числа — використайте root(вираз, n)')
  return a ** b
}

export function evalAt(n: Node, x: number): number {
  const r = (m: Node) => evalAt(m, x)
  let v: number
  switch (n.k) {
    case 'num': return n.v
    case 'x': return x
    case 'neg': return -r(n.a)
    case 'pow': v = powReal(r(n.a), r(n.b)); break
    case 'bin': {
      const a = r(n.a)
      const b = r(n.b)
      if (n.op === '/' && b === 0) throw new DomainError('ділення на 0')
      v = n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b : a / b
      break
    }
    case 'fn': {
      const u = r(n.args[0])
      switch (n.name) {
        case 'sin': v = Math.sin(u); break
        case 'cos': v = Math.cos(u); break
        case 'tan': v = Math.tan(u); break
        case 'ctg': v = Math.cos(u) / Math.sin(u); break
        case 'exp': v = Math.exp(u); break
        case 'abs': v = Math.abs(u); break
        case 'ln':
        case 'lg':
          if (u <= 0) throw new DomainError(`${n.name} від недодатного числа`)
          v = n.name === 'ln' ? Math.log(u) : Math.log10(u)
          break
        case 'sqrt':
          if (u < 0) throw new DomainError('квадратний корінь з від’ємного числа')
          v = Math.sqrt(u)
          break
        case 'root': v = rootReal(u, (n.args[1] as { v: number }).v); break
      }
    }
  }
  if (!Number.isFinite(v)) throw new DomainError('значення нескінченне')
  return v
}

// ---------- Обчислення на інтервалі ----------

/** Розширення на кілька ulp: Math.sin, Math.exp тощо не мають гарантованого округлення */
function widen(lo: number, hi: number): Interval {
  const d = (x: number) => Math.abs(x) * 4e-16 + 1e-300
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) throw new DomainError('значення нескінченне')
  return new Interval(lo - d(lo), hi + d(hi))
}

const mono = (X: Interval, f: (t: number) => number): Interval => widen(f(X.lo), f(X.hi))

/** Чи є в [lo; hi] точка виду c + k·period */
function hits(X: Interval, c: number, period: number): boolean {
  return Math.ceil((X.lo - c) / period) <= Math.floor((X.hi - c) / period)
}

function sinI(X: Interval): Interval {
  if (X.width >= 2 * Math.PI) return new Interval(-1, 1)
  const a = Math.sin(X.lo)
  const b = Math.sin(X.hi)
  const lo = hits(X, -Math.PI / 2, 2 * Math.PI) ? -1 : Math.min(a, b)
  const hi = hits(X, Math.PI / 2, 2 * Math.PI) ? 1 : Math.max(a, b)
  const w = widen(lo, hi)
  return new Interval(Math.max(-1, w.lo), Math.min(1, w.hi))
}

const cosI = (X: Interval): Interval => sinI(X.add(Math.PI / 2))

function powIntI(X: Interval, n: number): Interval {
  if (n === 0) return new Interval(1)
  if (n < 0) return divI(new Interval(1), powIntI(X, -n))
  if (n % 2 === 1) return mono(X, (t) => t ** n)
  const a = Math.abs(X.lo) ** n
  const b = Math.abs(X.hi) ** n
  return X.contains(0) ? new Interval(0, widen(0, Math.max(a, b)).hi) : widen(Math.min(a, b), Math.max(a, b))
}

function divI(A: Interval, B: Interval): Interval {
  if (B.contains(0)) throw new DomainError(`ділення на інтервал ${B}, що містить 0`)
  const q = A.quotients(B)
  return widen(Math.min(...q), Math.max(...q))
}

function lnI(X: Interval): Interval {
  if (X.lo <= 0) throw new DomainError(`ln на інтервалі ${X}, що містить недодатні числа`)
  return mono(X, Math.log)
}

function powI(A: Interval, B: Interval, bNode: Node): Interval {
  // цілий сталий показник: x^3, (x−2)^3, sin(x)^2
  if (bNode.k === 'num' && Number.isInteger(bNode.v)) return powIntI(A, bNode.v)
  if (A.lo <= 0) throw new DomainError(`нецілий степінь інтервалу ${A}, що містить недодатні числа`)
  // A^B = exp(B·ln A)
  return mono(B.mul(lnI(A)), Math.exp)
}

export function evalInterval(n: Node, X: Interval): Interval {
  const r = (m: Node) => evalInterval(m, X)
  switch (n.k) {
    case 'num': return new Interval(n.v)
    case 'x': return X
    case 'neg': return r(n.a).neg()
    case 'pow': return powI(r(n.a), r(n.b), n.b)
    case 'bin': {
      const a = r(n.a)
      const b = r(n.b)
      if (n.op === '/') return divI(a, b)
      const v = n.op === '+' ? a.add(b) : n.op === '-' ? a.sub(b) : a.mul(b)
      return widen(v.lo, v.hi)
    }
    case 'fn': {
      const U = r(n.args[0])
      switch (n.name) {
        case 'sin': return sinI(U)
        case 'cos': return cosI(U)
        case 'tan':
          if (hits(U, Math.PI / 2, Math.PI)) throw new DomainError(`tan на інтервалі ${U}: функція має розрив`)
          return mono(U, Math.tan)
        case 'ctg':
          if (hits(U, 0, Math.PI)) throw new DomainError(`ctg на інтервалі ${U}: функція має розрив`)
          // на одній гілці ctg спадає
          return widen(1 / Math.tan(U.hi), 1 / Math.tan(U.lo))
        case 'exp': return mono(U, Math.exp)
        case 'abs':
          return U.contains(0) ? widen(0, Math.max(-U.lo, U.hi)) : widen(Math.min(Math.abs(U.lo), Math.abs(U.hi)), Math.max(Math.abs(U.lo), Math.abs(U.hi)))
        case 'ln': return lnI(U)
        case 'lg': return mono(lnI(U), (t) => t / Math.LN10)
        case 'sqrt':
          if (U.lo < 0) throw new DomainError(`квадратний корінь на інтервалі ${U}, що містить від’ємні числа`)
          return mono(U, Math.sqrt)
        case 'root': {
          const k = (n.args[1] as { v: number }).v
          if (k % 2 === 0 && U.lo < 0) throw new DomainError(`корінь парного степеня на інтервалі ${U}, що містить від’ємні числа`)
          return mono(U, (t) => rootReal(t, k))
        }
      }
    }
  }
}

/** Похідна, введена користувачем, порівнюється з чисельною (центральна різниця) */
export function derivativeMismatch(f: Node, df: Node, a: number, b: number, points = 21): number | null {
  for (let i = 0; i < points; i++) {
    const x = a + ((b - a) * (i + 0.5)) / points
    const h = 1e-6 * Math.max(1, Math.abs(x))
    try {
      const numeric = (evalAt(f, x + h) - evalAt(f, x - h)) / (2 * h)
      const given = evalAt(df, x)
      if (Math.abs(numeric - given) > 1e-4 * Math.max(1, Math.abs(numeric))) return x
    } catch {
      // точку поза областю визначення пропускаємо — про неї повідомить перевірка області
    }
  }
  return null
}
