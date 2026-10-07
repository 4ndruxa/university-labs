// Матриці комплексних інтервалів: (A × B)ij = Σk Aik · Bkj
import { ComplexInterval } from './complex'

export type Matrix = ComplexInterval[][]

function size(m: Matrix): [number, number] {
  if (m.length === 0 || m[0].length === 0) throw new Error('Матриця порожня')
  return [m.length, m[0].length]
}

function checkSameSize(a: Matrix, b: Matrix): void {
  const [ra, ca] = size(a)
  const [rb, cb] = size(b)
  if (ra !== rb || ca !== cb) throw new Error(`Матриці мають різні розміри: ${ra}×${ca} і ${rb}×${cb}`)
}

export function matAdd(a: Matrix, b: Matrix): Matrix {
  checkSameSize(a, b)
  return a.map((row, i) => row.map((x, j) => x.add(b[i][j])))
}

export function matSub(a: Matrix, b: Matrix): Matrix {
  checkSameSize(a, b)
  return a.map((row, i) => row.map((x, j) => x.sub(b[i][j])))
}

/** Доданки Aik · Bkj елемента (i, j) */
export function productTerms(a: Matrix, b: Matrix, i: number, j: number): ComplexInterval[] {
  return a[i].map((aik, k) => aik.mul(b[k][j]))
}

export function matMul(a: Matrix, b: Matrix): Matrix {
  const [ra, ca] = size(a)
  const [rb, cb] = size(b)
  if (ca !== rb) throw new Error(`Не можна помножити матриці ${ra}×${ca} і ${rb}×${cb}`)
  return a.map((_, i) =>
    Array.from({ length: cb }, (_, j) =>
      productTerms(a, b, i, j).reduce((sum, t) => sum.add(t), ComplexInterval.ZERO)))
}
