// Будівельні блоки звіту: A4, Times New Roman 14, поля 20/20/25/10 мм, номер сторінки внизу праворуч
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  ImageRun,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  type IParagraphOptions,
  type ParagraphChild,
} from 'docx'
import { PROFILE } from '../../../src/profile'

const MM = 56.7 // twips в 1 мм
const FONT = 'Times New Roman'
const MONO = 'Courier New'
export const TEXT_WIDTH_MM = 210 - 25 - 10

export type Block = Paragraph | Table
export type Inline = string | ParagraphChild

/** Текст з підтримкою _{...} (нижній індекс) і **...** (жирний) */
export function runs(text: string, opts: { bold?: boolean; italics?: boolean; size?: number; font?: string } = {}): TextRun[] {
  const out: TextRun[] = []
  const re = /\*\*(.+?)\*\*|_\{(.+?)\}|\^\{(.+?)\}/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...opts }))
    if (m[1]) out.push(new TextRun({ text: m[1], ...opts, bold: true }))
    else if (m[2]) out.push(new TextRun({ text: m[2], ...opts, subScript: true }))
    else out.push(new TextRun({ text: m[3], ...opts, superScript: true }))
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...opts }))
  return out
}

const toChildren = (content: Inline | Inline[]): ParagraphChild[] =>
  (Array.isArray(content) ? content : [content]).flatMap((c) => (typeof c === 'string' ? runs(c) : [c]))

/** Звичайний абзац: по ширині, відступ першого рядка 12.5 мм */
export const p = (content: Inline | Inline[], extra: IParagraphOptions = {}): Paragraph =>
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 12.5 * MM }, children: toChildren(content), ...extra })

/** Абзац без відступу (продовження після формули: «де …») */
export const pNoIndent = (content: Inline | Inline[]): Paragraph =>
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: toChildren(content) })

/** Формула по центру */
export const formula = (text: string): Paragraph =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: runs(text) })

/** Назва структурного розділу: великими, жирним, по центру */
export const section = (title: string, pageBreak = false): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 },
    keepNext: true,
    pageBreakBefore: pageBreak,
    children: [new TextRun({ text: title.toUpperCase(), bold: true })],
  })

/** Підрозділ «1. Назва» */
export const subsection = (title: string): Paragraph =>
  new Paragraph({ indent: { firstLine: 12.5 * MM }, spacing: { before: 200, after: 80 }, keepNext: true, children: [new TextRun({ text: title, bold: true })] })

/** Маркований перелік (тире, як прийнято в ДСТУ) */
export const dash = (content: Inline | Inline[]): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 12.5 * MM + 5 * MM, hanging: 5 * MM },
    children: [new TextRun('–\t'), ...toChildren(content)],
    tabStops: [{ type: TabStopType.LEFT, position: 12.5 * MM + 5 * MM }],
  })

export const pageBreak = (): Paragraph => new Paragraph({ children: [new PageBreak()] })

/** Активне посилання (синє, підкреслене) */
export const link = (url: string): ExternalHyperlink =>
  new ExternalHyperlink({ link: url, children: [new TextRun({ text: url, style: 'Hyperlink', color: '0563C1', underline: {} })] })

/** Абзаци з посиланнями на сторінку роботи на сайті та на репозиторій */
export const links = (siteUrl: string, repoUrl: string): Paragraph[] => [
  p(['Сторінка роботи на сайті: ', link(siteUrl), '.'], { alignment: AlignmentType.LEFT }),
  p(['Репозиторій з кодом: ', link(repoUrl), '.'], { alignment: AlignmentType.LEFT }),
]

// ---------- Таблиці ----------

const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
const borders = { top: border, bottom: border, left: border, right: border }

/** «Таблиця N – Назва» над таблицею, ліворуч */
export const tableCaption = (n: number, title: string): Paragraph =>
  new Paragraph({ keepNext: true, spacing: { before: 160 }, children: [new TextRun(`Таблиця ${n} – ${title}`)] })

export interface Col {
  title: string
  widthMm: number
  align?: 'left' | 'center' | 'right'
  mono?: boolean
}

const ALIGN = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT }

function cell(content: string | Paragraph[], widthMm: number, opts: { align?: 'left' | 'center' | 'right'; bold?: boolean; mono?: boolean } = {}): TableCell {
  const children = typeof content === 'string'
    ? content.split('\n').map((line) => new Paragraph({
      alignment: ALIGN[opts.align ?? 'left'],
      spacing: { line: 240 },
      children: runs(line, { bold: opts.bold, size: 24, font: opts.mono ? MONO : undefined }),
    }))
    : content
  return new TableCell({
    width: { size: widthMm * MM, type: WidthType.DXA },
    borders,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 30, bottom: 30, left: 80, right: 80 },
    children,
  })
}

/** Таблиця з шапкою; текст у клітинках 12 pt, одинарний інтервал */
export function table(cols: Col[], rows: string[][]): Table {
  return new Table({
    width: { size: cols.reduce((s, c) => s + c.widthMm, 0) * MM, type: WidthType.DXA },
    columnWidths: cols.map((c) => c.widthMm * MM),
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({ tableHeader: true, children: cols.map((c) => cell(c.title, c.widthMm, { align: 'center', bold: true })) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, cols[i].widthMm, { align: cols[i].align, mono: cols[i].mono })) })),
    ],
  })
}

