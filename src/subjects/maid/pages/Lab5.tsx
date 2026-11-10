import { useMemo, useState, type ReactNode } from 'react'
import { Alert, Badge, Button, Col, Form, Nav, Row, Tab, Table } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { LineChart } from '../../../shared/components/LineChart'
import { padded } from '../../../shared/components/plot'
import { VariantPicker } from '../../../shared/components/VariantPicker'
import { Window } from '../../../shared/components/Window'
import { load, save } from '../../../shared/lib/storage'
import {
  FuncError,
  LAB5_LECTURE,
  LAB5_PARAMS,
  LAB5_VARIANTS,
  LAB5_X,
  fmtNum,
  formatFunction,
  parseFunction,
  solveLab5,
  usedParams,
  validateLab5,
  type Lab5Input,
  type Lab5Result,
  type Lab5Variant,
  type RealMatrix,
} from '../core'

const STORAGE_KEY = 'lab5-draft'
type ParamName = (typeof LAB5_PARAMS)[number]

interface Draft {
  variant: number // 0 — приклад з лекції
  y: string
  a: string
  b: string
  c: string
  eps: string
  x: string
}

const myVariant = (): number => (PROFILE.listNumber >= 1 && PROFILE.listNumber <= LAB5_VARIANTS.length ? PROFILE.listNumber : 1)

const toDraft = (v: Lab5Variant, variant: number): Draft => ({
  variant,
  y: v.y,
  a: String(v.a),
  b: String(v.b),
  c: String(v.c),
  eps: String(v.eps),
  x: (v.x ?? LAB5_X).join('; '),
})
const variantDraft = (v: number): Draft => (v === 0 ? toDraft(LAB5_LECTURE, 0) : toDraft(LAB5_VARIANTS[v - 1], v))

function loadDraft(): Draft {
  const raw = load<Partial<Draft> | null>(STORAGE_KEY, null)
  const base = variantDraft(myVariant())
  if (!raw || typeof raw !== 'object') return base
  const str = (k: Exclude<keyof Draft, 'variant'>) => (typeof raw[k] === 'string' ? (raw[k] as string) : base[k])
  const v = Number(raw.variant)
  return {
    variant: Number.isInteger(v) && v >= 0 && v <= LAB5_VARIANTS.length ? v : base.variant,
    y: str('y'), a: str('a'), b: str('b'), c: str('c'), eps: str('eps'), x: str('x'),
  }
}

/** Число з поля: кома або крапка */
const num = (s: string) => (/^\s*[-−]?\d*[.,]?\d+(e[-+]?\d+)?\s*$/i.test(s) ? Number(s.replace(',', '.').replace('−', '-')) : Number.NaN)
/** Точки x через «;» або пробіл (кома — десяткова) */
const parseX = (s: string): number[] => s.split(/[;\s]+/).filter(Boolean).map(num)

const f = (x: number, digits = 4) => fmtNum(x, digits)
const pct = (x: number) => `${fmtNum(x, 2)} %`

function StepTitle({ n, text }: { n: number; text: string }) {
  return <><span className="step-num">{n}</span>{text}</>
}

