// Звіти ТНПС у форматі бланка з методички: «Практична робота №N», заповнені відповіді
import { AlignmentType, Paragraph, TextRun } from 'docx'
import { PROFILE } from '../../../src/profile'
import { computeIndicators } from '../../../src/subjects/tnps/core/indicators'
import { PR1_INTERVAL, PR1_TASK } from '../../../src/subjects/tnps/core/pr1'
import { PR2_VARIANTS, solvePr2 } from '../../../src/subjects/tnps/core/pr2'
import { dash, figure, grid, link, p, runs, table, type Block, type Col } from '../lib/docx'
import { withSite } from '../lib/shots'
import type { LabReport } from '../types'
import { REPO_URL, workUrl } from './common'

const DISCIPLINE = 'Теорія надійності програмних систем'

/** Число з десятковою комою, як на бланку */
const ua = (x: number, digits = 4): string => String(Number(x.toFixed(digits)) + 0).replace('.', ',').replace('-', '−')

const center = (children: (string | TextRun)[], opts: { before?: number; after?: number } = {}): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 0 },
    children: children.flatMap((c) => (typeof c === 'string' ? runs(c) : [c])),
  })

const heading = (text: string): Paragraph => center([new TextRun({ text, bold: true, size: 32 })], { after: 60 })
const block = (text: string): Paragraph =>
  new Paragraph({ spacing: { before: 200, after: 60 }, keepNext: true, children: [new TextRun({ text, bold: true })] })
/** Питання бланка (без відступу, як у методичці) */
const question = (text: string): Paragraph => new Paragraph({ alignment: AlignmentType.JUSTIFIED, keepNext: true, children: runs(text) })
/** Вписаний рядок «студента групи …» — дані підкреслено, як заповнений пропуск */
const student = (prefix: string): Paragraph =>
  center([`${prefix} `, new TextRun({ text: `${PROFILE.group} ${PROFILE.nameGenitive}`, underline: {} })])

/** Посилання на електронну версію — наприкінці кожного бланка */
const electronic = (subject: string, work: string): Block[] => [
  block('Електронна версія'),
  p(['Сайт: ', link(workUrl(subject, work))], { alignment: AlignmentType.LEFT }),
  p(['Репозиторій: ', link(REPO_URL)], { alignment: AlignmentType.LEFT }),
]

