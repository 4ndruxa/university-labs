import { useMemo, useState } from 'react'
import { Alert, Button, Col, Form, Nav, Row, Tab, Table } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { LineChart } from '../../../shared/components/LineChart'
import { niceTicks, padded } from '../../../shared/components/plot'
import { VariantPicker } from '../../../shared/components/VariantPicker'
import { Window } from '../../../shared/components/Window'
import { load, save } from '../../../shared/lib/storage'
import {
  FuncError,
  LAB3_EPS,
  LAB3_VARIANTS,
  derivativeMismatch,
  evalAt,
  fmtNum,
  formatFunction,
  parseFunction,
  solveLab3,
  validateLab3,
  type Interval,
  type Lab3Result,
  type Node,
} from '../core'

const STORAGE_KEY = 'lab3-draft'
const DIGITS = 6

interface Draft {
  variant: number
  f: string
  df: string
  a: string
  b: string
  eps: string
}

const myVariant = (): number => (PROFILE.listNumber >= 1 && PROFILE.listNumber <= LAB3_VARIANTS.length ? PROFILE.listNumber : 1)

const variantDraft = (v: number): Draft => {
  const x = LAB3_VARIANTS[v - 1]
  return { variant: v, f: x.f, df: x.df, a: String(x.a), b: String(x.b), eps: String(LAB3_EPS) }
}

function loadDraft(): Draft {
  const raw = load<Partial<Draft> | null>(STORAGE_KEY, null)
  const base = variantDraft(myVariant())
  if (!raw || typeof raw !== 'object') return base
  const str = (k: keyof Omit<Draft, 'variant'>) => (typeof raw[k] === 'string' ? (raw[k] as string) : base[k])
  const v = Number(raw.variant)
  return { variant: v >= 1 && v <= LAB3_VARIANTS.length ? v : base.variant, f: str('f'), df: str('df'), a: str('a'), b: str('b'), eps: str('eps') }
}

/** Число з поля: допускаємо кому як десятковий роздільник */
const num = (s: string) => (/^\s*[-−]?\d*[.,]?\d+(e[-+]?\d+)?\s*$/i.test(s) ? Number(s.replace(',', '.').replace('−', '-')) : Number.NaN)

const iv = (X: Interval) => X.toString(DIGITS)

function parsed(src: string): { node: Node | null; error: string | null } {
  try {
    return { node: parseFunction(src), error: null }
  } catch (e) {
    return { node: null, error: e instanceof FuncError ? e.message : String(e) }
  }
}

function StepTitle({ n, text }: { n: number; text: string }) {
  return <><span className="step-num">{n}</span>{text}</>
}

function FormulaField({ id, label, value, onChange, error, preview }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error: string | null; preview: string | null
}) {
  return (
    <Form.Group controlId={id}>
      <Form.Label className="fw-medium">{label}</Form.Label>
      <Form.Control
        className="mono"
        value={value}
        spellCheck={false}
        autoComplete="off"
        isInvalid={!!error}
        aria-describedby={`${id}-help`}
        onChange={(e) => onChange(e.target.value)}
      />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      {preview && !error && <div className="small mono text-body-secondary mt-1" id={`${id}-help`}>= {preview}</div>}
    </Form.Group>
  )
}

function ResultChart({ f, a, b, r }: { f: Node; a: number; b: number; r: Lab3Result }) {
  const n = 240
  const xs = Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n)
  const ys = xs.map((x) => {
    try { return evalAt(f, x) } catch { return Number.NaN }
  })
  const finite = ys.filter(Number.isFinite)
  const [lo, hi] = padded(Math.min(...finite, 0), Math.max(...finite, 0), 0.06)
  return (
    <div className="window-chart">
      <LineChart
        x={xs}
        xTicks={niceTicks(a, b, 6).filter((t) => t >= a && t <= b)}
        series={[{ label: 'f(x)', values: ys, marker: 'none' }]}
        bands={[{ from: r.X.lo, to: r.X.hi, label: `X* = ${iv(r.X)}` }]}
        zeroLine
        yMin={lo}
        yMax={hi}
        xTitle="x"
        yTitle="f(x)"
        ariaLabel="Графік функції на початковому проміжку з результуючим інтервалом"
      />
    </div>
  )
}

