import { describe, expect, it } from 'vitest'
import { countdown, daysWord, nextBirthday } from '../../src/shared/lib/birthday'

describe('Відлік до дня народження', () => {
  it('цього року, якщо дата ще не минула', () => {
    expect(nextBirthday(12, 11, new Date(2026, 9, 7, 15, 0))).toEqual(new Date(2026, 10, 12))
  })
  it('наступного року, якщо вже минула', () => {
    expect(nextBirthday(12, 11, new Date(2026, 10, 13))).toEqual(new Date(2027, 10, 12))
  })
  it('29.02 — до найближчого високосного року', () => {
    expect(nextBirthday(29, 2, new Date(2026, 2, 1))).toEqual(new Date(2028, 1, 29))
  })
  it('у сам день народження', () => {
    expect(countdown(12, 11, new Date(2026, 10, 12, 18, 30)).today).toBe(true)
  })
  it('дні, години, хвилини, секунди', () => {
    expect(countdown(12, 11, new Date(2026, 10, 10, 22, 59, 30))).toEqual({ today: false, days: 1, hours: 1, minutes: 0, seconds: 30 })
  })
  it('відмінки', () => {
    expect([1, 2, 5, 11, 21, 22, 36].map(daysWord)).toEqual(['1 день', '2 дні', '5 днів', '11 днів', '21 день', '22 дні', '36 днів'])
  })
})