export const tnpsPr1: LabReport = {
  file: 'ТНПС_ПР1',
  async build() {
    const data = PR1_TASK
    const k = PR1_INTERVAL
    const r = computeIndicators(data)
    const row = r.rows[k - 1]
    const sumTerms = r.rows.map((x) => `${x.failed}·${ua(x.tMid)}`).join(' + ')
    const rest = data.failures.slice(0, -1)

    const body: Block[] = [
      heading('Практична робота №1'),
      center([`з дисципліни «${DISCIPLINE}»`]),
      student('студента групи'),

      block('Теоретичний блок'),
      question('1. Надійність – це'),
      p('властивість об’єкта зберігати в часі у встановлених межах значення всіх параметрів, що характеризують здатність виконувати необхідні функції в заданих режимах та умовах застосування, технічного обслуговування, ремонту, зберігання і транспортування.'),
      question('2. Основні кількісні показники теорії надійності.'),
      dash('ймовірність безвідмовної роботи P(t) = N(t) / N₀;'),
      dash('ймовірність відмови Q(t) = 1 − P(t) = (N₀ − N(t)) / N₀;'),
      dash('частота відмов f(t) = n(Δt) / (N₀·Δt);'),
      dash('інтенсивність відмов λ(t) = n(Δt) / (N(t)·Δt);'),
      dash('середній час безвідмовної роботи T = (1/N₀)·Σ nᵢ·tᵢ,'),
      p('де N₀ — кількість об’єктів на початку випробувань, N(t) — кількість справних об’єктів на момент t, n(Δt) — кількість відмов за інтервал Δt, tᵢ — середина i-го інтервалу.'),
      question('3. Види надійності'),
      p('фізична, схемна, апаратна, програмна, функціональна.'),

      block('Практичний блок'),
      question(`1. Тестування надійності проводилось над ${data.n0} зразками однотипних об’єктів протягом ${data.failures.length === 4 ? 'чотирьох' : data.failures.length} однакових інтервалів часу. Сумарний час тестування – ${ua(data.totalTime)} год. В перший інтервал часу – відмовило ${rest[0]} зразки. В другий та третій – ${rest[1]} та ${rest[2]} зразків відповідно. Решта зразків відмовило в останній інтервал часу. Знайти середній час безвідмовної роботи об’єкту та всі кількісні показники надійності для другого інтервалу тестування.`),
      p(`У останньому інтервалі відмовило ${data.n0} − ${rest.join(' − ')} = ${data.failures.at(-1)} зразків. Тривалість інтервалу Δt = ${ua(data.totalTime)} / ${data.failures.length} = ${ua(r.dt)} год.`),
      p('Середній час безвідмовної роботи (tᵢ — середини інтервалів):'),
      center([`T = (${sumTerms}) / ${data.n0} ≈ ${ua(r.meanTime, 2)} год.`]),
      p(`Інтервал ${k}: (${ua(row.t0)}; ${ua(row.t1)}] год; на його початку справних N(${ua(row.t0)}) = ${row.nStart}, наприкінці N(${ua(row.t1)}) = ${row.nEnd}, відмов n = ${row.failed}.`),
      center([`P(${ua(row.t1)}) = ${row.nEnd} / ${data.n0} ≈ ${ua(row.p)};    Q(${ua(row.t1)}) = 1 − ${ua(row.p)} = ${ua(row.q)};`]),
      center([`f = ${row.failed} / (${data.n0}·${ua(r.dt)}) ≈ ${ua(row.f)} год⁻¹;    λ = ${row.failed} / (${row.nStart}·${ua(r.dt)}) ≈ ${ua(row.lambda ?? 0)} год⁻¹.`]),
      p(`Показники для всіх інтервалів наведено в таблиці.`),
      table(
        [
          { title: '№', widthMm: 10, align: 'center' }, { title: 'Інтервал, год', widthMm: 28, align: 'center' }, { title: 'n', widthMm: 12, align: 'center' },
          { title: 'N(t₀)', widthMm: 16, align: 'center' }, { title: 'N(t₁)', widthMm: 16, align: 'center' }, { title: 'P(t₁)', widthMm: 22, align: 'center' },
          { title: 'Q(t₁)', widthMm: 22, align: 'center' }, { title: 'f, год⁻¹', widthMm: 22, align: 'center' }, { title: 'λ, год⁻¹', widthMm: 22, align: 'center' },
        ],
        r.rows.map((x) => [String(x.index), `${ua(x.t0)}–${ua(x.t1)}`, String(x.failed), String(x.nStart), String(x.nEnd), ua(x.p), ua(x.q), ua(x.f), x.lambda === null ? '—' : ua(x.lambda)]),
      ),
      p(`Відповідь: T ≈ ${ua(r.meanTime, 2)} год; для ${k}-го інтервалу P ≈ ${ua(row.p)}; Q ≈ ${ua(row.q)}; f ≈ ${ua(row.f)} год⁻¹; λ ≈ ${ua(row.lambda ?? 0)} год⁻¹.`, { spacing: { before: 160 } }),
      ...electronic('tnps', 'pr1'),
    ]
    return { title: null, body, docTitle: `Практична робота №1 — ${DISCIPLINE}` }
  },
}