/** Сітка без шапки (матриці); кожна клітинка — кілька рядків тексту */
export function grid(cells: string[][], cellWidthMm: number, opts: { label?: string } = {}): Table {
  const n = cells[0].length
  const labelW = opts.label ? 14 : 0
  return new Table({
    width: { size: (n * cellWidthMm + labelW) * MM, type: WidthType.DXA },
    columnWidths: [...(opts.label ? [labelW * MM] : []), ...Array(n).fill(cellWidthMm * MM)],
    alignment: AlignmentType.CENTER,
    rows: cells.map((r, i) => new TableRow({
      cantSplit: true,
      children: [
        ...(opts.label && i === 0
          ? [new TableCell({
            rowSpan: cells.length,
            width: { size: labelW * MM, type: WidthType.DXA },
            borders,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: runs(opts.label, { bold: true }) })],
          })]
          : []),
        ...r.map((v) => cell(v, cellWidthMm, { align: 'center' })),
      ],
    })),
  })
}

// ---------- Рисунки ----------

/** Розмір PNG з заголовка IHDR */
function pngSize(buf: Buffer): { w: number; h: number } {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

/** Рисунок по центру на всю ширину тексту (або maxWidthMm) і підпис «Рисунок N – …» під ним */
export function figure(png: Buffer, n: number, title: string, maxWidthMm = TEXT_WIDTH_MM, maxHeightMm = 200): Paragraph[] {
  const { w, h } = pngSize(png)
  const PX_PER_MM = 96 / 25.4
  let wMm = maxWidthMm
  let hMm = (wMm * h) / w
  if (hMm > maxHeightMm) {
    hMm = maxHeightMm
    wMm = (hMm * w) / h
  }
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 160, line: 240 },
      children: [new ImageRun({ type: 'png', data: png, transformation: { width: Math.round(wMm * PX_PER_MM), height: Math.round(hMm * PX_PER_MM) } })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun(`Рисунок ${n} – ${title}`)] }),
  ]
}

// ---------- Лістинг ----------

export function listing(fileName: string, code: string): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 200, after: 80 }, keepNext: true, children: [new TextRun({ text: `Файл ${fileName}`, bold: true })] }),
    ...code.replace(/\s+$/, '').split('\n').map((line) => new Paragraph({
      spacing: { line: 240, before: 0, after: 0 },
      // перенесене продовження довгого рядка — з відступом, щоб не зливалося з наступним рядком коду
      indent: { left: 8 * MM, hanging: 8 * MM },
      children: [new TextRun({ text: line.length ? line : ' ', font: MONO, size: 20 })],
    })),
  ]
}

// ---------- Титулка й документ ----------

export interface TitleInfo {
  workNo: number
  discipline: string
  topic: string
  variant?: number
  teacher: { position: string; name: string; female: boolean }
  /** «Звіт про виконання лабораторної роботи» за замовчуванням */
  kind?: string
}

const center = (text: string, opts: { bold?: boolean; size?: number; before?: number } = {}): Paragraph =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: opts.before ?? 0 }, children: [new TextRun({ text, bold: opts.bold, size: opts.size })] })

const right = (text: string, opts: { before?: number } = {}): Paragraph =>
  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: opts.before ?? 0 }, children: [new TextRun(text)] })

/** Ініціали: «Боднар Андрій» → «Боднар А.» */
const shortName = (full: string): string => {
  const [last, ...rest] = full.split(' ')
  return `${last} ${rest.map((w) => `${w[0]}.`).join(' ')}`
}

export function titlePage(t: TitleInfo): Paragraph[] {
  return [
    center('МІНІСТЕРСТВО ОСВІТИ І НАУКИ УКРАЇНИ'),
    center('ЗАХІДНОУКРАЇНСЬКИЙ НАЦІОНАЛЬНИЙ УНІВЕРСИТЕТ', { bold: true }),
    center('Факультет комп’ютерних інформаційних технологій'),
    center('Кафедра комп’ютерних наук'),
    center('ЗВІТ', { bold: true, size: 32, before: 2400 }),
    center(t.kind ?? `про виконання лабораторної роботи №${t.workNo}`),
    center(`з дисципліни «${t.discipline}»`),
    center(`на тему: «${t.topic}»`),
    ...(t.variant ? [center(`Варіант ${t.variant}`)] : []),
    right('Виконав:', { before: 1600 }),
    right(`студент групи ${PROFILE.group}`),
    right(shortName(PROFILE.name)),
    right(t.teacher.female ? 'Перевірила:' : 'Перевірив:', { before: 300 }),
    right(t.teacher.position),
    right(t.teacher.name),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000 },
      children: [new TextRun(`Тернопіль – ${new Date().getFullYear()}`)],
    }),
  ]
}

const PAGE = {
  size: { width: 210 * MM, height: 297 * MM },
  margin: { top: 20 * MM, bottom: 20 * MM, left: 25 * MM, right: 10 * MM, footer: 10 * MM, header: 10 * MM },
}

/** title = null — без титульної сторінки (бланк-анкета) */
export function report(title: TitleInfo | null, body: Block[], docTitle = title ? `Лабораторна робота №${title.workNo} — ${title.discipline}` : ''): Document {
  return new Document({
    creator: PROFILE.name,
    title: docTitle,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 28 },
          paragraph: { spacing: { line: 360, before: 0, after: 0 } },
        },
      },
    },
    // Титулка — окремий розділ без номера сторінки: розрив між розділами не створює порожньої сторінки,
    // навіть якщо титулка заповнена до низу (довга тема)
    sections: [
      ...(title ? [{ properties: { page: PAGE }, footers: { default: new Footer({ children: [] }) }, children: titlePage(title) }] : []),
      {
        properties: { page: PAGE },
        footers: {
          default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] }),
        },
        children: body,
      },
    ],
  })
}
