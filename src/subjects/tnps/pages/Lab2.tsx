import { useMemo, useState } from 'react'
import { Alert, Button, Col, Form, Row, Table } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { A4Sheet, Answer, Ink } from '../../../shared/components/A4Sheet'
import { BarChart } from '../../../shared/components/BarChart'
import { LineChart } from '../../../shared/components/LineChart'
import { VariantPicker } from '../../../shared/components/VariantPicker'
import { Window } from '../../../shared/components/Window'
import { LAB2_TIMES, LAB2_VARIANTS, solveLab2, validateLab2, type Lab2Result } from '../core/lab2'

const ua = (x: number, digits = 4) => String(Number(x.toFixed(digits))).replace('.', ',')
const dot = (x: number, digits = 4) => String(Number(x.toFixed(digits)))

const myVariant = (): number => (PROFILE.listNumber >= 1 && PROFILE.listNumber <= LAB2_VARIANTS.length ? PROFILE.listNumber : 1)

interface Draft {
  cells: string[]
  step: string
}

const variantDraft = (v: number): Draft => ({
  cells: LAB2_VARIANTS[v - 1].data.map(String),
  step: String(LAB2_VARIANTS[v - 1].step),
})

const num = (s: string) => (/^\s*\d+(\.\d+)?\s*$/.test(s) ? Number(s) : Number.NaN)

