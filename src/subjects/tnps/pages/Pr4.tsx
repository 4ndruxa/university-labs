import { useMemo, useState } from 'react'
import { Alert, Col, Form, Row } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { A4Sheet, Answer, Ink } from '../../../shared/components/A4Sheet'
import { Window } from '../../../shared/components/Window'
import { SchemeView } from '../components/SchemeView'
import { PR4_DATA, PR4_SCALE, PR4_SCHEME, PR4_TIME, solvePr4, type ElementData, type Pr4Result, type Step } from '../core/pr4'

/** Число з десятковою комою, як на бланку */
const ua = (x: number, digits = 4) => String(Number(x.toFixed(digits)) + 0).replace('.', ',')
/** Імовірність, близьку до 1, показуємо з 6 знаками, щоб не вийшло «= 1» */
const up = (p: number) => ua(p, 1 - p < 1e-3 ? 6 : 4)
/** «P12» → P з нижнім індексом 12; «PIV» → P з індексом IV */
const Sym = ({ name }: { name: string }) => <>P<sub>{name}</sub></>

const given = (d: ElementData) => ('p' in d ? `P = ${ua(d.p)}` : 'q' in d ? `Q = ${ua(d.q)}` : `λ = ${ua(d.lambda)}·10⁻⁴`)

function formula(d: ElementData, p: number, t: number): string {
  if ('p' in d) return up(p)
  if ('q' in d) return `1 − ${ua(d.q)} = ${up(p)}`
  return `e^(−${ua(d.lambda * PR4_SCALE, 6)}·${t}) = ${up(p)}`
}

function StepLine({ s }: { s: Step }) {
  const parts = s.parts.map((p, i) => <Sym key={i} name={p.slice(1)} />)
  const nums = s.values.map(up)
  if (s.type === 'ser') {
    return (
      <>
        <Sym name={s.name} /> = {parts.map((p, i) => <span key={i}>{i > 0 && '·'}{p}</span>)} = {nums.join('·')} = {up(s.p)}
      </>
    )
  }
  return (
    <>
      <Sym name={s.name} /> = 1 − {parts.map((p, i) => <span key={i}>(1 − {p})</span>)} = 1 −{' '}
      {nums.map((v) => `(1 − ${v})`).join('')} = {up(s.p)}
    </>
  )
}

function Sheet({ t, r }: { t: number; r: Pr4Result }) {
  const ids = r.elements.map((e) => e.id)
  const row = (pick: (d: ElementData) => string | null) =>
    r.elements.map((e) => <td key={e.id}>{pick(e.data) ?? ''}</td>)
  return (
    <A4Sheet>
      <h2>Практична робота №4</h2>
      <p className="a4-center">Студента групи <Ink>{PROFILE.group} {PROFILE.nameGenitive}</Ink></p>
      <p>
        Знайти імовірність безвідмовної роботи системи, зображеної на структурній схемі, протягом {t} годин. Коли
        відомі наступні показники надійності елементів:
      </p>
      <table className="mx-auto small-table">
        <tbody>
          <tr><th /> {ids.map((id) => <th key={id}>{id}</th>)}</tr>
          <tr><th>P(t)</th>{row((d) => ('p' in d ? ua(d.p) : null))}</tr>
          <tr><th>λ·10⁻⁴</th>{row((d) => ('lambda' in d ? ua(d.lambda) : null))}</tr>
          <tr><th>Q(t)</th>{row((d) => ('q' in d ? ua(d.q) : null))}</tr>
        </tbody>
      </table>
      <figure>
        <SchemeView scheme={PR4_SCHEME} ariaLabel="Структурна схема системи" />
        <figcaption>Рис. 1. Структурна схема системи</figcaption>
      </figure>

      <h3>Розв'язок</h3>
      <Answer>
        <p>
          1. Імовірності безвідмовної роботи елементів за t = {t} год: якщо задано Q, то P = 1 − Q; якщо задано λ
          (експоненціальний закон), то P = e^(−λt).
        </p>
      </Answer>
      <table className="mx-auto">
        <thead><tr><th>№</th><th>Задано</th><th>P({t})</th></tr></thead>
        <tbody>
          {r.elements.map((e) => (
            <tr key={e.id}><td>{e.id}</td><td>{given(e.data)}</td><td>{formula(e.data, e.p, t)}</td></tr>
          ))}
        </tbody>
      </table>
      <Answer>
        <p>
          2. Згортаємо схему: для послідовного з'єднання P = ΠPᵢ, для паралельного P = 1 − Π(1 − Pᵢ). Блоки
          позначено римськими цифрами в порядку згортки.
        </p>
        {r.steps.map((s, i) => (
          <p key={i}><StepLine s={s} /></p>
        ))}
        <p>
          Відповідь: імовірність безвідмовної роботи системи протягом {t} год P<sub>сист</sub>({t}) ≈ <b>{ua(r.p)}</b>.
        </p>
      </Answer>
    </A4Sheet>
  )
}

export default function Pr4() {
  const [tDraft, setTDraft] = useState(String(PR4_TIME))
  const t = /^\s*\d+([.,]\d+)?\s*$/.test(tDraft) ? Number(tDraft.replace(',', '.')) : Number.NaN
  const result = useMemo(() => (t >= 0 ? solvePr4(PR4_SCHEME, PR4_DATA, t) : null), [t])

  return (
    <>
      {result ? <Sheet t={t} r={result} /> : <Alert variant="warning">Аркуш з'явиться, коли час буде виправлено.</Alert>}

      <Window title="Вікно 1. Вхідні дані" icon="bi-input-cursor-text">
        <Row className="g-3 align-items-end">
          <Col sm={6} lg={3}>
            <Form.Group controlId="pr4-t">
              <Form.Label className="fw-medium">Час роботи t, год</Form.Label>
              <Form.Control className="mono" inputMode="decimal" value={tDraft} isInvalid={!(t >= 0)} onChange={(e) => setTDraft(e.target.value)} />
            </Form.Group>
          </Col>
          <Col>
            <p className="small text-body-secondary mb-2">
              Схема і показники елементів — з бланка завдання (варіант один для всіх).
            </p>
          </Col>
        </Row>
      </Window>
    </>
  )
}
