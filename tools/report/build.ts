// Генерація звітів: npm run report -- maid/lab2 [tnps/lab1 …|all] [--pdf] [--publish]
// --publish: PDF копіюється в public/reports/<предмет>-<робота>.pdf (кнопка «Звіт» на сайті, src/reports.ts)
import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { Packer } from 'docx'
import { PROFILE } from '../../src/profile'
import { report } from './lib/docx'
import { maidLab1 } from './labs/maid-lab1'
import { maidLab2 } from './labs/maid-lab2'
import { tnpsLab1, tnpsLab2 } from './labs/tnps'
import type { LabReport } from './types'

const REPORTS: Record<string, LabReport> = {
  'maid/lab1': maidLab1,
  'maid/lab2': maidLab2,
  'tnps/lab1': tnpsLab1,
  'tnps/lab2': tnpsLab2,
}

const args = process.argv.slice(2)
const publish = args.includes('--publish')
const pdf = publish || args.includes('--pdf')
const named = args.filter((a) => !a.startsWith('--'))
const ids = named.includes('all') ? Object.keys(REPORTS) : named
if (!ids.length || ids.some((id) => !REPORTS[id])) {
  console.error(`Використання: npm run report -- <${Object.keys(REPORTS).join('|')}|all> [--pdf] [--publish]`)
  process.exit(1)
}

const OUT = 'report'
mkdirSync(OUT, { recursive: true })
for (const id of ids) {
  const lab = REPORTS[id]
  const { title, body, docTitle } = await lab.build()
  const path = `${OUT}/${PROFILE.name.split(' ')[0]}_${lab.file}.docx`
  writeFileSync(path, await Packer.toBuffer(report(title, body, docTitle)))
  console.log(`✓ ${path}`)
  if (pdf) {
    execSync(`soffice --headless --convert-to pdf --outdir ${OUT} "${path}"`, { stdio: 'ignore' })
    console.log(`✓ ${path.replace(/\.docx$/, '.pdf')}`)
  }
  if (publish) {
    const target = `public/reports/${id.replace('/', '-')}.pdf`
    mkdirSync('public/reports', { recursive: true })
    copyFileSync(path.replace(/\.docx$/, '.pdf'), target)
    console.log(`✓ ${target} → у src/reports.ts: '${id}': '${target.replace('public/', '')}'`)
  }
}
