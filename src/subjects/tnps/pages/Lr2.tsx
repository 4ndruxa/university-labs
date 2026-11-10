import { useMemo, useState } from 'react'
import { Alert, Badge, Button, Col, Form, Row, Table } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { LineChart } from '../../../shared/components/LineChart'
import { VariantPicker } from '../../../shared/components/VariantPicker'
import { Window } from '../../../shared/components/Window'
import { LR2_VARIANTS, lr2Source, solveLr2, validateLr2, type Lr2Data } from '../core/lr2'

const dot = (x: number, digits = 4) => String(Number(x.toFixed(digits)))
/** Мала величина в науковому записі: 1,78·10⁻⁴ */
const sci = (x: number, digits = 4) => {
  if (x === 0) return '0'
  const e = Math.floor(Math.log10(Math.abs(x)))
  if (e >= -2 && e <= 4) return dot(x, digits)
  const sup = String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])
  return `${dot(x / 10 ** e, 3)}·10${sup}`
}

const myVariant = (): number => (PROFILE.listNumber >= 1 && PROFILE.listNumber <= LR2_VARIANTS.length ? PROFILE.listNumber : 1)

interface Draft {
  lambda: string[]
  mu: string[]
  r: string[]
  tn: string
  rd: string
}

const variantDraft = (v: number): Draft => {
  const d = LR2_VARIANTS[v - 1]
  return { lambda: d.lambda.map(String), mu: d.mu.map(String), r: d.r.map(String), tn: String(d.tn), rd: String(d.rd) }
}

const num = (s: string) => (/^\s*\d+([.,]\d+)?\s*$/.test(s) ? Number(s.replace(',', '.')) : Number.NaN)

const parse = (d: Draft): Lr2Data => ({
  lambda: d.lambda.map(num),
  mu: d.mu.map(num),
  r: d.r.map(num),
  tn: num(d.tn),
  rd: num(d.rd),
})

const ROWS = [
  { key: 'lambda', label: 'λ·10⁻⁴, год⁻¹' },
  { key: 'mu', label: 'μ·10⁻⁴, год⁻¹' },
  { key: 'r', label: 'r, ум. од.' },
] as const

