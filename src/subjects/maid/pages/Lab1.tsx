import { useMemo, useState, type ReactNode } from 'react'
import { Alert, Badge, Button, Col, Form, Row, Tab, Tabs } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { ComplexPlane } from '../components/ComplexPlane'
import { ComplexText, IntervalText } from '../components/Numbers'
import { TraceTable } from '../components/TraceTable'
import { VariantPicker } from '../../../shared/components/VariantPicker'
import { Window } from '../../../shared/components/Window'
import { ParseError, VARIANTS, evaluate, solveLab1, type Lab1Result } from '../core'

const COLORS = { k1: '#2563eb', k2: '#db2777', sum: '#059669', diff: '#d97706', prod: '#7c3aed' }

/** Помилка розбору одного виразу (щоб підсвітити саме те поле) */
function checkExpr(src: string): { message: string; pos: number } | null {
  try {
    evaluate(src)
    return null
  } catch (e) {
    return e instanceof ParseError ? { message: e.message, pos: e.pos } : { message: (e as Error).message, pos: 0 }
  }
}

function ExprField({ id, label, value, onChange, error }: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error: { message: string; pos: number } | null
}) {
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label className="fw-medium">{label}</Form.Label>
      <Form.Control
        className="mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        isInvalid={!!error}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        placeholder="напр. [1,4] - [-3,5] * ([4,5] + [8,9])"
        spellCheck={false}
        autoComplete="off"
      />
      {error && (
        <Form.Control.Feedback type="invalid" id={`${id}-err`} aria-live="polite">
          {error.message}
          {value && (
            <div className="mono mt-1">
              {value.slice(0, error.pos)}
              <mark className="px-0">{value.slice(error.pos, error.pos + 1) || ' '}</mark>
              {value.slice(error.pos + 1)}
            </div>
          )}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  )
}

function Tile({ label, children, emph = false }: { label: string; children: ReactNode; emph?: boolean }) {
  return (
    <div className={`result-tile ${emph ? 'emph' : ''}`}>
      <div className="label mb-1">{label}</div>
      <div className="value">{children}</div>
    </div>
  )
}

export default function Lab1() {
  const [variant, setVariant] = useState<number>(PROFILE.listNumber)
  const [e1, setE1] = useState(VARIANTS[PROFILE.listNumber - 1].e1)
  const [e2, setE2] = useState(VARIANTS[PROFILE.listNumber - 1].e2)

  const pickVariant = (n: number) => {
    const v = VARIANTS[n - 1]
    setVariant(n)
    setE1(v.e1)
    setE2(v.e2)
  }

  const err1 = useMemo(() => checkExpr(e1), [e1])
  const err2 = useMemo(() => checkExpr(e2), [e2])
  const v = VARIANTS[variant - 1]
  const outcome = useMemo((): { result: Lab1Result } | { error: string } | null => {
    if (err1 || err2) return null
    try {
      return { result: solveLab1(e1, e2, v.rule) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [e1, e2, v, err1, err2])
  const r = outcome && 'result' in outcome ? outcome.result : null
  const edited = e1 !== v.e1 || e2 !== v.e2

  return (
    <>
      <Window
        title="Вікно 1. Вхідні дані"
        icon="bi-input-cursor-text"
        actions={<VariantPicker value={variant} count={VARIANTS.length} onChange={pickVariant} />}
      >
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span className="text-body-secondary">Формування уявної частини:</span>
          <span className="fw-semibold">{v.rule.text}</span>
          {edited && (
            <Button size="sm" variant="outline-secondary" className="ms-auto no-print" onClick={() => pickVariant(variant)}>
              <i className="bi bi-arrow-counterclockwise me-1" />Вирази як у варіанті
            </Button>
          )}
        </div>
        <ExprField id="e1" label="Вираз 1 → основа X₁ першого комплексного інтервалу" value={e1} onChange={setE1} error={err1} />
        <ExprField id="e2" label="Вираз 2 → основа X₂ другого комплексного інтервалу" value={e2} onChange={setE2} error={err2} />
        <div className="small text-body-secondary">
          <i className="bi bi-info-circle me-1" />
          Інтервал: <span className="mono">[a, b]</span> або <span className="mono">[a; b]</span>; операції{' '}
          <span className="mono">+ − * /</span> (також <span className="mono">· × ÷</span>) і дужки; дробові числа — через крапку.
          Результат перераховується під час введення.
        </div>
      </Window>

      {outcome && 'error' in outcome && <Alert variant="danger"><i className="bi bi-x-octagon me-2" />{outcome.error}</Alert>}

      {r && (
        <>
          <Window title="Вікно 2. Результати" icon="bi-check2-circle">
            {r.warnings.length > 0 && (
              <Alert variant="warning" className="small">
                <i className="bi bi-exclamation-triangle me-2" />
                <b>Ділення на інтервал, що містить 0.</b> В арифметиці Мура таке ділення не визначене; результат
                обчислено правилом min/max чотирьох часток, як у лекції 1 (приклад 3).
                <ul className="mb-0 mt-1">{r.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </Alert>
            )}
            <h3 className="h6 text-body-secondary mb-2">Основи та комплексні інтервали · Y: {v.rule.text.toLowerCase()}</h3>
            <Row className="g-3 mb-4">
              <Col md={6}><Tile label="X₁ — значення виразу 1"><IntervalText value={r.expr1.value} className="re" /></Tile></Col>
              <Col md={6}><Tile label="X₂ — значення виразу 2"><IntervalText value={r.expr2.value} className="re" /></Tile></Col>
              <Col md={6}><Tile label="K₁ = X₁ + i·Y₁"><ComplexText value={r.k1} /></Tile></Col>
              <Col md={6}><Tile label="K₂ = X₂ + i·Y₂"><ComplexText value={r.k2} /></Tile></Col>
            </Row>
            <h3 className="h6 text-body-secondary mb-2">Операції над комплексними інтервалами</h3>
            <Row className="g-3">
              <Col lg={4}><Tile emph label="K₁ + K₂"><ComplexText value={r.sum} stacked /></Tile></Col>
              <Col lg={4}><Tile emph label="K₁ − K₂"><ComplexText value={r.diff} stacked /></Tile></Col>
              <Col lg={4}><Tile emph label="K₁ · K₂"><ComplexText value={r.prod} stacked /></Tile></Col>
            </Row>
            <div className="small text-body-secondary mt-3">
              K₁ ± K₂ = (X₁ ± X₂) + i(Y₁ ± Y₂) · K₁ · K₂ = (X₁X₂ − Y₁Y₂) + i(X₁Y₂ + Y₁X₂) · межі округлено назовні до 4 знаків
            </div>
          </Window>

          <Window title="Вікно 3. Покрокове обчислення" icon="bi-list-ol">
            <Tabs defaultActiveKey="e1" className="mb-3">
              <Tab eventKey="e1" title={<>Вираз 1 <Badge bg="secondary" pill>{r.expr1.trace.length}</Badge></>}>
                <div className="mono small mb-2 text-body-secondary">{e1}</div>
                <TraceTable steps={r.expr1.trace} />
              </Tab>
              <Tab eventKey="e2" title={<>Вираз 2 <Badge bg="secondary" pill>{r.expr2.trace.length}</Badge></>}>
                <div className="mono small mb-2 text-body-secondary">{e2}</div>
                <TraceTable steps={r.expr2.trace} />
              </Tab>
            </Tabs>
          </Window>

          <Window title="Вікно 4. Візуалізація" icon="bi-bounding-box">
            <div style={{ maxWidth: '52rem' }}>
                <h3 className="h6 mb-2">Комплексна площина</h3>
                <p className="small text-body-secondary">
                  Комплексний інтервал у прямокутній формі — це прямокутник Re × Im. Добуток значно більший,
                  тому за замовчуванням вимкнений.
                </p>
                <ComplexPlane
                  key={`${variant}|${e1}|${e2}`}
                  items={[
                    { key: 'k1', label: 'K₁', value: r.k1, color: COLORS.k1 },
                    { key: 'k2', label: 'K₂', value: r.k2, color: COLORS.k2 },
                    { key: 'sum', label: 'K₁+K₂', value: r.sum, color: COLORS.sum },
                    { key: 'diff', label: 'K₁−K₂', value: r.diff, color: COLORS.diff },
                    { key: 'prod', label: 'K₁·K₂', value: r.prod, color: COLORS.prod, defaultOn: false },
                  ]}
                />
            </div>
          </Window>
        </>
      )}
    </>
  )
}
