import { describe, expect, it } from 'vitest'
import { PROFILE } from '../../src/profile'
import { SUBJECTS, findSubject, findWork, workHref } from '../../src/subjects/registry'

describe('Реєстр предметів', () => {
  it('офіційні назви предметів', () => {
    expect(SUBJECTS.map((s) => s.title)).toEqual([
      'Методи аналізу інтервальних даних',
      'Теорія надійності програмних систем',
    ])
  })
  it('унікальні ідентифікатори предметів і робіт', () => {
    expect(new Set(SUBJECTS.map((s) => s.id)).size).toBe(SUBJECTS.length)
    for (const s of SUBJECTS) expect(new Set(s.works.map((w) => w.id)).size).toBe(s.works.length)
  })
  it('усі роботи називаються однаково: «Лабораторна робота №N» / «ЛРN»', () => {
    for (const s of SUBJECTS) {
      s.works.forEach((w, i) => {
        expect(w.title).toBe(`Лабораторна робота №${i + 1}`)
        expect(w.short).toBe(`ЛР${i + 1}`)
      })
    }
  })
  it('пошук і адреси', () => {
    const maid = findSubject('maid')!
    expect(findWork(maid, 'lab2')?.short).toBe('ЛР2')
    expect(workHref(maid, maid.works[0])).toBe('#/maid/lab1')
    expect(findSubject('nope')).toBeUndefined()
  })
  it('профіль студента', () => {
    expect(PROFILE).toMatchObject({ name: 'Боднар Андрій', group: 'ІПЗМПм-11', listNumber: 1 })
  })
})
