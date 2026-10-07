import { useMemo, useState } from 'react'
import { Accordion, Alert, Button, Col, Form, Nav, Row, Tab, Table } from 'react-bootstrap'
import { MatrixView } from '../components/MatrixView'
import { ComplexText } from '../components/Numbers'
import { BirthdayToast } from '../../../shared/components/BirthdayEgg'
import { Window } from '../../../shared/components/Window'
import { FIELD_LABELS, LAYOUT, parseField, productTerms, solveLab2, validate, type StudentData } from '../core'
import { PROFILE } from '../../../profile'
import { load, remove, save } from '../../../shared/lib/storage'

type Field = keyof StudentData
type Draft = Record<Field, string>

const FIELDS: { key: Field; hint: string }[] = [
  { key: 'day', hint: '1–31' },
  { key: 'month', hint: '1–12' },
  { key: 'zal', hint: 'цифра 0–9' },
  { key: 'stud', hint: 'цифра 0–9' },
  { key: 'jrn', hint: 'за списком групи' },
  { key: 'lab', hint: 'номер лабораторної' },
]

const STORAGE_KEY = 'lab2-draft'
const DEFAULTS: Draft = {
  day: String(PROFILE.birthDay),
  month: String(PROFILE.birthMonth),
  zal: String(PROFILE.recordBookLastDigit),
  stud: String(PROFILE.studentIdLastDigit),
  jrn: String(PROFILE.listNumber),
  lab: '2',
}

/** Формули елементів з умови (довідка) */
const ELEMENT_FORMULAS = [
  '[−1; 1] + i[Ост_студ ± 3]', '[День ± 10] + i[−4; 0]', '[−2; 2] + i[((Журн + Лаб) ± 4)/5]',
  '[Місяць ± 5] + i[0; 1]', '[−3; 3] + i[((Ост_студ + Ост_зал) ± 6)/4]', '[(День + Місяць)/2 ± 5] + i[−2; 2]',
  '[−4; 4] + i[День ± 10]', '[((День + Місяць) ± 5)/4] + i[0; 3]', '[−5; 5] + i[Журн ± 2]',
  '[0; 1] + i[Місяць ± 5]', '[Ост_зал ± 2] + i[−1; 0]', '[0; 2] + i[(Журн + Лаб)/3 ± 4]',
  '[Ост_студ ± 3] + i[0; 5]', '[0; 3] + i[(День + Місяць)/2 ± 5]', '[(Ост_студ + Ост_зал)/2 ± 4] + i[−1; 1]',
  '[0; 4] + i[Лаб ± 5]', '[((Ост_студ + Ост_зал) ± 6)/4] + i[−4; 4]', '[0; 5] + i[((День + Місяць) ± 5)/4]',
  '[−5; 0] + i[(Ост_студ + Ост_зал)/2 ± 4]', '[Журн ± 2] + i[0; 2]', '[−4; 0] + i[Ост_зал ± 2]',
  '[Лаб ± 5] + i[−3; 3]', '[−3; 0] + i[−5; 0]', '[(Журн + Лаб)/3 ± 4] + i[−2; 0]',
  '[−2; 0] + i[−5; 5]', '[((Журн + Лаб) ± 4)/5] + i[0; 4]', '[−1; 0] + i[−3; 0]',
]

/** Дані з localStorage можуть бути пошкоджені — беремо лише відомі поля */
function loadDraft(): Draft {
  const raw = load<unknown>(STORAGE_KEY, {})
  const draft = { ...DEFAULTS }
  if (raw && typeof raw === 'object') {
    for (const { key } of FIELDS) {
      const v = (raw as Record<string, unknown>)[key]
      if (typeof v === 'string' || typeof v === 'number') draft[key] = String(v)
    }
  }
  return draft
}

const toData = (d: Draft): StudentData => {
  const n = parseField
  return { day: n(d.day), month: n(d.month), zal: n(d.zal), stud: n(d.stud), jrn: n(d.jrn), lab: n(d.lab) }
}

const SUB = ['₁', '₂', '₃']

function StepTitle({ n, text }: { n: number; text: string }) {
  return <><span className="step-num">{n}</span>{text}</>
}

