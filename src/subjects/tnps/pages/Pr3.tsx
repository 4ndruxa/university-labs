import { useMemo, useState } from 'react'
import { Alert, Button, Col, Form, Row } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { A4Sheet, Answer, Ink } from '../../../shared/components/A4Sheet'
import { LineChart } from '../../../shared/components/LineChart'
import { VariantPicker } from '../../../shared/components/VariantPicker'
import { Window } from '../../../shared/components/Window'
import { PR3_VARIANTS, solvePr3, validatePr3, type Pr3Result, type Pr3Variant } from '../core/pr3'

/** Число з десятковою комою, як на бланку */
const ua = (x: number, digits = 4) => String(Number(x.toFixed(digits)) + 0).replace('.', ',')
/** 9,938·10⁻⁵ */
const sci = (x: number) => {
  const e = Math.floor(Math.log10(Math.abs(x)))
  const sup = String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])
  return `${ua(x / 10 ** e, 4)}·10${sup}`
}

const myVariant = (): number => (PROFILE.listNumber >= 1 && PROFILE.listNumber <= PR3_VARIANTS.length ? PROFILE.listNumber : 1)

const FIELDS: { key: keyof Pr3Variant; label: string }[] = [
  { key: 'n0', label: 'Елементів у системі' },
  { key: 't0', label: 'Час t₀, год' },
  { key: 'p0', label: 'P(t₀)' },
  { key: 'r', label: 'Ризик елемента r' },
  { key: 'n', label: 'Елементів у новій системі' },
  { key: 'tMax', label: 'Функція ризику до, год' },
  { key: 'step', label: 'Крок, год' },
]

type Draft = Record<keyof Pr3Variant, string>
const variantDraft = (v: number): Draft =>
  Object.fromEntries(FIELDS.map(({ key }) => [key, String(PR3_VARIANTS[v - 1][key])])) as Draft
const num = (s: string) => (/^\s*\d+([.,]\d+)?\s*$/.test(s) ? Number(s.replace(',', '.')) : Number.NaN)

