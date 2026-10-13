// Звіт: МАІД, ЛР1 — інтервальні вирази й комплексні інтервали
import { readFileSync } from 'node:fs'
import { PROFILE } from '../../../src/profile'
import { maid } from '../../../src/subjects/maid/meta'
import { ComplexInterval, Interval, VARIANTS, solveLab1, type Step } from '../../../src/subjects/maid/core'
import { dash, figure, formula, links, listing, p, pNoIndent, section, subsection, table, tableCaption, type Block } from '../lib/docx'
import { withSite } from '../lib/shots'
import type { LabReport } from '../types'
import { MAID_TEACHER, REPO_URL, coreFile, workUrl } from './common'

const VARIANT = PROFILE.listNumber
const V = VARIANTS[VARIANT - 1]

/** Типографський мінус; нерозривний пробіл після «;», щоб інтервал не розривався між рядками */
const m = (s: string): string => s.replace(/-(?=\d)/g, '−').replace(/; /g, ';\u00A0')
const iv = (x: Interval): string => m(x.toString())
const cx = (z: ComplexInterval): string => `${iv(z.re)} + i${iv(z.im)}`
/** Вираз з варіанту в читабельному вигляді: [1; 4] − [−3; 5]·(…) */
const pretty = (e: string): string =>
  e.replace(/\[(-?[\d.]+),(-?[\d.]+)\]/g, (_, a, b) => `[${a}; ${b}]`).replace(/\*/g, '·').replace(/([^[(;\s])-/g, '$1 − ').replace(/-/g, '−')
    .replace(/([\]\d)])([+·/])/g, '$1 $2 ').replace(/ {2,}/g, ' ')

const OP = { '+': '+', '-': '−', '*': '·', '/': '/' } as const

function stepRow(s: Step, k: number): string[] {
  if (s.kind === 'neg') return [String(k), `−${iv(s.a)}`, iv(s.result)]
  return [String(k), `${iv(s.a)} ${OP[s.op]} ${iv(s.b)}`, iv(s.result)]
}

async function screenshots(): Promise<Buffer[]> {
  return withSite('maid/lab1', async (_page, shot) => {
    const out: Buffer[] = []
    for (let i = 0; i < 4; i++) out.push(await shot(`.window >> nth=${i}`))
    return out
  })
}