export default function Lab2() {
  const [draft, setDraft] = useState<Draft>(loadDraft)
  // Помилку поля показуємо після виходу з нього або після «Сформувати», далі — наживо
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState('input')
  const [sel, setSel] = useState<[number, number]>([0, 0])

  const data = useMemo(() => toData(draft), [draft])
  const errors = useMemo(() => validate(data), [data])
  const valid = Object.keys(errors).length === 0
  const result = useMemo(() => (valid ? solveLab2(data) : null), [valid, data])
  const isDefault = FIELDS.every(({ key }) => draft[key] === DEFAULTS[key])
  const errorOf = (k: Field) => (submitted || touched[k] ? errors[k] : undefined)

  const birthdayOk = !errors.day && !errors.month
  const [eggOpened, setEggOpened] = useState<number | null>(null)

  const update = (k: Field, v: string) => {
    const next = { ...draft, [k]: v }
    setDraft(next)
    save(STORAGE_KEY, next)
  }

  const compute = () => {
    setSubmitted(true)
    if (valid) setStep('matrices')
  }

  const resetToMine = () => {
    remove(STORAGE_KEY)
    setDraft(DEFAULTS)
    setTouched({})
    setSubmitted(false)
  }

  const [si, sj] = sel
  const terms = result ? productTerms(result.B, result.C, si, sj) : []

  return (
    <>
      <Tab.Container transition={false} activeKey={step} onSelect={(k) => k && setStep(k)}>
        <Nav variant="pills" className="steps gap-2 mb-4 no-print">
          <Nav.Item><Nav.Link eventKey="input"><StepTitle n={1} text="Вхідні дані" /></Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="matrices" disabled={!result}><StepTitle n={2} text="Матриці A, B, C" /></Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="q" disabled={!result}><StepTitle n={3} text="Результат Q" /></Nav.Link></Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="input">
            <Window
              title="Вікно 1. Введення початкових даних"
              icon="bi-person-lines-fill"
              actions={
                <div className="no-print">
                  <Button size="sm" variant="outline-secondary" onClick={resetToMine} disabled={isDefault}>
                    <i className="bi bi-person-check me-1" />Мої дані
                  </Button>
                </div>
              }
            >
              <p className="small text-body-secondary mb-3">
                <i className={`bi ${isDefault ? 'bi-person-check' : 'bi-pencil'} me-1`} />
                {isDefault
                  ? `Підставлено ваші дані (${PROFILE.name}, №${PROFILE.listNumber}) — їх можна змінити.`
                  : 'Дані змінено. «Мої дані» повертає початкові значення.'}
              </p>
              <Form noValidate onSubmit={(e) => { e.preventDefault(); compute() }}>
                <Row className="g-3">
                  {FIELDS.map(({ key, hint }) => (
                    <Col md={6} lg={4} key={key}>
                      <Form.Group controlId={`f-${key}`}>
                        <Form.Label className="fw-medium">
                          {key === 'day' || key === 'month'
                            ? <span className="bday-egg" onClick={() => setEggOpened(Date.now())}>{FIELD_LABELS[key]}</span>
                            : FIELD_LABELS[key]}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={3}
                          autoComplete="off"
                          value={draft[key]}
                          placeholder={hint}
                          onChange={(e) => update(key, e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
                          isInvalid={!!errorOf(key)}
                          aria-invalid={!!errorOf(key)}
                          aria-describedby={`f-${key}-err`}
                          className="mono"
                        />
                        <Form.Control.Feedback type="invalid" id={`f-${key}-err`}>{errorOf(key)}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
                <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                  <Button type="submit" size="lg">
                    <i className="bi bi-cpu me-2" />Сформувати матриці та обчислити Q
                  </Button>
                  <span className="small text-body-secondary">
                    <i className="bi bi-shield-lock me-1" />Змінені значення зберігаються лише в цьому браузері
                  </span>
                </div>
              </Form>

              <Accordion className="mt-4 no-print">
                <Accordion.Item eventKey="f">
                  <Accordion.Header>Як із даних формуються елементи 1–27</Accordion.Header>
                  <Accordion.Body>
                    <p className="small text-body-secondary">
                      Запис <span className="mono">[x ± d]</span> означає інтервал <span className="mono">[x − d; x + d]</span>.
                      Номери розміщуються в матрицях по стовпцях: A — 1…9, B — 10…18, C — 19…27.
                    </p>
                    <Table size="sm" responsive className="mb-0 small">
                      <tbody>
                        {ELEMENT_FORMULAS.map((f, i) => (
                          <tr key={i}><td className="text-body-secondary" style={{ width: '3rem' }}>{i + 1}</td><td className="mono">{f}</td></tr>
                        ))}
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Window>
          </Tab.Pane>

          <Tab.Pane eventKey="matrices">
            {result && (
              <Window title="Вікно 2. Сформовані матриці A, B, C" icon="bi-grid-3x3">
                <div className="d-flex flex-column gap-4 overflow-auto">
                  <MatrixView name="A" matrix={result.A} numbers={LAYOUT.A} />
                  <MatrixView name="B" matrix={result.B} numbers={LAYOUT.B} />
                  <MatrixView name="C" matrix={result.C} numbers={LAYOUT.C} />
                </div>
                <div className="small text-body-secondary mt-3">
                  У правому верхньому куті клітинки — номер комплексного виразу з умови.{' '}
                  <span className="re">Синім</span> — дійсна частина, <span className="im">бурштиновим</span> — уявна.
                  Межі округлено назовні до 4 знаків.
                </div>
                <div className="d-flex justify-content-between mt-4 no-print">
                  <Button variant="outline-secondary" onClick={() => setStep('input')}><i className="bi bi-arrow-left me-1" />Назад</Button>
                  <Button onClick={() => setStep('q')}>Далі: Q <i className="bi bi-arrow-right ms-1" /></Button>
                </div>
              </Window>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="q">
            {result && (
              <Window title="Вікно 3. Результуюча матриця Q = B × C − A" icon="bi-calculator">
                <Row className="g-4">
                  <Col xs={12} className="overflow-auto">
                    <MatrixView name="Q" matrix={result.Q} selected={sel} onSelect={(i, j) => setSel([i, j])} />
                    <div className="small text-body-secondary mt-2 no-print">
                      <i className="bi bi-hand-index me-1" />Натисніть на елемент, щоб побачити, з чого він складається.
                    </div>
                  </Col>
                  <Col xs={12} lg={10} xl={8}>
                    <div className="result-tile emph">
                      <div className="label mb-2">
                        Q{SUB[si]}{SUB[sj]} = B{SUB[si]}₁·C₁{SUB[sj]} + B{SUB[si]}₂·C₂{SUB[sj]} + B{SUB[si]}₃·C₃{SUB[sj]} − A{SUB[si]}{SUB[sj]}
                      </div>
                      <Table size="sm" className="mb-0 small">
                        <tbody>
                          {terms.map((t, k) => (
                            <tr key={k}>
                              <td className="mono text-nowrap">B{SUB[si]}{SUB[k]}·C{SUB[k]}{SUB[sj]}</td>
                              <td><ComplexText value={t} /></td>
                            </tr>
                          ))}
                          <tr>
                            <td className="mono text-nowrap">Σ = (B×C){SUB[si]}{SUB[sj]}</td>
                            <td><ComplexText value={result.BC[si][sj]} /></td>
                          </tr>
                          <tr>
                            <td className="mono text-nowrap">− A{SUB[si]}{SUB[sj]}</td>
                            <td><ComplexText value={result.A[si][sj]} /></td>
                          </tr>
                          <tr className="fw-semibold">
                            <td className="mono text-nowrap">= Q{SUB[si]}{SUB[sj]}</td>
                            <td><ComplexText value={result.Q[si][sj]} /></td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </Col>
                </Row>
                <Accordion className="mt-4">
                  <Accordion.Item eventKey="bc">
                    <Accordion.Header>Проміжний результат B × C</Accordion.Header>
                    <Accordion.Body className="overflow-auto">
                      <MatrixView name="B×C" matrix={result.BC} />
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
                <div className="d-flex justify-content-between mt-4 no-print">
                  <Button variant="outline-secondary" onClick={() => setStep('matrices')}><i className="bi bi-arrow-left me-1" />Назад</Button>
                  <Button variant="outline-primary" onClick={() => window.print()}><i className="bi bi-printer me-1" />Друк / PDF</Button>
                </div>
              </Window>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {!result && step !== 'input' && <Alert variant="info">Спершу виправте дані у кроці 1.</Alert>}
      <BirthdayToast
        day={birthdayOk ? data.day : PROFILE.birthDay}
        month={birthdayOk ? data.month : PROFILE.birthMonth}
        opened={eggOpened}
        onClose={() => setEggOpened(null)}
      />
    </>
  )
}
