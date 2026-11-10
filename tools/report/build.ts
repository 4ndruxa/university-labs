// Генерація звітів: npm run report -- maid/lab2 [tnps/pr1 …|all] [--pdf] [--publish]
// --publish: PDF копіюється в public/reports/<предмет>-<робота>.pdf (кнопка «Звіт» на сайті, src/reports.ts)
import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { Packer } from 'docx'
import { PROFILE } from '../../src/profile'
import { report } from './lib/docx'
import { maidLab1 } from './labs/maid-lab1'
import { maidLab2 } from './labs/maid-lab2'
import { maidLab3 } from './labs/maid-lab3'
import { maidLab5 } from './labs/maid-lab5'
import { tnpsPr1, tnpsPr2, tnpsPr3, tnpsPr4 } from './labs/tnps'
import { tnpsLr2, tnpsLr3 } from './labs/tnps-lr'
import { usrTm } from './labs/usr-tm'
import type { LabReport } from './types'

const REPORTS: Record<string, LabReport> = {
  'maid/lab1': maidLab1,
  'maid/lab2': maidLab2,
  'maid/lab3': maidLab3,
  'maid/lab5': maidLab5,
  'tnps/pr1': tnpsPr1,
  'tnps/pr2': tnpsPr2,
  'tnps/lr2': tnpsLr2,
  'tnps/pr3': tnpsPr3,
  'tnps/pr4': tnpsPr4,
  'tnps/lr3': tnpsLr3,
  'usr/tm': usrTm,
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