function MatrixTable({ M, rowLabels, colLabels }: { M: RealMatrix; rowLabels?: ReactNode[]; colLabels: ReactNode[] }) {
  return (
    <Table size="sm" bordered className="mono small text-center w-auto mb-0">
      <thead>
        <tr>{rowLabels && <th />}{colLabels.map((c, j) => <th key={j}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {M.map((row, i) => (
          <tr key={i}>{rowLabels && <th>{rowLabels[i]}</th>}{row.map((v, j) => <td key={j}>{f(v)}</td>)}</tr>
        ))}
      </tbody>
    </Table>
  )
}

export default function Lab5() {
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [step, setStep] = useState('input')
  const [submitted, setSubmitted] = useState(false)
  const [manualBlock, setManualBlock] = useState<number[] | null>(null)

  const update = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    save(STORAGE_KEY, next)
    setManualBlock(null)
  }
  const pick = (v: number) => {
    const next = variantDraft(v)
    setDraft(next)
    save(STORAGE_KEY, next)
    setManualBlock(null)
  }

  const parsed = useMemo(() => {
    try {
      return { node: parseFunction(draft.y, LAB5_PARAMS), error: null as string | null }
    } catch (e) {
      return { node: null, error: e instanceof FuncError ? e.message : String(e) }
    }
  }, [draft.y])
  const params = useMemo(() => (parsed.node ? usedParams(parsed.node) : []), [parsed.node])
  const input: Lab5Input | null = useMemo(() => {
    if (!parsed.node || !params.length) return null
    const values = Object.fromEntries(params.map((p) => [p, num(draft[p as ParamName])]))
    return { y: parsed.node, params, values, eps: num(draft.eps), x: parseX(draft.x), block: manualBlock ?? undefined }
  }, [parsed.node, params, draft, manualBlock])
  const check = useMemo(() => (input ? validateLab5(input) : { errors: [], warnings: [] }), [input])
  const [result, solveError] = useMemo((): [Lab5Result | null, string | null] => {
    if (!input || check.errors.length) return [null, null]
    try {
      return [solveLab5(input), null]
    } catch (e) {
      return [null, (e as Error).message]
    }
  }, [input, check])

  const pristine = JSON.stringify(draft) === JSON.stringify(variantDraft(draft.variant))
  const showErrors = submitted || !pristine
  const errors = [
    ...(parsed.node && !params.length ? ['У формулі немає жодного з параметрів a, b, c'] : []),
    ...check.errors,
    ...(solveError ? [solveError] : []),
  ]
  const xs = input?.x ?? []
  const xLabel = (rows: number[]) => rows.map((i) => xs[i]).join('; ')

  const compute = () => {
    setSubmitted(true)
    if (result) setStep('sens')
  }

  return (
    <Tab.Container transition={false} activeKey={step} onSelect={(k) => k && setStep(k)}>
      <Nav variant="pills" className="steps gap-2 mb-4 no-print">
        <Nav.Item><Nav.Link eventKey="input"><StepTitle n={1} text="Вхідні дані" /></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="sens" disabled={!result}><StepTitle n={2} text="Чутливість і насичений блок" /></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="tol" disabled={!result}><StepTitle n={3} text="Допуски на параметри" /></Nav.Link></Nav.Item>
      </Nav>

      <Tab.Content>
        <Tab.Pane eventKey="input">
          <Window
            title="Вікно 1. Модель, параметри і коридор відхилень"
            icon="bi-input-cursor-text"
            actions={
              <span className="d-inline-flex align-items-center gap-2 flex-wrap">
                {draft.variant === 0
                  ? <Badge bg="info">Приклад з лекції 7</Badge>
                  : <VariantPicker value={draft.variant} count={LAB5_VARIANTS.length} onChange={pick} />}
                <Button size="sm" variant="outline-secondary" className="no-print" onClick={() => pick(draft.variant === 0 ? myVariant() : 0)}>
                  <i className="bi bi-mortarboard me-1" />{draft.variant === 0 ? 'Мій варіант' : 'Приклад з лекції'}
                </Button>
                <Button size="sm" variant="outline-secondary" className="no-print" onClick={() => pick(draft.variant)} disabled={pristine}>
                  <i className="bi bi-arrow-counterclockwise me-1" />Скинути
                </Button>
              </span>
            }
          >
            <p className="small text-body-secondary">
              Характеристика системи y(x) з номінальними параметрами a, b, c має лишатися в коридорі ±ε % від номінальних
              значень у заданих точках x. Метод допускового еліпсоїдного оцінювання знаходить, наскільки (у відсотках) можна
              відхилити кожен параметр.
            </p>
            <Form noValidate onSubmit={(e) => { e.preventDefault(); compute() }}>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group controlId="l5-y">
                    <Form.Label className="fw-medium">Характеристика y(x)</Form.Label>
                    <Form.Control className="mono" value={draft.y} spellCheck={false} autoComplete="off" isInvalid={!!parsed.error}
                      onChange={(e) => update({ y: e.target.value })} />
                    <Form.Control.Feedback type="invalid">{parsed.error}</Form.Control.Feedback>
                    {parsed.node && <div className="small mono text-body-secondary mt-1">y = {formatFunction(parsed.node)}</div>}
                    <div className="small text-body-secondary mt-1">
                      <i className="bi bi-info-circle me-1" />Змінна <span className="mono">x</span>, параметри{' '}
                      <span className="mono">a, b, c</span>; дії <span className="mono">+ − * / ^</span>; функції{' '}
                      <span className="mono">sin cos tg ctg ln exp sqrt root(вираз, n)</span>.
                    </div>
                  </Form.Group>
                </Col>
                {LAB5_PARAMS.map((p) => (
                  <Col sm={4} md={2} key={p}>
                    <Form.Group controlId={`l5-${p}`}>
                      <Form.Label className="fw-medium">{p}</Form.Label>
                      <Form.Control className="mono" inputMode="decimal" value={draft[p]} disabled={!params.includes(p)}
                        isInvalid={params.includes(p) && !Number.isFinite(num(draft[p]))} onChange={(e) => update({ [p]: e.target.value })} />
                    </Form.Group>
                  </Col>
                ))}
                <Col sm={4} md={2}>
                  <Form.Group controlId="l5-eps">
                    <Form.Label className="fw-medium">Коридор ε, %</Form.Label>
                    <Form.Control className="mono" inputMode="decimal" value={draft.eps} isInvalid={!(num(draft.eps) > 0)} onChange={(e) => update({ eps: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="l5-x">
                    <Form.Label className="fw-medium">Точки x (через «;»)</Form.Label>
                    <Form.Control className="mono" value={draft.x} isInvalid={parseX(draft.x).some((v) => !Number.isFinite(v))} onChange={(e) => update({ x: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>

              {showErrors && errors.length > 0 && (
                <Alert variant="danger" className="mt-3 mb-0 small">{errors.map((e) => <div key={e}>{e}</div>)}</Alert>
              )}
              {check.warnings.length > 0 && (
                <Alert variant="warning" className="mt-3 mb-0 small">{check.warnings.map((e) => <div key={e}><i className="bi bi-exclamation-triangle me-1" />{e}</div>)}</Alert>
              )}

              <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                <Button type="submit" size="lg" disabled={showErrors && !result}>
                  <i className="bi bi-cpu me-2" />Знайти допуски
                </Button>
              </div>
            </Form>
          </Window>
        </Tab.Pane>

        <Tab.Pane eventKey="sens">
          {result && input && (
            <Window title="Вікно 2. Коридор, матриця чутливості і насичений блок" icon="bi-grid-3x3">
              <p className="small text-body-secondary mb-2">
                δy± = ±ε·|y|; чутливість Sᵢⱼ = bⱼ·∂y/∂bⱼ у точці xᵢ (відносні відхилення параметрів).
              </p>
              <Table responsive size="sm" className="mono small text-center align-middle">
                <thead>
                  <tr>
                    <th>x</th><th>y</th><th>y⁻</th><th>y⁺</th><th>δy⁻</th><th>δy⁺</th>
                    {params.map((p) => <th key={p}>S<sub>{p}</sub></th>)}
                  </tr>
                </thead>
                <tbody>
                  {xs.map((x, i) => (
                    <tr key={i} className={result.block.includes(i) ? 'table-active fw-semibold' : undefined}>
                      <td>{f(x)}</td><td>{f(result.y[i])}</td>
                      <td>{f(result.y[i] + result.dyMinus[i])}</td><td>{f(result.y[i] + result.dyPlus[i])}</td>
                      <td>{f(result.dyMinus[i])}</td><td>{f(result.dyPlus[i])}</td>
                      {result.S[i].map((v, j) => <td key={j}>{f(v)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Row className="g-4">
                <Col lg={6}>
                  <div className="fw-medium mb-1">Блоки Sₘ і критерій Π(δy⁺ − δy⁻)²·det(Sₘ·Sₘᵀ)⁻¹</div>
                  <div className="small text-body-secondary mb-2">
                    Насичений блок — з найменшим критерієм. Натисніть рядок, щоб обрати блок вручну.
                  </div>
                  <div style={{ maxHeight: '22rem', overflowY: 'auto' }}>
                    <Table size="sm" hover className="mono small mb-0">
                      <thead><tr><th>точки x</th><th className="text-end">критерій</th></tr></thead>
                      <tbody>
                        {[...result.blocks]
                          .sort((p, q) => (p.criterion ?? Infinity) - (q.criterion ?? Infinity))
                          .map((b) => {
                            const chosen = b.rows.join() === result.block.join()
                            const best = b.rows.join() === result.bestBlock.join()
                            return (
                              <tr key={b.rows.join()} className={chosen ? 'table-primary' : undefined} role="button"
                                onClick={() => b.criterion !== null && setManualBlock(best ? null : b.rows)}>
                                <td>{xLabel(b.rows)}{best && <Badge bg="success" className="ms-2">мінімум</Badge>}</td>
                                <td className="text-end">{b.criterion === null ? 'вироджений' : b.criterion.toPrecision(4)}</td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </Table>
                  </div>
                  {manualBlock && (
                    <Alert variant="info" className="small mt-2 mb-0 py-2">
                      Блок обрано вручну (x = {xLabel(manualBlock)}).{' '}
                      <Button size="sm" variant="link" className="p-0 align-baseline" onClick={() => setManualBlock(null)}>Повернути автоматичний</Button>
                    </Alert>
                  )}
                </Col>
                <Col lg={6}>
                  <div className="fw-medium mb-2">Насичений блок Sₘ (x = {xLabel(result.block)})</div>
                  <MatrixTable M={result.Sm} rowLabels={result.block.map((i) => `x=${xs[i]}`)} colLabels={params.map((p) => <>S<sub>{p}</sub></>)} />
                  <div className="fw-medium mt-3 mb-2">E⁻² = diag({result.E2.map((v) => f(v)).join('; ')})</div>
                  <div className="fw-medium mb-2">H = Sₘᵀ·E⁻²·Sₘ</div>
                  <MatrixTable M={result.H} colLabels={params} rowLabels={params} />
                </Col>
              </Row>
              <div className="d-flex justify-content-between mt-4 no-print">
                <Button variant="outline-secondary" onClick={() => setStep('input')}><i className="bi bi-arrow-left me-1" />Назад</Button>
                <Button onClick={() => setStep('tol')}>Далі: допуски <i className="bi bi-arrow-right ms-1" /></Button>
              </div>
            </Window>
          )}
        </Tab.Pane>

        <Tab.Pane eventKey="tol">
          {result && input && (
            <Window title="Вікно 3. Знайдені допуски на параметри" icon="bi-sliders">
              <p className="small mono mb-3">
                r = min Δᵢ² / (Sᵢᵀ·H⁻¹·Sᵢ) = {f(result.r, 6)} (досягається в точці x = {xs[result.rIndex]})
              </p>
              <Row className="g-3 mb-3">
                {params.map((p, j) => {
                  const v = input.values[p]
                  const d = (Math.abs(v) * result.tolerances[j]) / 100
                  return (
                    <Col md={4} key={p}>
                      <div className="result-tile emph h-100">
                        <div className="label">Допуск на параметр {p}</div>
                        <div className="value mono">δ{p} = {pct(result.tolerances[j])}</div>
                        <div className="mono mt-1">{p} = {f(v)} ± {f(d)}</div>
                        <div className="mono">[{f(v - d)}; {f(v + d)}]</div>
                        <div className="small text-body-secondary mt-1">півось еліпсоїда √(r/h) = {pct(result.semiAxes[j])}</div>
                      </div>
                    </Col>
                  )
                })}
              </Row>
              <p className="small text-body-secondary">
                Допуски за формулою лекції δbⱼ = r/√hⱼⱼ·100 %, де hⱼⱼ — діагональні елементи H. Нижче — номінальна характеристика і
                коридор допустимих відхилень; виділено точки насиченого блоку.
              </p>
              <div className="window-chart">
                <LineChart
                  x={xs}
                  series={[
                    { label: 'y⁺', values: result.y.map((v, i) => v + result.dyPlus[i]), marker: 'triangle', dash: '6 4', color: '#dc2626' },
                    { label: 'y (номінал)', values: result.y, marker: 'circle' },
                    { label: 'y⁻', values: result.y.map((v, i) => v + result.dyMinus[i]), marker: 'square', dash: '6 4', color: '#059669' },
                  ]}
                  bands={result.block.map((i) => ({ from: xs[i] - 0.04 * (xs.at(-1)! - xs[0]), to: xs[i] + 0.04 * (xs.at(-1)! - xs[0]) }))}
                  {...(() => {
                    const all = result.y.flatMap((v, i) => [v + result.dyPlus[i], v + result.dyMinus[i]])
                    const [lo, hi] = padded(Math.min(...all), Math.max(...all), 0.06)
                    return { yMin: lo, yMax: hi }
                  })()}
                  zeroLine
                  xTitle="x"
                  yTitle="y"
                  ariaLabel="Номінальна характеристика і коридор відхилень"
                />
              </div>
              <div className="d-flex justify-content-between mt-4 no-print">
                <Button variant="outline-secondary" onClick={() => setStep('sens')}><i className="bi bi-arrow-left me-1" />Назад</Button>
                <Button variant="outline-primary" onClick={() => window.print()}><i className="bi bi-printer me-1" />Друк / PDF</Button>
              </div>
            </Window>
          )}
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  )
}
