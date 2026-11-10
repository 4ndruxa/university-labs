// Звіт: МАІД, ЛР5 — синтез допусків методом допускового еліпсоїдного оцінювання
import { readFileSync } from 'node:fs'
import { PROFILE } from '../../../src/profile'
import { LAB5_LECTURE, LAB5_VARIANTS, LAB5_X, fmtNum, formatFunction, lab5FromText, solveLab5, type RealMatrix } from '../../../src/subjects/maid/core'
import { dash, figure, formula, links, listing, p, pNoIndent, section, subsection, table, tableCaption, type Block, type Col } from '../lib/docx'
import { withSite } from '../lib/shots'
import type { LabReport } from '../types'
import { MAID_TEACHER, REPO_URL, coreFile, workUrl } from './common'

const DISCIPLINE = 'Методи аналізу інтервальних даних'
const TOPIC = 'Програмна реалізація задачі синтезу допусків на основі методу допускового еліпсоїдного оцінювання'

/** Десяткова кома і типографський мінус */
const ua = (s: string): string => s.replace(/-/g, '−').replace(/(\d)\.(\d)/g, '$1,$2')
const n = (x: number, digits = 4): string => ua(fmtNum(x, digits))
const pct = (x: number): string => `${n(x, 2)} %`

function matrix(M: RealMatrix, rowNames: string[], colNames: string[]): Block {
  const cols: Col[] = [{ title: '', widthMm: 22, align: 'center' }, ...colNames.map((c): Col => ({ title: c, widthMm: 30, align: 'center' }))]
  return table(cols, M.map((row, i) => [rowNames[i], ...row.map((v) => n(v))]))
}

async function screenshots(): Promise<Buffer[]> {
  return withSite('maid/lab5', async (page, shot) => {
    const input = await shot()
    await page.getByRole('button', { name: /Знайти допуски/ }).click()
    await page.waitForSelector('.tab-pane.active .window')
    const sens = await shot()
    await page.getByRole('button', { name: /Далі: допуски/ }).click()
    await page.waitForSelector('.tab-pane.active .window')
    const tol = await shot()
    return [input, sens, tol]
  })
}

