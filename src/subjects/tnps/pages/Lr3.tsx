import { useMemo, useState } from 'react'
import { Alert, Button, Col, Form, Row, Table } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { LineChart, type Series } from '../../../shared/components/LineChart'
import { VariantPicker } from '../../../shared/components/VariantPicker'
import { Window } from '../../../shared/components/Window'
import { LR3_VARIANTS, solveLr3, validateLr3, type Lr3Data } from '../core/lr3'

const dot = (x: number, digits = 4) => String(Number(x.toFixed(digits)))

const myVariant = (): number => (PROFILE.listNumber >= 1 && PROFILE.listNumber <= LR3_VARIANTS.length ? PROFILE.listNumber : 1)

interface Draft {
  lambda: string[]
  m: string
}

const variantDraft = (v: number): Draft => ({ lambda: LR3_VARIANTS[v - 1].lambda.map(String), m: String(LR3_VARIANTS[v - 1].m) })
const num = (s: string) => (/^\s*\d+([.,]\d+)?\s*$/.test(s) ? Number(s.replace(',', '.')) : Number.NaN)

/** Вигляд кривих: колір + тип лінії + маркер (розрізняються і в ч/б) */
const STYLE: Pick<Series, 'marker' | 'dash' | 'color'>[] = [
  { marker: 'circle', color: '#2563eb' },
  { marker: 'square', dash: '7 4', color: '#dc2626' },
  { marker: 'triangle', dash: '2 3', color: '#059669' },
  { marker: 'diamond', dash: '10 3 2 3', color: '#d97706' },
]

/** Формули з лекції для кожного виду */
const FORMULAS = [
  'P = 1 − (1 − e^(−λc·t))^(m+1);  T = (1/λc)·Σ 1/i, i = 1…m+1',
  'P = Π(1 − (1 − e^(−λᵢ·t))^(m+1));  T = ∫₀^∞ P(t)dt',
  'P = e^(−λc·t)·Σ (λc·t)^i / i!, i = 0…m;  T = (m+1)/λc',
  'P = e^(−(n−m)λt)·Σ ((n−m)λt)^i / i!;  λ = λc/n;  T = (m+1)/((n−m)λ)',
]

export default function Lr3() {
  const [variant, setVariant] = useState(myVariant)
  const [draft, setDraft] = useState<Draft>(() => variantDraft(myVariant()))
  const data: Lr3Data = useMemo(() => ({ lambda: draft.lambda.map(num), m: num(draft.m) }), [draft])
  const errors = useMemo(() => validateLr3(data), [data])
  const result = useMemo(() => (errors.length ? null : solveLr3(data)), [errors, data])
  const pristine = JSON.stringify(draft) === JSON.stringify(variantDraft(variant))

  const pick = (v: number) => {
    setVariant(v)
    setDraft(variantDraft(v))
  }
  const setCell = (i: number, value: string) => setDraft({ ...draft, lambda: draft.lambda.map((c, j) => (j === i ? value : c)) })
  // у таблиці значень — кожна друга точка (крок 50 год)
  const tableIdx = result ? result.times.map((_, i) => i).filter((i) => i % 2 === 0) : []

  return (
    <>
      <Window
        title="Вікно 1. Вхідні дані"
        icon="bi-input-cursor-text"
        actions={
          <span className="d-inline-flex align-items-center gap-2">
            <VariantPicker value={variant} count={LR3_VARIANTS.length} onChange={pick} />
            <Button size="sm" variant="outline-secondary" className="no-print" onClick={() => pick(variant)} disabled={pristine}>
              <i className="bi bi-arrow-counterclockwise me-1" />Дані варіанта
            </Button>
          </span>
        }
      >
        <p className="small text-body-secondary">
          Система з {draft.lambda.length} послідовно з'єднаних елементів. Інтенсивності відмов λ вводяться в одиницях
          10⁻³ год⁻¹; для роздільного резервування кратність m застосовується до кожного елемента.
        </p>
        <Table responsive size="sm" className="mono align-middle">
          <thead>
            <tr>
              <th>Елемент</th>
              {draft.lambda.map((_, i) => <th key={i} className="text-center">{i + 1}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="text-nowrap fw-medium">λ·10⁻³, год⁻¹</th>
              {draft.lambda.map((c, i) => (
                <td key={i}>
                  <Form.Control
                    size="sm"
                    className="mono text-center"
                    inputMode="decimal"
                    aria-label={`λ, елемент ${i + 1}`}
                    value={c}
                    isInvalid={!(num(c) > 0)}
                    onChange={(e) => setCell(i, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </Table>
        <Row className="g-3">
          <Col sm={6} lg={3}>
            <Form.Group controlId="lr3-m">
              <Form.Label className="fw-medium">Кратність резервування m</Form.Label>
              <Form.Control className="mono" inputMode="numeric" value={draft.m} onChange={(e) => setDraft({ ...draft, m: e.target.value })} />
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
        <Window title="Вікно 2. Середній час безвідмовної роботи" icon="bi-calculator">
          <div className="mono small mb-3">
            λc = Σλᵢ = {dot(result.lambdaC, 5)} год⁻¹;  без резервування T₀ = 1/λc = {dot(result.T0, 2)} год
          </div>
          <Table responsive size="sm" className="align-middle mb-0">
            <thead>
              <tr><th>Вид резервування</th><th>Формули</th><th className="text-end">T, год</th><th className="text-end">T / T₀</th></tr>
            </thead>
            <tbody>
              {result.curves.map((c, i) => (
                <tr key={c.kind}>
                  <td className="fw-medium"><span style={{ color: STYLE[i].color }}>●</span> {c.title}</td>
                  <td className="mono small">{FORMULAS[i]}</td>
                  <td className="mono text-end fw-semibold">{dot(c.T, 2)}</td>
                  <td className="mono text-end">{dot(c.T / result.T0, 2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Window>
      )}

      {result && (
        <Window title="Вікно 3. Імовірність безвідмовної роботи P(t)" icon="bi-graph-down" className="lr3-chart">
          <div className="window-chart">
            <LineChart
              x={result.times}
              series={result.curves.map((c, i) => ({ label: c.title, values: c.p, ...STYLE[i] }))}
              xTitle="t, год"
              yTitle="P(t)"
              ariaLabel="Імовірність безвідмовної роботи для чотирьох видів резервування"
            />
          </div>
          <Table responsive size="sm" className="mono mt-3 mb-0 text-center small">
            <thead>
              <tr><th className="text-start">t, год</th>{tableIdx.map((i) => <th key={i}>{result.times[i]}</th>)}</tr>
            </thead>
            <tbody>
              {result.curves.map((c, k) => (
                <tr key={c.kind}>
                  <th className="text-start text-nowrap"><span style={{ color: STYLE[k].color }}>●</span> {['Загальне', 'Роздільне', 'Заміщенням', 'Ковзне'][k]}</th>
                  {tableIdx.map((i) => <td key={i}>{dot(c.p[i])}</td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </Window>
      )}
    </>
  )
}
