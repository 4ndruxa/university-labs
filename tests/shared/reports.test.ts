import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { REPORTS } from '../../src/reports'
import { resolveReport } from '../../src/shared/lib/reports'
import { SUBJECTS } from '../../src/subjects/registry'

describe('Посилання на звіти', () => {
  it('є рядок для кожної лабораторної і немає зайвих', () => {
    const keys = SUBJECTS.flatMap((s) => s.works.map((w) => `${s.id}/${w.id}`))
    expect(Object.keys(REPORTS).sort()).toEqual(keys.sort())
  })
  it('кожне посилання — порожнє, https://… або існуючий PDF у public/', () => {
    for (const [key, link] of Object.entries(REPORTS)) {
      if (!link) continue
      if (/^https:\/\//.test(link)) continue
      expect(link, key).toMatch(/^reports\/[^/]+\.pdf$/)
      expect(existsSync(join(import.meta.dirname, '../../public', link)), `${key}: ${link}`).toBe(true)
    }
  })
})

describe('resolveReport', () => {
  it('порожнє → немає звіту', () => {
    expect(resolveReport('', './')).toBeNull()
    expect(resolveReport('  ', './')).toBeNull()
    expect(resolveReport(undefined, './')).toBeNull()
  })
  it('зовнішнє посилання — без завантаження', () => {
    expect(resolveReport('https://drive.google.com/x', './')).toEqual({ href: 'https://drive.google.com/x', downloadable: false })
  })
  it('файл сайту — від base, без подвійних слешів', () => {
    expect(resolveReport('reports/a.pdf', './')).toEqual({ href: './reports/a.pdf', downloadable: true })
    expect(resolveReport('/reports/a.pdf', '/repo/')).toEqual({ href: '/repo/reports/a.pdf', downloadable: true })
    expect(resolveReport('./reports/a.pdf', '/repo')).toEqual({ href: '/repo/reports/a.pdf', downloadable: true })
  })
})