export const maidLab5: LabReport = {
  file: 'МАІД_ЛР5',
  async build() {
    const variant = PROFILE.listNumber >= 1 && PROFILE.listNumber <= LAB5_VARIANTS.length ? PROFILE.listNumber : 1
    const v = LAB5_VARIANTS[variant - 1]
    const xs = v.x ?? LAB5_X
    const inp = lab5FromText(v.y, { a: v.a, b: v.b, c: v.c }, v.eps, xs)
    const r = solveLab5(inp)
    const names = inp.params
    const [shotInput, shotSens, shotTol] = await screenshots()

    // перевірка на прикладі з лекції: автоматичний блок і блок зі слайда (x = 9; 11)
    const lec = lab5FromText(LAB5_LECTURE.y, { a: LAB5_LECTURE.a, b: LAB5_LECTURE.b }, LAB5_LECTURE.eps, LAB5_LECTURE.x!, ['a', 'b'])
    const lecAuto = solveLab5(lec)
    const lecSlide = solveLab5({ ...lec, block: [3, 4] })
    const slideCrit = lecAuto.blocks.find((b) => b.rows.join() === '3,4')!.criterion!

    const blockX = r.block.map((i) => xs[i]).join('; ')
    const sorted = [...r.blocks].filter((b) => b.criterion !== null).sort((a, b) => a.criterion! - b.criterion!)
    const values: Record<string, number> = { a: v.a, b: v.b, c: v.c }
    let t = 0
    let f = 0

    const body: Block[] = [
      section('Мета роботи'),
      p('Вивчити метод допускового еліпсоїдного оцінювання та його застосування до задачі синтезу допусків на параметри статичної системи; навчитися обчислювати матрицю чутливості, вибирати насичений блок і будувати еліпсоїдну оцінку допускової області; реалізувати метод у вигляді програмної системи з графічним інтерфейсом.'),

      section('Завдання'),
      p('Розробити програмну систему для реалізації задачі синтезу допусків на основі методу допускового еліпсоїдного оцінювання. У програмній системі передбачити:'),
      dash('зручний графічний інтерфейс;'),
      dash('перевірку коректності введених даних;'),
      dash('виведення знайдених допусків на параметри.'),

      section('Вихідні дані'),
      tableCaption(++t, `Дані варіанта ${variant}`),
      table(
        [{ title: 'Параметр', widthMm: 70 }, { title: 'Значення', widthMm: 100 }],
        [
          ['Вихідна характеристика', `y = ${ua(formatFunction(inp.y))}`],
          ['Номінальні значення параметрів', `a = ${n(v.a)}, b = ${n(v.b)}, c = ${n(v.c)}`],
          ['Коридор відхилень', `ε = ${n(v.eps)} %`],
          ['Точки x', ua(xs.join('; '))],
        ],
      ),
      p('Точки x у завданні не задані; обрано рівномірну сітку на проміжку, де характеристика визначена й не наближається до нуля.', { spacing: { before: 160 } }),

      section('Теоретичні відомості'),
      p('Розв’язок задачі синтезу допусків на параметри системи зводиться до пошуку області взаємозв’язаних допустимих відхилень параметрів, яка належить допусковій області Ω. Цю область апроксимують еліпсоїдом: перевагою еліпсоїдної оцінки є гладкість функціональних коридорів і економне використання пам’яті — достатньо зберігати матрицю конфігурації еліпсоїда та його центр.'),
      p('Вимоги до точності характеристик задаються коридором відхилень від номінальних значень δyᵢ⁻ ≤ Sᵢ·δb ≤ δyᵢ⁺, i = 1…N, де S — матриця чутливості з елементами'),
      formula('Sᵢⱼ = bⱼ·∂y/∂bⱼ (xᵢ),'),
      pNoIndent('а δb — вектор відносних відхилень параметрів. Допускову еліпсоїдну оцінку подають m-вимірним еліпсоїдом'),
      formula('Qₘ = { δb : (δb − δb₀)ᵀ·H·(δb − δb₀) ≤ r }.'),
      p('Матрицю конфігурації H будують на основі насиченого блоку Sₘ — m рядків матриці чутливості, для яких об’єм гіперпаралелепіпеда Ωₘ мінімальний:'),
      formula('Π(δyᵢ⁺ − δyᵢ⁻)² · det(Sₘ·Sₘᵀ)⁻¹ → min,'),
      formula('E = diag(0,5·(δyᵢ⁺ − δyᵢ⁻)),   H = Sₘᵀ·E⁻²·Sₘ.'),
      p('Оскільки коридор симетричний відносно номінальних значень, центр еліпсоїда — у нулі, а його радіус'),
      formula('r = min (Δᵢ)² / (Sᵢᵀ·H⁻¹·Sᵢ),   Δᵢ = min{−δyᵢ⁻; δyᵢ⁺},'),
      pNoIndent('забезпечує дотик вписаного еліпсоїда до граней допускової області. Допуски на параметри:'),
      formula('δbⱼ = r / √hⱼⱼ · 100 %,'),
      pNoIndent('де hⱼⱼ — діагональні елементи матриці H.'),

      section('Хід роботи'),
      subsection('1. Коридор відхилень і матриця чутливості'),
      p(`Відхилення δyᵢ± = ±${n(v.eps)} %·|yᵢ|; чутливості обчислено за формулою Sᵢⱼ = bⱼ·∂y/∂bⱼ (таблиця ${t + 1}).`),
      tableCaption(++t, 'Коридор відхилень і матриця чутливості'),
      table(
        [
          { title: 'x', widthMm: 12, align: 'center' }, { title: 'y', widthMm: 24, align: 'center' },
          { title: 'δy⁻', widthMm: 24, align: 'center' }, { title: 'δy⁺', widthMm: 24, align: 'center' },
          ...names.map((p2): Col => ({ title: `S_${p2}`.replace('_', ''), widthMm: 28, align: 'center' })),
        ],
        xs.map((x, i) => [n(x), n(r.y[i]), n(r.dyMinus[i]), n(r.dyPlus[i]), ...r.S[i].map((s) => n(s))]),
      ),

      subsection('2. Вибір насиченого блоку'),
      p(`Перебрано всі ${r.blocks.length} блоки з ${names.length} рядків; у таблиці ${t + 1} наведено п’ять з найменшим критерієм.`),
      tableCaption(++t, 'Критерій для блоків матриці чутливості'),
      table(
        [{ title: 'Точки x', widthMm: 50, align: 'center' }, { title: 'Π(δy⁺ − δy⁻)²·det(Sₘ·Sₘᵀ)⁻¹', widthMm: 80, align: 'center' }],
        sorted.slice(0, 5).map((b) => [ua(b.rows.map((i) => xs[i]).join('; ')), ua(b.criterion!.toPrecision(5))]),
      ),
      p(`Насичений блок утворюють точки x = ${ua(blockX)}:`, { spacing: { before: 160 } }),
      matrix(r.Sm, r.block.map((i) => `x = ${n(xs[i])}`), names.map((p2) => `S${p2}`)),

      subsection('3. Матриця конфігурації еліпсоїда'),
      formula(`E⁻² = diag(${r.E2.map((e) => n(e, 6)).join('; ')}),   H = Sₘᵀ·E⁻²·Sₘ:`),
      matrix(r.H, [...names], [...names]),

      subsection('4. Радіус еліпсоїда і допуски'),
      p(`Відношення Δᵢ²/(Sᵢᵀ·H⁻¹·Sᵢ) для точок x = ${ua(xs.join('; '))}: ${r.ratios.map((q) => n(q)).join('; ')}. Мінімум досягається в точці x = ${n(xs[r.rIndex])}:`),
      formula(`r = ${n(r.r, 6)}.`),
      ...names.map((p2, j) => formula(`δ${p2} = r/√h${p2}${p2} · 100 % = ${n(r.r, 6)}/√${n(r.H[j][j])} · 100 % = ${pct(r.tolerances[j])};`)),
      tableCaption(++t, 'Знайдені допуски на параметри'),
      table(
        [
          { title: 'Параметр', widthMm: 25, align: 'center' }, { title: 'Номінал', widthMm: 25, align: 'center' },
          { title: 'Допуск, %', widthMm: 30, align: 'center' }, { title: 'Допустимий інтервал', widthMm: 60, align: 'center' },
        ],
        names.map((p2, j) => {
          const d = (Math.abs(values[p2]) * r.tolerances[j]) / 100
          return [p2, n(values[p2]), pct(r.tolerances[j]), `[${n(values[p2] - d)}; ${n(values[p2] + d)}]`]
        }),
      ),

      subsection('5. Перевірка на прикладі з лекції'),
      p(`Програму перевірено на прикладі з лекції 7 (y = a(x − 2)² + bx + 2, a = −0,3, b = 3, коридор 15 %, x = 3; 5; 7; 9; 11). Коридор, матриця чутливості, матриця H і результат r = ${n(lecSlide.r, 2)}, δa = ${pct(lecSlide.tolerances[0])}, δb = ${pct(lecSlide.tolerances[1])} збігаються з лекцією, якщо взяти блок зі слайда (x = 9; 11). Водночас для цього блоку на слайді вказано критерій −0,6072, хоча він не може бути від’ємним (добуток квадратів, поділений на det(Sₘ·Sₘᵀ) > 0); правильне значення — ${n(slideCrit, 5)}. Найменший критерій має блок x = 3; 11, і для нього r = ${n(lecAuto.r, 2)}, δa = ${pct(lecAuto.tolerances[0])}, δb = ${pct(lecAuto.tolerances[1])}. У програмі насичений блок обирається автоматично, а будь-який інший блок можна вибрати вручну.`),

      subsection('6. Програмна реалізація'),
      p('Програмну систему реалізовано як вебзастосунок мовою TypeScript з бібліотеками React і React-Bootstrap; вона працює в браузері й розміщена на GitHub Pages. Обчислювальна частина не залежить від інтерфейсу:'),
      dash('func.ts — розбір формули характеристики, введеної текстом, зі змінною x і параметрами a, b, c (створений у лабораторній роботі №3 і доповнений параметрами);'),
      dash('lab5.ts — дані 20 варіантів, перевірка вхідних даних, обчислення визначника й оберненої матриці методом Гаусса, перебір блоків і функція solveLab5, що повертає коридор, матрицю чутливості, насичений блок, матрицю H, радіус і допуски.'),
      p('Інтерфейс має три кроки: введення моделі, параметрів, коридору й точок; коридор, матриця чутливості, таблиця критеріїв усіх блоків і матриця H; знайдені допуски з допустимими інтервалами параметрів і графіком коридору. Програма перевіряє формулу, числові поля, кількість і повторення точок, область визначення характеристики, нульові параметри та попереджає про точки з дуже вузьким коридором; якщо параметри входять у модель залежно (наприклад, b·x і c·x у варіантах 9 і 15), усі блоки вироджені й програма пояснює, що окремі допуски не визначаються. Правильність перевірено автоматичними тестами (Vitest), зокрема на прикладі з лекції.'),
      ...links(workUrl('maid', 'lab5'), REPO_URL),

      subsection('7. Результати роботи програми'),
      p(`На рисунку ${f + 1} наведено вікно введення вихідних даних.`),
      ...figure(shotInput, ++f, 'Вікно введення моделі, параметрів і коридору'),
      p(`На рисунку ${f + 1} наведено коридор відхилень, матрицю чутливості, вибір насиченого блоку та матрицю H.`),
      ...figure(shotSens, ++f, 'Вікно з матрицею чутливості і насиченим блоком'),
      p(`На рисунку ${f + 1} наведено знайдені допуски на параметри.`),
      ...figure(shotTol, ++f, 'Вікно зі знайденими допусками на параметри'),

      section('Висновки'),
      p('У ході лабораторної роботи вивчено метод допускового еліпсоїдного оцінювання і розроблено програмну систему, яка за моделлю характеристики, номінальними параметрами і коридором відхилень знаходить допуски на параметри.'),
      p(`Для варіанта ${variant} отримано допуски ${names.map((p2, j) => `δ${p2} = ${pct(r.tolerances[j])}`).join(', ')}. Найжорсткіший допуск має параметр ${names[r.tolerances.indexOf(Math.min(...r.tolerances))]}, до якого характеристика найчутливіша; радіус еліпсоїда обмежує точка x = ${n(xs[r.rIndex])}.`),
      p('Перевірка на прикладі з лекції показала, що програма відтворює лекційні проміжні результати, а вибір насиченого блоку за правильно обчисленим критерієм дає ширші допуски, ніж на слайді.'),

      section('Додаток А. Лістинг програмного коду', true),
      p(`Нижче наведено обчислювальну частину програми з коментарями. Модуль розбору формул func.ts наведено у звіті до лабораторної роботи №3; повний код застосунку розміщено в репозиторії ${REPO_URL}.`),
      ...listing('lab5.ts', readFileSync(coreFile('maid', 'lab5.ts'), 'utf8')),
    ]

    return {
      title: { workNo: 5, discipline: DISCIPLINE, topic: TOPIC, variant, teacher: MAID_TEACHER },
      body,
    }
  },
}