export default function Lr2() {
  const [variant, setVariant] = useState(myVariant)
  const [draft, setDraft] = useState<Draft>(() => variantDraft(myVariant()))
  const data = useMemo(() => parse(draft), [draft])
  const errors = useMemo(() => validateLr2(data), [data])
  const result = useMemo(() => (errors.length ? null : solveLr2(data)), [errors, data])
  const source = lr2Source(variant)
  const pristine = JSON.stringify(draft) === JSON.stringify(variantDraft(variant))

  const pick = (v: number) => {
    setVariant(v)
    setDraft(variantDraft(v))
  }
  const setCell = (row: (typeof ROWS)[number]['key'], i: number, value: string) =>
    setDraft({ ...draft, [row]: draft[row].map((c, j) => (j === i ? value : c)) })

  const yMin = result ? Math.min(0.9, Math.floor(Math.min(...result.points.map((p) => p.kr)) * 20) / 20) : 0

  return (
    <>
      <Window
        title="Вікно 1. Вхідні дані"
        icon="bi-input-cursor-text"
        className="lr2-input"
        actions={
          <span className="d-inline-flex align-items-center gap-2">
            <VariantPicker value={variant} count={LR2_VARIANTS.length} onChange={pick} />
            <Button size="sm" variant="outline-secondary" className="no-print" onClick={() => pick(variant)} disabled={pristine}>
              <i className="bi bi-arrow-counterclockwise me-1" />Дані варіанта
            </Button>
          </span>
        }
      >
        <p className="small text-body-secondary">
          Нерезервована відновлювальна система з {draft.lambda.length} елементів. Інтенсивності відмов λ і відновлень μ
          вводяться в одиницях 10⁻⁴ год⁻¹.
          {source && (
            <> Варіант {variant} складено з варіантів: λ — {source.lambda}, μ — {source.mu}, r — {source.r}, Tn — {source.tn}, Rд — {source.rd}.</>
          )}
        </p>
        <Table responsive size="sm" className="mono align-middle lr2-table">
          <thead>
            <tr>
              <th>Елемент</th>
              {draft.lambda.map((_, i) => <th key={i} className="text-center">{i + 1}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th className="text-nowrap fw-medium">{row.label}</th>
                {draft[row.key].map((c, i) => (
                  <td key={i}>
                    <Form.Control
                      size="sm"
                      className="mono text-center"
                      inputMode="decimal"
                      aria-label={`${row.label}, елемент ${i + 1}`}
                      value={c}
                      isInvalid={!Number.isFinite(num(c))}
                      onChange={(e) => setCell(row.key, i, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
        <Row className="g-3">
          <Col sm={6} lg={3}>
            <Form.Group controlId="lr2-tn">
              <Form.Label className="fw-medium">Загальний час роботи Tn, год</Form.Label>
              <Form.Control className="mono" inputMode="decimal" value={draft.tn} onChange={(e) => setDraft({ ...draft, tn: e.target.value })} />
            </Form.Group>
          </Col>
          <Col sm={6} lg={3}>
            <Form.Group controlId="lr2-rd">
              <Form.Label className="fw-medium">Допустимий ризик Rд, ум. од.</Form.Label>
              <Form.Control className="mono" inputMode="decimal" value={draft.rd} onChange={(e) => setDraft({ ...draft, rd: e.target.value })} />
            </Form.Group>
          </Col>
        </Row>
        {errors.length > 0 && (
          <Alert variant="danger" className="mt-3 mb-0 small">
            {errors.map((e) => <div key={e}>{e}</div>)}
          </Alert>
        )}
      </Window>

      {result && (
        <Window title="Вікно 2. Результати обчислень" icon="bi-calculator" className="lr2-results">
          <Row className="g-3 mb-3">
            <Col sm={6} lg={3}>
              <div className="result-tile">
                <div className="label">Напрацювання на відмову T</div>
                <div className="value mono">{dot(result.T, 2)} год</div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div className="result-tile">
                <div className="label">Коефіцієнт готовності Kr</div>
                <div className="value mono">{dot(result.kr)}</div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div className="result-tile">
                <div className="label">Ризик R(Tn)</div>
                <div className="value mono">{dot(result.risk, 2)} ум. од.</div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div className="result-tile emph">
                <div className="label">Порівняння з Rд = {dot(data.rd, 2)}</div>
                <div className="value">
                  {result.acceptable
                    ? <Badge bg="success">Ризик допустимий</Badge>
                    : <Badge bg="danger">Ризик перевищує допустимий</Badge>}
                </div>
              </div>
            </Col>
          </Row>
          <Table size="sm" className="mono mb-0">
            <tbody>
              <tr><td>λc = Σλᵢ</td><td>{sci(result.lambdaC)} год⁻¹</td></tr>
              <tr><td>Σλᵢ/μᵢ</td><td>{dot(result.sumRatio)}</td></tr>
              <tr><td>μc = λc / Σ(λᵢ/μᵢ)</td><td>{sci(result.muC)} год⁻¹</td></tr>
              <tr><td>T = 1 / λc</td><td>{dot(result.T, 2)} год</td></tr>
              <tr><td>Kr = 1 / (1 + Σλᵢ/μᵢ)</td><td>{dot(result.kr)}</td></tr>
              <tr><td>Σλᵢ·rᵢ</td><td>{dot(result.sumLr, 5)} ум. од./год</td></tr>
              <tr><td>Kr·Tn·Σλᵢrᵢ ≤ R(Tn) ≤ Tn·Σλᵢrᵢ</td><td>{dot(result.riskLow, 2)} ≤ R ≤ {dot(result.riskHigh, 2)}</td></tr>
              <tr><td>R(Tn) = ∫₀ᵀⁿ Kr(τ)dτ · Σλᵢrᵢ</td><td>{dot(result.risk, 2)} ум. од.</td></tr>
            </tbody>
          </Table>
        </Window>
      )}

      {result && (
        <Window title="Вікно 3. Функція готовності системи Kr(t)" icon="bi-graph-down" className="lr2-chart">
          <div className="window-chart">
          <LineChart
            x={result.points.map((p) => p.t)}
            series={[{ label: 'Kr(t)', values: result.points.map((p) => p.kr), marker: 'circle' }]}
            yMin={yMin}
            yMax={1}
            xTitle="t, год"
            yTitle="Kr(t)"
            ariaLabel="Графік функції готовності системи"
          />
          </div>
          <Table responsive size="sm" className="mono mt-3 mb-0 text-center">
            <tbody>
              <tr><th>t, год</th>{result.points.map((p) => <td key={p.t}>{p.t}</td>)}</tr>
              <tr><th>Kr(t)</th>{result.points.map((p) => <td key={p.t}>{dot(p.kr)}</td>)}</tr>
            </tbody>
          </Table>
        </Window>
      )}
    </>
  )
}
