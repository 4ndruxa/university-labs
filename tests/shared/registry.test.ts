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
  it('назви робіт узгоджені з видом: «Лабораторна робота №N» / «ЛРN», «Практична робота №N» / «ПРN»', () => {
    for (const s of SUBJECTS) {
      for (const w of s.works) {
        const n = w.short.replace(/^\D+/, '')
        if (w.kind === 'practical') {
          expect(w.short).toBe(`ПР${n}`)
          expect(w.title).toBe(`Практична робота №${n}`)
        } else {
          expect(w.short).toBe(`ЛР${n}`)
          expect(w.title).toBe(`Лабораторна робота №${n}`)
        }
      }
    }
  })
  it('МАІД — лабораторні №1–6 за силабусом', () => {
    expect(findSubject('maid')!.works.map((w) => w.short)).toEqual(['ЛР1', 'ЛР2', 'ЛР3', 'ЛР4', 'ЛР5', 'ЛР6'])
  })
  it('ТНПС — роботи в порядку курсу на СДН', () => {
    expect(findSubject('tnps')!.works.map((w) => w.short)).toEqual(['ПР1', 'ПР2', 'ЛР2', 'ПР3', 'ПР4', 'ЛР3'])
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