export default function Lab3() {
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [step, setStep] = useState('input')
  const [submitted, setSubmitted] = useState(false)

  const update = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    save(STORAGE_KEY, next)
  }
  const pick = (v: number) => {
    const next = variantDraft(v)
    setDraft(next)
    save(STORAGE_KEY, next)
  }

  const f = useMemo(() => parsed(draft.f), [draft.f])
  const df = useMemo(() => parsed(draft.df), [draft.df])
  const a = num(draft.a)
  const b = num(draft.b)
  const eps = num(draft.eps)
  const input = useMemo(() => (f.node && df.node ? { f: f.node, df: df.node, a, b, eps } : null), [f.node, df.node, a, b, eps])
  const errors = useMemo(() => (input ? validateLab3(input) : []), [input])
  const valid = !!input && errors.length === 0
  const mismatch = useMemo(() => (input && valid ? derivativeMismatch(input.f, input.df, input.a, input.b) : null), [input, valid])
  const [result, solveError] = useMemo((): [Lab3Result | null, string | null] => {
    if (!input || !valid) return [null, null]
    try {
      return [solveLab3(input), null]
    } catch (e) {
      return [null, (e as Error).message]
    }
  }, [input, valid])
  const pristine = JSON.stringify(draft) === JSON.stringify(variantDraft(draft.variant))
  const showErrors = submitted || !pristine

  const compute = () => {
    setSubmitted(true)
    if (result) setStep('iter')
  }

  return (
    <Tab.Container transition={false} activeKey={step} onSelect={(k) => k && setStep(k)}>
      <Nav variant="pills" className="steps gap-2 mb-4 no-print">
        <Nav.Item><Nav.Link eventKey="input"><StepTitle n={1} text="Вхідні дані" /></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="iter" disabled={!result}><StepTitle n={2} text="Ітерації" /></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="result" disabled={!result}><StepTitle n={3} text="Результат і графік" /></Nav.Link></Nav.Item>
      </Nav>

      <Tab.Content>
        <Tab.Pane eventKey="input">
          <Window
            title="Вікно 1. Введення функції та проміжку"
            icon="bi-input-cursor-text"
            actions={
              <span className="d-inline-flex align-items-center gap-2">
                <VariantPicker value={draft.variant} count={LAB3_VARIANTS.length} onChange={pick} />
                <Button size="sm" variant="outline-secondary" className="no-print" onClick={() => pick(draft.variant)} disabled={pristine}>
                  <i className="bi bi-arrow-counterclockwise me-1" />Дані варіанта
                </Button>
              </span>
            }
          >
            <p className="small text-body-secondary">
              Інтервальний метод Ньютона звужує проміжок [a; b], на кінцях якого f має різні знаки, до інтервалу заданої
              ширини, що гарантовано містить точку, де f(x) = 0.
            </p>
            <Form noValidate onSubmit={(e) => { e.preventDefault(); compute() }}>
              <Row className="g-3">
                <Col lg={6}>
                  <FormulaField id="l3-f" label="Функція f(x)" value={draft.f} onChange={(v) => update({ f: v })}
                    error={f.error} preview={f.node ? formatFunction(f.node) : null} />
                </Col>
                <Col lg={6}>
                  <FormulaField id="l3-df" label="Похідна f′(x)" value={draft.df} onChange={(v) => update({ df: v })}
                    error={df.error} preview={df.node ? formatFunction(df.node) : null} />
                </Col>
                <Col xs={12}>
                  <div className="small text-body-secondary">
                    <i className="bi bi-info-circle me-1" />
                    Змінна <span className="mono">x</span>; дії <span className="mono">+ − * / ^</span> (знак множення можна
                    пропускати: <span className="mono">2x</span>, <span className="mono">2sin(x)</span>); функції{' '}
                    <span className="mono">sin cos tan ctg ln lg exp sqrt abs</span>, корінь n-го степеня{' '}
                    <span className="mono">root(вираз, n)</span>; сталі <span className="mono">pi</span>, <span className="mono">e</span>.
                    Степінь функції: <span className="mono">sin(x)^2</span>. Десятковий роздільник — крапка.
                  </div>
                </Col>
                <Col sm={4}>
                  <Form.Group controlId="l3-a">
                    <Form.Label className="fw-medium">Ліва межа a</Form.Label>
                    <Form.Control className="mono" inputMode="decimal" value={draft.a} isInvalid={!Number.isFinite(a)} onChange={(e) => update({ a: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  <Form.Group controlId="l3-b">
                    <Form.Label className="fw-medium">Права межа b</Form.Label>
                    <Form.Control className="mono" inputMode="decimal" value={draft.b} isInvalid={!Number.isFinite(b)} onChange={(e) => update({ b: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  <Form.Group controlId="l3-eps">
                    <Form.Label className="fw-medium">Точність ε (ширина інтервалу)</Form.Label>
                    <Form.Control className="mono" inputMode="decimal" value={draft.eps} isInvalid={!(eps > 0)} onChange={(e) => update({ eps: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>

              {showErrors && (errors.length > 0 || solveError) && (
                <Alert variant="danger" className="mt-3 mb-0 small">
                  {[...errors, ...(solveError ? [solveError] : [])].map((e) => <div key={e}>{e}</div>)}
                </Alert>
              )}
              {mismatch !== null && (
                <Alert variant="warning" className="mt-3 mb-0 small">
                  <i className="bi bi-exclamation-triangle me-1" />
                  Похідна, схоже, введена з помилкою: при x ≈ {fmtNum(mismatch)} вона не збігається з чисельною похідною f(x).
                  Метод використовує саме введену f′(x).
                </Alert>
              )}

              <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                <Button type="submit" size="lg" disabled={showErrors && !result}>
                  <i className="bi bi-cpu me-2" />Знайти інтервал
                </Button>
                {result && (
                  <span className="small text-body-secondary">
                    f(a) = {fmtNum(evalAt(input!.f, a), 4)}, f(b) = {fmtNum(evalAt(input!.f, b), 4)} — знаки різні
                  </span>
                )}
              </div>
            </Form>
          </Window>
        </Tab.Pane>

        <Tab.Pane eventKey="iter">
          {result && (
            <Window title="Вікно 2. Ітерації методу Ньютона" icon="bi-list-ol">
              <p className="small text-body-secondary">
                Xₖ = {'{'}m(Xₖ₋₁) − f(m) / M{'}'} ∩ Xₖ₋₁, де M = f′(Xₖ₋₁) — значення похідної на всьому інтервалі
                (інтервальне розширення). Умова з лекції: d(Xₖ) ≤ ½(1 − m₁/m₂)·d(Xₖ₋₁). Якщо 0 ∈ M, інтервал ділиться навпіл.
              </p>
              <Table responsive size="sm" className="mono align-middle small text-nowrap">
                <thead>
                  <tr>
                    <th>k</th><th>Xₖ₋₁</th><th>m</th><th>f(m)</th><th>M = f′(Xₖ₋₁)</th><th>Xₖ</th><th>d(Xₖ)</th><th>умова</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.k} className={row.k === result.iterations ? 'table-active fw-semibold' : undefined}>
                      <td>{row.k}</td>
                      <td>{iv(row.X)}</td>
                      <td>{fmtNum(row.m, 8)}</td>
                      <td>{row.fm.toExponential(4)}</td>
                      <td>{row.M ? iv(row.M) : '—'}</td>
                      <td>{iv(row.next)}</td>
                      <td>{row.next.width.toExponential(3)}</td>
                      <td>
                        {row.kind === 'bisect'
                          ? <span className="text-warning-emphasis">0 ∈ M — поділ навпіл</span>
                          : row.boundOk ? <span className="text-success">✓ {row.bound!.toExponential(2)}</span> : <span className="text-danger">✗</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-between mt-3 no-print">
                <Button variant="outline-secondary" onClick={() => setStep('input')}><i className="bi bi-arrow-left me-1" />Назад</Button>
                <Button onClick={() => setStep('result')}>Далі: результат <i className="bi bi-arrow-right ms-1" /></Button>
              </div>
            </Window>
          )}
        </Tab.Pane>

        <Tab.Pane eventKey="result">
          {result && input && (
            <Window title="Вікно 3. Результат і графік функції" icon="bi-graph-up">
              <Row className="g-3 mb-3">
                <Col md={6} lg={4}>
                  <div className="result-tile emph">
                    <div className="label">Результуючий інтервал X*</div>
                    <div className="value mono">{iv(result.X)}</div>
                  </div>
                </Col>
                <Col sm={6} md={3} lg={2}>
                  <div className="result-tile">
                    <div className="label">Ширина</div>
                    <div className="value mono">{result.X.width.toExponential(2)}</div>
                  </div>
                </Col>
                <Col sm={6} md={3} lg={2}>
                  <div className="result-tile">
                    <div className="label">Ітерацій</div>
                    <div className="value mono">{result.iterations}</div>
                  </div>
                </Col>
                <Col sm={6} md={6} lg={2}>
                  <div className="result-tile">
                    <div className="label">Час ітерацій</div>
                    <div className="value mono">{result.timeMs.toFixed(3)} мс</div>
                  </div>
                </Col>
                <Col sm={6} md={6} lg={2}>
                  <div className="result-tile">
                    <div className="label">Похибка ε</div>
                    <div className="value mono">{result.errorPct.toExponential(2)} %</div>
                  </div>
                </Col>
              </Row>
              <p className="small text-body-secondary mb-2">
                Графік f(x) на початковому проміжку [{fmtNum(a)}; {fmtNum(b)}]; смугою позначено результуючий інтервал
                (його середина m = {fmtNum(result.X.mid, 8)} — наближене значення нуля).
              </p>
              <ResultChart f={input.f} a={a} b={b} r={result} />
              <div className="d-flex justify-content-between mt-4 no-print">
                <Button variant="outline-secondary" onClick={() => setStep('iter')}><i className="bi bi-arrow-left me-1" />Назад</Button>
                <Button variant="outline-primary" onClick={() => window.print()}><i className="bi bi-printer me-1" />Друк / PDF</Button>
              </div>
            </Window>
          )}
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  )
}
