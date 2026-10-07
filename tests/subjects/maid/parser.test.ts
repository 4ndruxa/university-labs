import { describe, expect, it } from 'vitest'
import { ParseError, evaluate } from '../../../src/subjects/maid/core'
import { expectInterval } from './helpers'

describe('Розбір виразів', () => {
  it('пріоритет множення над додаванням', () => expectInterval(evaluate('[1,2]+[3,4]*[2,2]').value, [7, 10]))
  it('дужки', () => expectInterval(evaluate('([1,2]+[3,4])*[2,2]').value, [8, 12]))
  it('ліва асоціативність віднімання', () => expectInterval(evaluate('[1,2]-[0,1]-[0,1]').value, [-1, 2]))
  it('ліва асоціативність ділення', () => expectInterval(evaluate('[4;8]/[2;2]/[2;2]').value, [1, 2]))
  it('типографські символи − · × ÷ і пробіли', () => {
    expectInterval(evaluate(' [−2, −1] · [3, 4] − [1,1] ').value, [-9, -4])
    expectInterval(evaluate('[2,4] × [1,1] ÷ [2,2]').value, [1, 2])
  })
  it('унарний плюс', () => expectInterval(evaluate('+[1,2] - +[1,1]').value, [0, 1]))
  it('дробові числа', () => expectInterval(evaluate('[.5, 1.25] + 0.25').value, [0.75, 1.5]))
  it('унарний мінус', () => {
    const r = evaluate('-[1,2] + -(-[3,4])')
    expectInterval(r.value, [1, 3]) // [−2; −1] + [3; 4]
    expect(r.trace.filter((s) => s.kind === 'neg')).toHaveLength(3)
  })
  it('трасування фіксує кожну операцію і чотири кандидати для · та /', () => {
    const r = evaluate('[1,4]-[-3,5]*([4,5]+[8,9])')
    expect(r.trace.map((s) => (s.kind === 'binary' ? s.op : 'neg'))).toEqual(['+', '*', '-'])
    const mul = r.trace[1]
    expect(mul.kind === 'binary' && mul.candidates).toEqual([-36, -42, 60, 70])
  })
  it('попередження про ділення на інтервал з нулем', () => {
    const r = evaluate('[1,2]/[-1,1]')
    expect(r.warnings).toHaveLength(1)
  })

  const bad: [string, RegExp, number][] = [
    ['', /порожній/, 0],
    ['[1,2]+', /Очікувалося інтервал, число або «\(»/, 6],
    ['[3,1]', /ліва межа більша/, 0],
    ['([1,2]', /Очікувалося «\)»/, 6],
    ['[1,2]]', /оператор або кінець/, 5],
    ['[1,,2]', /Очікувалося число/, 3],
    ['[1 2]', /«,» або «;»/, 3],
    ['[1,2] & [3,4]', /Невідомий символ «&»/, 6],
    ['[1,2]/[0,3]', /межа дільника/, 6],
    ['[1,2]/[0,1]+[3,4]', /межа дільника/, 6],
    ['[0,5; 1]', /через крапку/, 4],
    ['('.repeat(20000) + '[1,2]' + ')'.repeat(20000), /глибоко/, 0],
  ]
  it.each(bad)('помилка для «%s»', (src, msg, pos) => {
    try {
      evaluate(src)
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError)
      expect((e as ParseError).message).toMatch(msg)
      expect((e as ParseError).pos).toBe(pos)
    }
  })
})