function Sheet({ variant, data, step, r }: { variant: number; data: number[]; step: number; r: Lab2Result }) {
  const rowsOf5 = Array.from({ length: Math.ceil(data.length / 5) }, (_, i) => data.slice(i * 5, i * 5 + 5))
  return (
    <A4Sheet>
      <h2>Практична робота №2</h2>
      <p className="a4-center">Студента групи <Ink>{PROFILE.group} {PROFILE.nameGenitive}</Ink></p>
      <p className="a4-center"><b>Варіант {variant}</b></p>

      <p>У таблиці зведені статистичні значення напрацювання {data.length} об'єктів до відмови, год.</p>
      <table className="mx-auto">
        <tbody>
          {rowsOf5.map((row, i) => (
            <tr key={i}>{row.map((v, j) => <td key={j} style={{ minWidth: '3em' }}>{ua(v)}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <p>
        Побудуйте гістограму розподілу відмов елементів (крок за часом – кожні {ua(step)} год). Побудуйте графік
        ймовірності безвідмовної роботи системи протягом 20 годин (крок за часом – 5 годин) згідно з
        експоненціальним законом розподілу та нормальним законом розподілу.
      </p>

      <h3>Розв'язок</h3>
      <Answer>
        <p>t̄ = (1/n)·Σtᵢ = {ua(r.mean)} год;  s = √(Σ(tᵢ − t̄)² / (n − 1)) ≈ {ua(r.std)} год.</p>
        <p>Розподіл відмов за інтервалами [a; a + {ua(step)}):</p>
      </Answer>
      <table className="mx-auto">
        <tbody>
          <tr><th>Δt, год</th>{r.bins.map((b) => <td key={b.from}>{ua(b.from)}–{ua(b.to)}</td>)}</tr>
          <tr><th>nᵢ</th>{r.bins.map((b) => <td key={b.from}>{b.count}</td>)}</tr>
        </tbody>
      </table>
      <figure>
        <BarChart
          bars={r.bins.map((b) => ({ label: `${ua(b.from)}–${ua(b.to)}`, value: b.count }))}
          xTitle="t, год"
          yTitle="nᵢ"
          ariaLabel="Гістограма розподілу відмов"
        />
        <figcaption>Рис. 1. Гістограма розподілу відмов</figcaption>
      </figure>

      <Answer>
        <p>Експоненціальний закон: λ = 1 / t̄ ≈ {ua(r.lambda, 5)} год⁻¹;  P(t) = e^(−λt).</p>
        <p>Нормальний закон: x = (t − t̄) / s;  P(t) = 0,5 − Φ(x), Φ(−x) = −Φ(x) (таблиця функції Лапласа).</p>
      </Answer>
      <table className="mx-auto">
        <thead>
          <tr><th>t, год</th><th>P експ.</th><th>x</th><th>Φ(x)</th><th>P норм.</th></tr>
        </thead>
        <tbody>
          {r.rows.map((x) => (
            <tr key={x.t}>
              <td>{x.t}</td><td>{ua(x.pExp)}</td><td>{ua(x.xTable, 2)}</td><td>{ua(x.phiTable)}</td><td>{ua(x.pNormal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figure>
        <LineChart
          x={LAB2_TIMES}
          series={[
            { label: 'експоненціальний', values: r.rows.map((x) => x.pExp), marker: 'circle' },
            { label: 'нормальний', values: r.rows.map((x) => x.pNormal), marker: 'square', dash: '7 4' },
            { label: 'статистичний', values: r.rows.map((x) => x.pEmp), marker: 'triangle', dash: '2 3' },
          ]}
          xTitle="t, год"
          yTitle="P(t)"
          ariaLabel="Ймовірність безвідмовної роботи"
        />
        <figcaption>Рис. 2. Ймовірність безвідмовної роботи P(t)</figcaption>
      </figure>
    </A4Sheet>
  )
}

export default function Lab2() {
  const [variant, setVariant] = useState(myVariant)
  const [draft, setDraft] = useState<Draft>(() => variantDraft(myVariant()))
  const data = useMemo(() => draft.cells.map(num), [draft])
  const step = num(draft.step)
  const errors = useMemo(() => validateLab2(data, step), [data, step])
  const result = useMemo(() => (errors.length ? null : solveLab2(data, step)), [errors, data, step])
  const original = variantDraft(variant)
  const edited = draft.step !== original.step || draft.cells.some((c, i) => c !== original.cells[i])

  const pick = (v: number) => {
    setVariant(v)
    setDraft(variantDraft(v))
  }
  const setCell = (i: number, value: string) => setDraft({ ...draft, cells: draft.cells.map((c, j) => (j === i ? value : c)) })

  return (
    <>
      {result ? (
        <Sheet variant={variant} data={data} step={step} r={result} />
      ) : (
        <Alert variant="warning">Аркуш з'явиться, коли дані буде виправлено.</Alert>
      )}

      <Window
        title="Вікно 1. Вхідні дані"
        icon="bi-input-cursor-text"
        actions={<VariantPicker value={variant} count={LAB2_VARIANTS.length} onChange={pick} />}
      >
        <Row className="g-4">
          <Col lg={7}>
            <div className="small text-body-secondary mb-2">Напрацювання до відмови, год</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.4rem' }}>
              {draft.cells.map((c, i) => (
                <Form.Control
                  key={i}
                  size="sm"
                  className="mono text-center"
                  inputMode="decimal"
                  aria-label={`Значення ${i + 1}`}
                  value={c}
                  isInvalid={!(num(c) > 0)}
                  onChange={(e) => setCell(i, e.target.value)}
                />
              ))}
            </div>
          </Col>
          <Col lg={5}>
            <Form.Group controlId="t2-step" className="mb-3">
              <Form.Label className="fw-medium">Крок гістограми, год</Form.Label>
              <Form.Control className="mono" inputMode="decimal" value={draft.step} onChange={(e) => setDraft({ ...draft, step: e.target.value })} />
            </Form.Group>
            {edited && (
              <Button size="sm" variant="outline-secondary" className="no-print" onClick={() => setDraft(variantDraft(variant))}>
                <i className="bi bi-arrow-counterclockwise me-1" />Дані варіанту
              </Button>
            )}
          </Col>
        </Row>
        {errors.length > 0 && (
          <Alert variant="danger" className="mt-3 mb-0 small">
            {errors.map((e) => <div key={e}>{e}</div>)}
          </Alert>
        )}
      </Window>

      {result && (
        <Window title="Вікно 2. Покроковий розрахунок P(t)" icon="bi-list-ol">
          <div className="mono small mb-2">
            n = {result.n}; t̄ = {dot(result.mean)}; s = {dot(result.std)}; λ = 1/t̄ = {dot(result.lambda, 6)}
          </div>
          <Table responsive size="sm" className="mono align-middle mb-2 text-nowrap">
            <thead>
              <tr>
                <th>t</th><th>P експ.</th><th>x = (t − t̄)/s</th><th>x ≈</th><th>Φ(x) табл.</th>
                <th>P норм.</th><th>P норм. (точно)</th><th>P стат.</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((x) => (
                <tr key={x.t}>
                  <td>{x.t}</td><td>{dot(x.pExp)}</td><td>{dot(x.x, 5)}</td><td>{x.xTable.toFixed(2)}</td>
                  <td>{dot(x.phiTable)}</td><td className="fw-semibold">{dot(x.pNormal)}</td>
                  <td className="text-body-secondary">{dot(x.pNormalExact)}</td><td>{dot(x.pEmp, 2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="small text-body-secondary">
            Φ(x) — як у таблиці функції Лапласа: x округлено до 0,01, значення до 4 знаків; «точно» — без округлення.
            Нормальний закон не усічений, тому P(0) &lt; 1. P стат. — частка об'єктів з напрацюванням більше t.
          </div>
        </Window>
      )}
    </>
  )
}