export const maidLab1: LabReport = {
  file: 'МАІД_ЛР1',
  async build() {
    const work = maid.works.find((w) => w.id === 'lab1')!
    const r = solveLab1(V.e1, V.e2, V.rule)
    const [shotInput, shotResults, shotSteps, shotPlot] = await screenshots()
    const firstMul = [...r.expr1.trace, ...r.expr2.trace].find((s) => s.kind === 'binary' && s.op === '*')
    const firstDiv = r.expr2.trace.find((s) => s.kind === 'binary' && s.op === '/')
    const rule = V.rule
    const ruleArg = typeof rule.arg === 'number' ? String(rule.arg) : iv(Interval.from(rule.arg))
    const ruleOp = OP[rule.op]

    const stepCols = [{ title: '№', widthMm: 12, align: 'center' as const }, { title: 'Операція', widthMm: 100 }, { title: 'Результат', widthMm: 58 }]

    let t = 0
    let f = 0
    const body: Block[] = [
      section('Мета роботи'),
      p('Вивчити основні операції інтервальної арифметики над дійсними та комплексними інтервалами; навчитися обчислювати вирази, задані в інтервальному вигляді, з урахуванням пріоритету операцій і дужок; розробити програму, що розбирає такі вирази, будує з їхніх значень комплексні інтервали та виконує над ними арифметичні операції.'),

      section('Завдання'),
      p('На вхід програми подаються два інтервальні вирази. Значення першого виразу X₁ є основою (дійсною частиною) першого комплексного інтервалу, значення другого X₂ — основою другого. Уявна частина кожного комплексного інтервалу утворюється з основи за правилом, заданим у варіанті. Програма має обчислити суму, різницю та добуток двох отриманих комплексних інтервалів.'),

      section('Вихідні дані'),
      p(`Варіант ${VARIANT} (за порядковим номером у журналі) — таблиця ${t + 1}.`),
      tableCaption(++t, `Вихідні дані варіанту ${VARIANT}`),
      table(
        [{ title: 'Параметр', widthMm: 45 }, { title: 'Значення', widthMm: 125 }],
        [['Вираз 1', pretty(V.e1)], ['Вираз 2', pretty(V.e2)], ['Уявна частина', rule.text]],
      ),

      section('Теоретичні відомості'),
      p('Інтервалом називається множина дійсних чисел X = [x_{1}; x_{2}] = {x : x_{1} ≤ x ≤ x_{2}}. Інтервальні операції визначаються так, щоб результат містив усі можливі значення відповідної дії над числами з інтервалів-операндів:'),
      formula('[a_{1}; a_{2}] + [b_{1}; b_{2}] = [a_{1} + b_{1}; a_{2} + b_{2}],'),
      formula('[a_{1}; a_{2}] − [b_{1}; b_{2}] = [a_{1} − b_{2}; a_{2} − b_{1}],'),
      formula('[a_{1}; a_{2}] · [b_{1}; b_{2}] = [min{a_{1}b_{1}, a_{1}b_{2}, a_{2}b_{1}, a_{2}b_{2}}; max{a_{1}b_{1}, a_{1}b_{2}, a_{2}b_{1}, a_{2}b_{2}}],'),
      formula('[a_{1}; a_{2}] / [b_{1}; b_{2}] = [min{a_{1}/b_{1}, a_{1}/b_{2}, a_{2}/b_{1}, a_{2}/b_{2}}; max{…}].'),
      p('Ділення в класичному вигляді визначене, коли дільник не містить нуля. Якщо нуль лежить усередині дільника, програма застосовує те саме правило мінімуму й максимуму чотирьох часток, як у прикладі з лекції, і виводить попередження; якщо ж нулю дорівнює межа дільника, ділення неможливе.'),
      p('Комплексний інтервал має вигляд K = X + iY, де X і Y — дійсні інтервали. Операції над комплексними інтервалами зводяться до операцій над дійсними:'),
      formula('K_{1} ± K_{2} = (X_{1} ± X_{2}) + i(Y_{1} ± Y_{2}),'),
      formula('K_{1} · K_{2} = (X_{1}X_{2} − Y_{1}Y_{2}) + i(X_{1}Y_{2} + Y_{1}X_{2}).'),
      p('Вирази обчислюються з урахуванням звичайного пріоритету: спочатку дужки, потім множення й ділення, потім додавання й віднімання; операції одного рівня виконуються зліва направо.'),

      section('Хід роботи'),
      subsection('1. Обчислення першого виразу'),
      p(`Програма виконує операції у порядку, заданому дужками й пріоритетами. Кроки обчислення виразу 1 наведено в таблиці ${t + 1}.`),
      ...(firstMul && firstMul.kind === 'binary'
        ? [p(`Наприклад, добуток ${iv(firstMul.a)} · ${iv(firstMul.b)} визначається серед чотирьох добутків кінців {${firstMul.a.products(firstMul.b).map((x) => m(String(x + 0))).join('; ')}}: мінімум і максимум дають ${iv(firstMul.result)}.`)]
        : []),
      tableCaption(++t, 'Покрокове обчислення виразу 1'),
      table(stepCols, r.expr1.trace.map((s, k) => stepRow(s, k + 1))),
      formula(`X₁ = ${iv(r.expr1.value)}.`),

      subsection('2. Обчислення другого виразу'),
      p(`Кроки обчислення виразу 2 наведено в таблиці ${t + 1}.`),
      ...(firstDiv && firstDiv.kind === 'binary'
        ? [p(`Ділення ${iv(firstDiv.a)} / ${iv(firstDiv.b)} виконується через чотири частки кінців {${firstDiv.a.quotients(firstDiv.b).map((x) => m(String(Number(x.toFixed(4)) + 0))).join('; ')}}, звідки ${iv(firstDiv.result)}.`)]
        : []),
      tableCaption(++t, 'Покрокове обчислення виразу 2'),
      table(stepCols, r.expr2.trace.map((s, k) => stepRow(s, k + 1))),
      formula(`X₂ = ${iv(r.expr2.value)}.`),
      ...(r.warnings.length ? [p(`Під час обчислення програма видала попередження: ${r.warnings.join('; ')}.`)] : []),

      subsection('3. Формування комплексних інтервалів'),
      p(`За правилом варіанту («${rule.text}») уявна частина дорівнює Y = X ${ruleOp} ${ruleArg}:`),
      formula(`Y₁ = ${iv(r.expr1.value)} ${ruleOp} ${ruleArg} = ${iv(r.k1.im)},`),
      formula(`Y₂ = ${iv(r.expr2.value)} ${ruleOp} ${ruleArg} = ${iv(r.k2.im)}.`),
      pNoIndent('Отже,'),
      formula(`K₁ = ${cx(r.k1)},`),
      formula(`K₂ = ${cx(r.k2)}.`),

      subsection('4. Операції над комплексними інтервалами'),
      p('Сума і різниця обчислюються окремо для дійсних і уявних частин:'),
      formula(`K₁ + K₂ = (${iv(r.k1.re)} + ${iv(r.k2.re)}) + i(${iv(r.k1.im)} + ${iv(r.k2.im)}) = ${cx(r.sum)},`),
      formula(`K₁ − K₂ = (${iv(r.k1.re)} − ${iv(r.k2.re)}) + i(${iv(r.k1.im)} − ${iv(r.k2.im)}) = ${cx(r.diff)}.`),
      p('Для добутку спочатку обчислено чотири добутки дійсних інтервалів:'),
      formula(`X₁X₂ = ${iv(r.k1.re.mul(r.k2.re))},   Y₁Y₂ = ${iv(r.k1.im.mul(r.k2.im))},`),
      formula(`X₁Y₂ = ${iv(r.k1.re.mul(r.k2.im))},   Y₁X₂ = ${iv(r.k1.im.mul(r.k2.re))},`),
      pNoIndent('звідки'),
      formula(`K₁ · K₂ = (${iv(r.k1.re.mul(r.k2.re))} − ${iv(r.k1.im.mul(r.k2.im))}) + i(${iv(r.k1.re.mul(r.k2.im))} + ${iv(r.k1.im.mul(r.k2.re))}) = ${cx(r.prod)}.`),
      p(`Зведені результати наведено в таблиці ${t + 1}.`),
      tableCaption(++t, 'Результати обчислень'),
      table(
        [{ title: 'Величина', widthMm: 40, align: 'center' }, { title: 'Значення', widthMm: 130 }],
        [['X₁', iv(r.expr1.value)], ['X₂', iv(r.expr2.value)], ['K₁', cx(r.k1)], ['K₂', cx(r.k2)], ['K₁ + K₂', cx(r.sum)], ['K₁ − K₂', cx(r.diff)], ['K₁ · K₂', cx(r.prod)]],
      ),

      subsection('5. Програмна реалізація'),
      p(`Програму реалізовано як вебзастосунок мовою TypeScript з бібліотеками React і React-Bootstrap; він працює в браузері й розміщений на GitHub Pages (посилання наведено нижче). Обчислювальна частина не залежить від інтерфейсу:`),
      dash('interval.ts — клас Interval з операціями додавання, віднімання, множення і ділення (з перевіркою нуля в дільнику);'),
      dash('complex.ts — клас ComplexInterval і операції над комплексними інтервалами;'),
      dash('parser.ts — розбір виразу методом рекурсивного спуску з урахуванням дужок, пріоритетів і унарного мінуса; кожна виконана операція записується в покрокову трасу, а помилки введення повідомляються з позицією символу;'),
      dash('variants.ts і lab1.ts — 30 варіантів завдання, правила формування уявної частини та функція solveLab1;'),
      dash('format.ts — виведення меж з округленням назовні, щоб показаний інтервал містив точний.'),
      p('Користувач обирає варіант (за замовчуванням — свій) або вводить власні вирази; результати, покрокова таблиця й графічне зображення інтервалів на комплексній площині оновлюються одразу. Обчислювальну частину перевірено автоматичними тестами на прикладах з лекцій і на всіх 30 варіантах.'),
      ...links(workUrl('maid', 'lab1'), REPO_URL),

      subsection('6. Результати роботи програми'),
      p(`На рисунку ${f + 1} наведено вікно введення вхідних даних.`),
      ...figure(shotInput, ++f, 'Вікно вхідних даних'),
      p(`На рисунку ${f + 1} наведено вікно з результатами обчислень.`),
      ...figure(shotResults, ++f, 'Вікно результатів'),
      p(`На рисунку ${f + 1} наведено вікно покрокового обчислення виразів.`),
      ...figure(shotSteps, ++f, 'Вікно покрокового обчислення'),
      p(`На рисунку ${f + 1} наведено графічне зображення інтервалів: комплексні інтервали показано прямокутниками на комплексній площині.`),
      ...figure(shotPlot, ++f, 'Вікно візуалізації'),

      section('Висновки'),
      p('У ході виконання лабораторної роботи опрацьовано правила арифметики дійсних і комплексних інтервалів та розроблено вебзастосунок, який розбирає інтервальні вирази, показує кожен крок обчислення, формує з результатів комплексні інтервали і виконує над ними додавання, віднімання та множення.'),
      p(`Для варіанту ${VARIANT} отримано X₁ = ${iv(r.expr1.value)} і X₂ = ${iv(r.expr2.value)}. Ширина результатів (${m(String(r.expr1.value.width))} і ${m(String(r.expr2.value.width))}) значно більша за ширину вихідних інтервалів, бо кожна інтервальна операція враховує найгірше поєднання меж. Особливо помітно це в добутку K₁ · K₂ = ${cx(r.prod)}: різниця і сума добутків, що містять нуль, дають широкі інтервали навколо нуля.`),
      p('Покрокова траса дозволяє перевірити кожну дію вручну, а результати програми збігаються з ручними обчисленнями, наведеними вище.'),

      section('Додаток А. Лістинг програмного коду', true),
      p(`Нижче наведено обчислювальну частину програми. Повний код застосунку, разом з інтерфейсом і тестами, розміщено в репозиторії ${REPO_URL}.`),
      ...['lab1.ts', 'parser.ts', 'complex.ts', 'interval.ts', 'format.ts'].flatMap((name) => listing(name, readFileSync(coreFile('maid', name), 'utf8'))),
    ]

    return {
      title: { workNo: 1, discipline: maid.title, topic: work.topic, variant: VARIANT, teacher: MAID_TEACHER },
      body,
    }
  },
}
