// Звіт: МАІД, ЛР2 — Q = B × C − A
import { readFileSync } from 'node:fs'
import { PROFILE } from '../../../src/profile'
import { maid } from '../../../src/subjects/maid/meta'
import {
  ComplexInterval,
  Interval,
  LAYOUT,
  solveLab2,
  type Matrix,
  type StudentData,
} from '../../../src/subjects/maid/core'
import {
  dash, figure, formula, grid, links, listing, p, pNoIndent, section, subsection, table, tableCaption, type Block,
} from '../lib/docx'
import { withSite } from '../lib/shots'
import type { LabReport } from '../types'
import { MAID_TEACHER, REPO_URL, coreFile, workUrl } from './common'

// Ті самі значення, що підставляє сайт (src/subjects/maid/pages/Lab2.tsx → DEFAULTS)
const DATA: StudentData = {
  day: PROFILE.birthDay,
  month: PROFILE.birthMonth,
  zal: PROFILE.recordBookLastDigit,
  stud: PROFILE.studentIdLastDigit,
  jrn: PROFILE.listNumber,
  lab: 2,
}

/** Типографський мінус; нерозривний пробіл після «;», щоб інтервал не розривався між рядками */
const m = (s: string): string => s.replace(/-(?=\d)/g, '−').replace(/; /g, ';\u00A0')
const iv = (x: Interval): string => m(x.toString())
const cx = (z: ComplexInterval): string => `${iv(z.re)} + i${iv(z.im)}`
const SUB = ['₁', '₂', '₃']

const EXPRESSIONS = [
  '[−1; 1] + i[СК ± 3]', '[Д ± 10] + i[−4; 0]', '[−2; 2] + i[((Ж + Л) ± 4)/5]',
  '[М ± 5] + i[0; 1]', '[−3; 3] + i[((СК + ЗК) ± 6)/4]', '[(Д + М)/2 ± 5] + i[−2; 2]',
  '[−4; 4] + i[Д ± 10]', '[((Д + М) ± 5)/4] + i[0; 3]', '[−5; 5] + i[Ж ± 2]',
  '[0; 1] + i[М ± 5]', '[ЗК ± 2] + i[−1; 0]', '[0; 2] + i[(Ж + Л)/3 ± 4]',
  '[СК ± 3] + i[0; 5]', '[0; 3] + i[(Д + М)/2 ± 5]', '[(СК + ЗК)/2 ± 4] + i[−1; 1]',
  '[0; 4] + i[Л ± 5]', '[((СК + ЗК) ± 6)/4] + i[−4; 4]', '[0; 5] + i[((Д + М) ± 5)/4]',
  '[−5; 0] + i[(СК + ЗК)/2 ± 4]', '[Ж ± 2] + i[0; 2]', '[−4; 0] + i[ЗК ± 2]',
  '[Л ± 5] + i[−3; 3]', '[−3; 0] + i[−5; 0]', '[(Ж + Л)/3 ± 4] + i[−2; 0]',
  '[−2; 0] + i[−5; 5]', '[((Ж + Л) ± 4)/5] + i[0; 4]', '[−1; 0] + i[−3; 0]',
]

function matrixGrid(name: string, mtx: Matrix, numbers?: readonly (readonly number[])[]): Block {
  const cells = mtx.map((row, i) => row.map((z, j) =>
    `${numbers ? `№${numbers[i][j]}\n` : ''}Re ${iv(z.re)}\nIm ${iv(z.im)}`))
  return grid(cells, 50, { label: name })
}

/** Розпис одного добутку комплексних інтервалів для звіту */
function productLines(bName: string, cName: string, b: ComplexInterval, c: ComplexInterval): Block[] {
  const p1 = b.re.mul(c.re)
  const p2 = b.im.mul(c.im)
  const p3 = b.re.mul(c.im)
  const p4 = b.im.mul(c.re)
  return [
    formula(`${bName}·${cName} = (${cx(b)})·(${cx(c)})`),
    formula(`Re = ${iv(b.re)}·${iv(c.re)} − ${iv(b.im)}·${iv(c.im)} = ${iv(p1)} − ${iv(p2)} = ${iv(p1.sub(p2))}`),
    formula(`Im = ${iv(b.re)}·${iv(c.im)} + ${iv(b.im)}·${iv(c.re)} = ${iv(p3)} + ${iv(p4)} = ${iv(p3.add(p4))}`),
  ]
}