function Sheet({ variant, v, r }: { variant: number; v: Pr3Variant; r: Pr3Result }) {
  const riskMax = Math.max(...r.rows.map((x) => x.riskSum))
  return (
    <A4Sheet>
      <h2>Практична робота №3</h2>
      <p className="a4-center">Студента групи <Ink>{PROFILE.group} {PROFILE.nameGenitive}</Ink></p>
      <p className="a4-center"><b>Варіант {variant}</b></p>

      <p>
        Досліджуються показники надійності нерезервованої невідновлювальної системи, яка складається з {v.n0}{' '}
        рівнонадійних елементів, імовірнісні величини яких підкорені експоненціальному закону розподілу. Імовірність
        безвідмовної роботи системи протягом {ua(v.t0)} годин рівна {ua(v.p0)}. Ризик відмови одного елемента
        становить {ua(v.r)}. Побудувати функцію ризику протягом {ua(v.tMax)} годин з кроком по часу {ua(v.step)} год
        для подібної системи, але яка складалася б вже з {v.n} елементів.
      </p>

      <h3>Розв'язок</h3>
      <Answer>
        <p>
          1. Для нерезервованої системи з рівнонадійних елементів P(t) = e^(−nλt), звідси інтенсивність відмови
          системи λc = −ln P(t₀) / t₀ = −ln {ua(v.p0)} / {ua(v.t0)} ≈ {sci(r.lambdaSys0)} год⁻¹.
        </p>
        <p>2. Інтенсивність відмови одного елемента λ = λc / n = {sci(r.lambdaSys0)} / {v.n0} ≈ {sci(r.lambda)} год⁻¹.</p>
        <p>
          3. Система з {v.n} елементів: λc = {v.n}·λ ≈ {sci(r.lambdaSys)} год⁻¹; середнє напрацювання
          T = 1/λc ≈ {ua(r.T, 2)} год.
        </p>
        <p>
          4. Ризик системи R(t) = (1 − e^(−nλt))·r; сума ризиків елементів R*(t) = n·(1 − e^(−λt))·r.
          Функція ризику Gr(t, n) = R(t) / R*(t) = (1 − e^(−nλt)) / (n·(1 − e^(−λt))); при t → 0 Gr → 1.
        </p>
      </Answer>
      <table className="mx-auto">
        <thead>
          <tr><th>t, год</th><th>P(t)</th><th>R(t)</th><th>R*(t)</th><th>Gr(t, {v.n})</th></tr>
        </thead>
        <tbody>
          {r.rows.map((x) => (
            <tr key={x.t}>
              <td>{ua(x.t)}</td><td>{ua(x.p)}</td><td>{ua(x.risk, 2)}</td><td>{ua(x.riskSum, 2)}</td><td>{ua(x.g)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figure>
        <LineChart
          x={r.rows.map((x) => x.t)}
          series={[{ label: `Gr(t, ${v.n})`, values: r.rows.map((x) => x.g), marker: 'circle' }]}
          xTitle="t, год"
          yTitle="Gr(t, n)"
          ariaLabel="Функція ризику"
        />
        <figcaption>Рис. 1. Функція ризику Gr(t, {v.n})</figcaption>
      </figure>
      <figure>
        <LineChart
          x={r.rows.map((x) => x.t)}
          series={[
            { label: 'R(t)', values: r.rows.map((x) => x.risk), marker: 'circle' },
            { label: 'R*(t)', values: r.rows.map((x) => x.riskSum), marker: 'square', dash: '7 4' },
          ]}
          yMax={riskMax > 0 ? riskMax : 1}
          xTitle="t, год"
          yTitle="ум. од."
          ariaLabel="Ризик системи"
        />
        <figcaption>Рис. 2. Ризик системи R(t) і сума ризиків елементів R*(t)</figcaption>
      </figure>
      <Answer>
        <p>
          Відповідь: λ ≈ {sci(r.lambda)} год⁻¹; функція ризику спадає від 1 до {ua(r.rows.at(-1)!.g)} при
          t = {ua(v.tMax)} год (таблиця, рис. 1).
        </p>
      </Answer>
    </A4Sheet>
  )
}

export default function Pr3() {
  const [variant, setVariant] = useState(myVariant)
  const [draft, setDraft] = useState<Draft>(() => variantDraft(myVariant()))
  const v = useMemo(() => Object.fromEntries(FIELDS.map(({ key }) => [key, num(draft[key])])) as unknown as Pr3Variant, [draft])
  const errors = useMemo(() => validatePr3(v), [v])
  const result = useMemo(() => (errors.length ? null : solvePr3(v)), [errors, v])
  const edited = FIELDS.some(({ key }) => draft[key] !== variantDraft(variant)[key])

  const pick = (x: number) => {
    setVariant(x)
    setDraft(variantDraft(x))
  }

  return (
    <>
      {result ? (
        <Sheet variant={variant} v={v} r={result} />
      ) : (
        <Alert variant="warning">Аркуш з'явиться, коли дані буде виправлено.</Alert>
      )}

      <Window
        title="Вікно 1. Вхідні дані"
        icon="bi-input-cursor-text"
        actions={<VariantPicker value={variant} count={PR3_VARIANTS.length} onChange={pick} />}
      >
        <Row className="g-3">
          {FIELDS.map(({ key, label }) => (
            <Col sm={6} lg={3} key={key}>
              <Form.Group controlId={`pr3-${key}`}>
                <Form.Label className="fw-medium">{label}</Form.Label>
                <Form.Control
                  className="mono"
                  inputMode="decimal"
                  value={draft[key]}
                  isInvalid={!Number.isFinite(num(draft[key]))}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                />
              </Form.Group>
            </Col>
          ))}
        </Row>
        {edited && (
          <Button size="sm" variant="outline-secondary" className="no-print mt-3" onClick={() => setDraft(variantDraft(variant))}>
            <i className="bi bi-arrow-counterclockwise me-1" />Дані варіанту
          </Button>
        )}
        {errors.length > 0 && (
          <Alert variant="danger" className="mt-3 mb-0 small">
            {errors.map((e) => <div key={e}>{e}</div>)}
          </Alert>
        )}
      </Window>
    </>
  )
}
