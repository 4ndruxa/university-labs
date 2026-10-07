import { describe, expect, it } from 'vitest'
import { ComplexInterval, matAdd, matMul, matSub, productTerms, type Matrix } from '../../../src/subjects/maid/core'
import { expectComplex } from './helpers'

describe('Лекція 2: комплексні інтервали, A = [2; 4] + i[1; 3], B = [1; 1] + i[2; 3]', () => {
  const A = new ComplexInterval([2, 4], [1, 3])
  const B = new ComplexInterval([1, 1], [2, 3])
  it('A + B = [3; 5] + i[3; 6]', () => expectComplex(A.add(B), [3, 5], [3, 6]))
  it('A − B = [1; 3] + i[−2; 1]', () => expectComplex(A.sub(B), [1, 3], [-2, 1]))
  it('A · B = [−7; 2] + i[5; 15]', () => expectComplex(A.mul(B), [-7, 2], [5, 15]))
  // Підсумковий рядок на слайді хибний; за проміжними обчисленнями слайда:
  it('A ÷ B = [0.4; 2.6] + i[−2.2; −0.1]', () => expectComplex(A.div(B), [0.4, 2.6], [-2.2, -0.1]))
})

// Лекція 3: дійсні інтервальні матриці подаємо як комплексні з нульовою уявною частиною.
// Очікувані значення перераховано: на слайдах помилки в (2,2) суми та C11, C22, C31 добутку.
const real = (rows: [number, number][][]): Matrix => rows.map((r) => r.map((x) => new ComplexInterval(x, 0)))

describe('Лекція 3: інтервальні матриці', () => {
  const A = real([[[2, 5], [2, 7], [-4, 4]], [[-3, 5], [2, 8], [2, 6]], [[-1, 6], [-3, 3], [5, 7]]])
  const B = real([[[1, 2], [0, 1], [1, 4]], [[0, 2], [-2, 1], [-1, 2]], [[-1, 1], [3, 5], [0, 3]]])

  const check = (M: Matrix, expected: [number, number][][]) =>
    expected.forEach((row, i) => row.forEach((e, j) => expectComplex(M[i][j], e, [0, 0])))

  it('A + B', () => check(matAdd(A, B), [[[3, 7], [2, 8], [-3, 8]], [[-3, 7], [0, 9], [1, 8]], [[-2, 7], [0, 8], [5, 10]]]))
  it('A − B', () => check(matSub(A, B), [[[0, 4], [1, 7], [-8, 3]], [[-5, 5], [1, 10], [0, 7]], [[-2, 7], [-8, 0], [2, 7]]]))
  it('A × B', () => check(matMul(A, B), [[[-2, 28], [-34, 32], [-17, 46]], [[-12, 32], [-13, 43], [-20, 54]], [[-15, 25], [8, 47], [-10, 51]]]))
  it('доданки елемента добутку', () => {
    const t = productTerms(A, B, 0, 0)
    expect(t).toHaveLength(3)
    expectComplex(t[1], [0, 14], [0, 0]) // [2; 7] · [0; 2]
  })
  it('різні розміри та порожні матриці — помилка', () => {
    expect(() => matAdd(A, A.slice(0, 2))).toThrow(/різні розміри/)
    expect(() => matMul([], A)).toThrow(/порожня/)
    expect(() => matMul(A, A.slice(0, 2))).toThrow(/Не можна помножити/)
  })
})