async function screenshots(): Promise<Buffer[]> {
  return withSite('maid/lab2', async (page, shot) => {
    const input = await shot()
    await page.getByRole('button', { name: /Сформувати матриці/ }).click()
    await page.waitForSelector('.tab-pane.active .window')
    const matrices = await shot()
    await page.getByRole('button', { name: /Далі: Q/ }).click()
    await page.waitForSelector('.tab-pane.active .window')
    const q = await shot()
    return [input, matrices, q]
  })
}

export const maidLab2: LabReport = {
  file: 'МАІД_ЛР2',
  async build() {
    const work = maid.works.find((w) => w.id === 'lab2')!
    const r = solveLab2(DATA)
    const [shotInput, shotMatrices, shotQ] = await screenshots()

    // Q₁₁ вручну
    const terms = [0, 1, 2].map((k) => r.B[0][k].mul(r.C[k][0]))
    const sum = terms.reduce((s, t) => s.add(t), ComplexInterval.ZERO)
    const q11 = sum.sub(r.A[0][0])
    const [b11re, c11re] = [r.B[0][0].re, r.C[0][0].re]

    // найширший елемент Q — для висновків
    let widest = { i: 0, j: 0, w: 0 }
    r.Q.forEach((row, i) => row.forEach((z, j) => {
      const w = z.re.width + z.im.width
      if (w > widest.w) widest = { i, j, w }
    }))
    const qw = r.Q[widest.i][widest.j]

    let t = 0
    let f = 0
    const body: Block[] = [
      section('Мета роботи'),
      p('Засвоїти, як виконуються арифметичні операції над матрицями, елементи яких є комплексними інтервалами; навчитися будувати такі матриці за заданими формулами та обчислювати матричний вираз з урахуванням правил інтервальної арифметики; реалізувати обчислення у вигляді програми з графічним інтерфейсом.'),

      section('Завдання'),
      p('Обчислити інтервальний матричний вираз'),
      formula('Q = B × C − A,'),
      pNoIndent('де A, B, C — квадратні матриці третього порядку, елементи яких є комплексними інтервалами з номерами від 1 до 27, розміщеними в матрицях по стовпцях (таблиця 1).'),
      tableCaption(++t, 'Розміщення елементів у матрицях'),
      table(
        [{ title: 'Матриця A', widthMm: 50, align: 'center' }, { title: 'Матриця B', widthMm: 50, align: 'center' }, { title: 'Матриця C', widthMm: 50, align: 'center' }],
        [0, 1, 2].map((i) => (['A', 'B', 'C'] as const).map((n) => LAYOUT[n][i].join('   '))),
      ),
      p('Кожен елемент задається формулою, у яку підставляються особисті дані студента. Запис [x ± d] позначає інтервал [x − d; x + d].', { spacing: { before: 160 } }),

      section('Вихідні дані'),
      tableCaption(++t, 'Дані студента'),
      table(
        [{ title: 'Параметр', widthMm: 110 }, { title: 'Позначення', widthMm: 30, align: 'center' }, { title: 'Значення', widthMm: 30, align: 'center' }],
        [
          ['День народження', 'Д', String(DATA.day)],
          ['Місяць народження', 'М', String(DATA.month)],
          ['Остання цифра залікової книжки', 'ЗК', String(DATA.zal)],
          ['Остання цифра студентського квитка', 'СК', String(DATA.stud)],
          ['Порядковий номер у журналі', 'Ж', String(DATA.jrn)],
          ['Порядковий номер на лабораторній', 'Л', String(DATA.lab)],
        ],
      ),

      section('Теоретичні відомості'),
      p('Інтервальна матриця — це матриця, кожен елемент якої є інтервалом. Її можна розглядати як множину всіх звичайних матриць, елементи яких належать відповідним інтервалам. Для інтервальних матриць зберігаються звичні означення операцій, але кожна дія над елементами виконується за правилами інтервальної арифметики.'),
      p('Для дійсних інтервалів A = [a_{1}; a_{2}] і B = [b_{1}; b_{2}] використовуються формули:'),
      formula('A + B = [a_{1} + b_{1}; a_{2} + b_{2}],    A − B = [a_{1} − b_{2}; a_{2} − b_{1}],'),
      formula('A · B = [min{a_{1}b_{1}, a_{1}b_{2}, a_{2}b_{1}, a_{2}b_{2}}; max{a_{1}b_{1}, a_{1}b_{2}, a_{2}b_{1}, a_{2}b_{2}}].'),
      p('Комплексний інтервал записується у прямокутній формі A = A_{1} + iA_{2}, де A_{1} і A_{2} — дійсні інтервали. Додавання і віднімання виконуються окремо для дійсних і уявних частин, а множення — за формулою'),
      formula('A · B = (A_{1}B_{1} − A_{2}B_{2}) + i(A_{1}B_{2} + A_{2}B_{1}).'),
      p('Різниця матриць однакового розміру обчислюється поелементно, а елемент добутку матриць — як сума добутків елементів рядка першої матриці на елементи стовпця другої:'),
      formula('(B × C)_{ij} = B_{i1}C_{1j} + B_{i2}C_{2j} + B_{i3}C_{3j}.'),
      p('Важливою особливістю інтервальної арифметики є те, що віднімання не є оберненим до додавання: A − A ≠ 0 для невиродженого інтервалу. Тому кожна операція лише розширює результат, і ширина елементів Q швидко зростає.'),

      section('Хід роботи'),
      subsection('1. Обчислення елементів матриць'),
      p(`Після підстановки даних з таблиці ${t} у формули з умови отримано значення всіх 27 комплексних інтервалів (таблиця ${t + 1}).`),
      tableCaption(++t, 'Елементи матриць'),
      table(
        [{ title: '№', widthMm: 12, align: 'center' }, { title: 'Формула', widthMm: 78 }, { title: 'Значення', widthMm: 80 }],
        EXPRESSIONS.map((ex, k) => {
          const z = [r.A, r.B, r.C][Math.floor(k / 9)].flat()[[0, 3, 6, 1, 4, 7, 2, 5, 8][k % 9]]
          return [String(k + 1), ex, cx(z)]
        }),
      ),

      subsection('2. Формування матриць A, B, C'),
      p(`Розміщенням елементів за схемою з таблиці 1 сформовано матриці A, B і C (таблиці ${t + 1}–${t + 3}). У кожній клітинці вказано номер елемента, дійсну (Re) та уявну (Im) частини.`),
      tableCaption(++t, 'Матриця A'),
      matrixGrid('A', r.A, LAYOUT.A),
      tableCaption(++t, 'Матриця B'),
      matrixGrid('B', r.B, LAYOUT.B),
      tableCaption(++t, 'Матриця C'),
      matrixGrid('C', r.C, LAYOUT.C),

      subsection('3. Обчислення елемента Q₁₁ вручну'),
      p('Для перевірки роботи програми один елемент результуючої матриці обчислено вручну:'),
      formula('Q₁₁ = B₁₁·C₁₁ + B₁₂·C₂₁ + B₁₃·C₃₁ − A₁₁.'),
      p(`Добуток дійсних інтервалів визначається як мінімум і максимум чотирьох добутків їхніх кінців, наприклад: ${iv(b11re)}·${iv(c11re)} = [min{${b11re.products(c11re).map((x) => m(String(x + 0))).join(', ')}}; max{…}] = ${iv(b11re.mul(c11re))}.`),
      ...[0, 1, 2].flatMap((k) => productLines(`B₁${SUB[k]}`, `C${SUB[k]}₁`, r.B[0][k], r.C[k][0])),
      p('Сума трьох добутків:'),
      formula(`(B × C)₁₁ = ${terms.map((x) => `(${cx(x)})`).join(' + ')} = ${cx(sum)}.`),
      p('Після віднімання елемента A₁₁:'),
      formula(`Q₁₁ = (${cx(sum)}) − (${cx(r.A[0][0])}) = ${cx(q11)}.`),
      p(`Результат збігається зі значенням, яке показує програма (рисунок 3). Решта елементів обчислюється так само; у програмі розпис будь-якого елемента відкривається натисканням на нього.`),

      subsection('4. Результуюча матриця'),
      p(`Результати множення B × C та віднімання матриці A наведено в таблицях ${t + 1}\u00A0і\u00A0${t + 2}.`),
      tableCaption(++t, 'Матриця B × C'),
      matrixGrid('B×C', r.BC),
      tableCaption(++t, 'Результуюча матриця Q = B × C − A'),
      matrixGrid('Q', r.Q),

      subsection('5. Програмна реалізація'),
      p(`Програму реалізовано як вебзастосунок мовою TypeScript з бібліотеками React і React-Bootstrap; він працює в браузері й розміщений на GitHub Pages (посилання наведено нижче). Обчислювальна частина відокремлена від інтерфейсу і не залежить від нього:`),
      dash('interval.ts — клас Interval (дійсний інтервал) з операціями додавання, віднімання, множення і ділення;'),
      dash('complex.ts — клас ComplexInterval (комплексний інтервал у прямокутній формі);'),
      dash('matrix.ts — додавання, віднімання і множення матриць комплексних інтервалів;'),
      dash('lab2.ts — формули 27 елементів, схема їх розміщення в матрицях, перевірка вхідних даних і функція solveLab2, що повертає A, B, C, B × C та Q;'),
      dash('format.ts — виведення меж інтервалів з округленням назовні, щоб показаний інтервал гарантовано містив точний.'),
      p('Інтерфейс складається з трьох послідовних кроків: введення даних, перегляд сформованих матриць і результат. Програма перевіряє введені значення (цілі числа в допустимих межах, існування дати народження) і не дає перейти до обчислень, доки в полях є помилки. Правильність обчислювальної частини перевірено автоматичними тестами (Vitest), зокрема на прикладах з лекцій.'),
      ...links(workUrl('maid', 'lab2'), REPO_URL),

      subsection('6. Результати роботи програми'),
      p(`На рисунку ${f + 1} наведено вікно введення початкових даних.`),
      ...figure(shotInput, ++f, 'Вікно введення початкових даних'),
      p(`На рисунку ${f + 1} наведено вікно зі сформованими матрицями A, B і C.`),
      ...figure(shotMatrices, ++f, 'Вікно зі сформованими матрицями A, B, C'),
      p(`На рисунку ${f + 1} наведено вікно з результуючою матрицею Q і розписом елемента Q₁₁.`),
      ...figure(shotQ, ++f, 'Вікно з результуючою матрицею Q'),

      section('Висновки'),
      p('У ході виконання лабораторної роботи опрацьовано операції над матрицями комплексних інтервалів і розроблено вебзастосунок, який за особистими даними студента формує матриці A, B, C та обчислює вираз Q = B × C − A.'),
      p(`Елементи отриманої матриці значно ширші за вихідні: наприклад, Q₁₁ = ${cx(q11)}, а найширшим є Q${SUB[widest.i]}${SUB[widest.j]} = ${cx(qw)}. Розширення пояснюється тим, що кожен елемент добутку містить шість множень і п’ять додавань і віднімань інтервалів, а жодна інтервальна операція не звужує результат. Найсильніше розширюються елементи, у яких множаться інтервали, що містять нуль або мають велику ширину.`),
      p('Ручне обчислення елемента Q₁₁ дало той самий результат, що й програма, отже, реалізація формул правильна. Застосунок дозволяє змінити вхідні дані та одразу побачити нові матриці й розпис будь-якого елемента результату.'),

      section('Додаток А. Лістинг програмного коду', true),
      p(`Нижче наведено обчислювальну частину програми. Повний код застосунку, разом з інтерфейсом і тестами, розміщено в репозиторії ${REPO_URL}.`),
      ...['lab2.ts', 'matrix.ts', 'complex.ts', 'interval.ts', 'format.ts'].flatMap((name) => listing(name, readFileSync(coreFile('maid', name), 'utf8'))),
    ]

    return {
      title: { workNo: 2, discipline: maid.title, topic: work.topic.split(':')[0], variant: PROFILE.listNumber, teacher: MAID_TEACHER },
      body,
    }
  },
}

