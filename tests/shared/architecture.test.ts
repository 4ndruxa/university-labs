import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SUBJECTS_DIR = join(import.meta.dirname, '../../src/subjects')
const subjects = readdirSync(SUBJECTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)

describe('Межа ядра', () => {
  it.each(subjects.filter((s) => existsSync(join(SUBJECTS_DIR, s, 'core'))))('src/subjects/%s/core без React і DOM', (subject) => {
    const dir = join(SUBJECTS_DIR, subject, 'core')
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), 'utf8')
      expect(src, f).not.toMatch(/from ['"](react|react-dom|react-bootstrap|bootstrap)/)
      expect(src, f).not.toMatch(/\b(document|window|localStorage)\./)
    }
  })
})