export const tnpsPr2: LabReport = {
  file: 'ТНПС_ПР2',
  async build() {
    const variant = PROFILE.listNumber >= 1 && PROFILE.listNumber <= PR2_VARIANTS.length ? PROFILE.listNumber : 1
    const { data, step } = PR2_VARIANTS[variant - 1]
    const r = solvePr2(data, step)
    const [hist, plot] = await withSite('tnps/pr2', async (page, shot) => {
      // підпис рисунка додаємо в Word окремо
      await page.addStyleTag({ content: '.a4-sheet figcaption { display: none !important; }' })
      return [await shot('.a4-sheet figure >> nth=0'), await shot('.a4-sheet figure >> nth=1')]
    })
    const rowsOf5 = Array.from({ length: Math.ceil(data.length / 5) }, (_, i) => data.slice(i * 5, i * 5 + 5))
    const sumSq = data.reduce((s, x) => s + (x - r.mean) ** 2, 0)
    // який закон ближчий до статистичної P(t) — для висновку
    const err = (key: 'pExp' | 'pNormal') => r.rows.reduce((s, x) => s + Math.abs(x[key] - x.pEmp), 0)
    const closer = err('pNormal') < err('pExp')
      ? `Нормальний закон краще узгоджується зі статистичними даними (${ua(r.rows.at(-1)!.pEmp, 2)} при t = 20 год), оскільки відмови зосереджені навколо середнього напрацювання, а не на початку випробувань.`
      : `Експоненціальний закон краще узгоджується зі статистичними даними (${ua(r.rows.at(-1)!.pEmp, 2)} при t = 20 год), оскільки значна частина відмов припадає на початок випробувань.`

    const body: Block[] = [
      heading('Практична робота №2'),
      student('Студента групи'),
      center([new TextRun({ text: `Варіант ${variant}`, bold: true })]),

      p(`У таблиці зведені статистичні значення напрацювання ${data.length} об’єктів до відмови, год.`, { spacing: { before: 160 } }),
      grid(rowsOf5.map((row) => row.map((x) => ua(x))), 16),
      p(`Побудуйте гістограму розподілу відмов елементів (крок за часом – кожні ${ua(step)} годин). Побудуйте графік ймовірності безвідмовної роботи системи протягом 20 годин (крок за часом – 5 годин) згідно з експоненціальним законом розподілу та нормальним законом розподілу.`, { spacing: { before: 160 } }),

      block('Розв’язок'),
      p('Середнє напрацювання до відмови та середньоквадратичне відхилення:'),
      center([`t̄ = (1/n)·Σtᵢ = ${data.reduce((a, b) => a + b, 0)} / ${data.length} = ${ua(r.mean)} год;`]),
      center([`s = √(Σ(tᵢ − t̄)² / (n − 1)) = √(${ua(sumSq, 2)} / ${data.length - 1}) ≈ ${ua(r.std)} год.`]),
      p(`Розподіл відмов за інтервалами [a; a + ${ua(step)}):`),
      table(
        [
          { title: 'Δt, год', widthMm: 24, align: 'center' },
          ...r.bins.map((b): Col => ({ title: `${ua(b.from)}–${ua(b.to)}`, widthMm: Math.min(24, 146 / r.bins.length), align: 'center' })),
        ],
        [['nᵢ', ...r.bins.map((b) => String(b.count))]],
      ),
      ...figure(hist, 1, 'Гістограма розподілу відмов', 150).map((par, i) => (i === 1 ? center(['Рис. 1. Гістограма розподілу відмов'], { after: 160 }) : par)),

      p(`Експоненціальний закон: λ = 1 / t̄ = 1 / ${ua(r.mean)} ≈ ${ua(r.lambda, 5)} год⁻¹;  P(t) = e^{−λt}.`),
      p('Нормальний закон: x = (t − t̄) / s;  P(t) = 0,5 − Φ(x), де Φ(x) — функція Лапласа (за таблицею), Φ(−x) = −Φ(x).'),
      p('Результати обчислень для t від 0 до 20 год з кроком 5 год:'),
      table(
        [
          { title: 't, год', widthMm: 20, align: 'center' }, { title: 'P(t) експ.', widthMm: 30, align: 'center' }, { title: 'x', widthMm: 22, align: 'center' },
          { title: 'Φ(x)', widthMm: 26, align: 'center' }, { title: 'P(t) норм.', widthMm: 30, align: 'center' }, { title: 'P(t) статист.', widthMm: 30, align: 'center' },
        ],
        r.rows.map((x) => [String(x.t), ua(x.pExp), ua(x.xTable, 2), ua(x.phiTable), ua(x.pNormal), ua(x.pEmp)]),
      ),
      ...figure(plot, 2, 'Ймовірність безвідмовної роботи P(t)', 150).map((par, i) => (i === 1 ? center(['Рис. 2. Ймовірність безвідмовної роботи P(t)'], { after: 160 }) : par)),
      p(`Висновок: на проміжку 0–20 год ймовірність безвідмовної роботи за експоненціальним законом спадає від 1 до ${ua(r.rows.at(-1)!.pExp, 3)}, а за нормальним — від ${ua(r.rows[0].pNormal, 3)} до ${ua(r.rows.at(-1)!.pNormal, 3)}. ${closer}`),
      ...electronic('tnps', 'pr2'),
    ]
    return { title: null, body, docTitle: `Практична робота №2 — ${DISCIPLINE}` }
  },
}
