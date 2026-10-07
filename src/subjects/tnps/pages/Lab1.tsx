import { useMemo, useState, type ChangeEvent } from 'react'
import { Alert, Button, Col, Form, Row, Table } from 'react-bootstrap'
import { PROFILE } from '../../../profile'
import { A4Sheet, Answer, Ink } from '../../../shared/components/A4Sheet'
import { Window } from '../../../shared/components/Window'
import { computeIndicators, validateTestData, type Indicators, type TestData } from '../core/indicators'
import { LAB1_INTERVAL, LAB1_TASK } from '../core/lab1'

/** Число для бланка: до digits знаків, десяткова кома */
const ua = (x: number, digits = 4) => String(Number(x.toFixed(digits))).replace('.', ',')
const dot = (x: number, digits = 5) => String(Number(x.toFixed(digits)))

interface Draft {
  n0: string
  totalTime: string
  failures: string
  interval: string
}

const TASK_DRAFT: Draft = {
  n0: String(LAB1_TASK.n0),
  totalTime: String(LAB1_TASK.totalTime),
  failures: LAB1_TASK.failures.join(', '),
  interval: String(LAB1_INTERVAL),
}

function parse(d: Draft): { data: TestData; interval: number } {
  const num = (s: string) => (/^\s*\d+(\.\d+)?\s*$/.test(s) ? Number(s) : Number.NaN)
  const failures = d.failures.trim() === '' ? [] : d.failures.split(/[\s,;]+/).filter(Boolean).map(num)
  return { data: { n0: num(d.n0), totalTime: num(d.totalTime), failures }, interval: num(d.interval) }
}

function Sheet({ data, r, k }: { data: TestData; r: Indicators; k: number }) {
  const row = r.rows[k - 1]
  const sumTerms = r.rows.map((x) => `${x.failed}·${ua(x.tMid)}`).join(' + ')
  return (
    <A4Sheet>
      <h2>Лабораторна робота №1</h2>
      <p className="a4-center">з дисципліни «Теорія надійності програмних систем»</p>
      <p className="a4-center">студента групи <Ink>{PROFILE.group} {PROFILE.name}</Ink></p>

      <h3>Теоретичний блок</h3>
      <p>1. Надійність – це</p>
      <Answer>
        <p>
          властивість об'єкта зберігати в часі у встановлених межах значення всіх параметрів, що характеризують
          здатність виконувати необхідні функції в заданих режимах та умовах застосування, технічного
          обслуговування, ремонту, зберігання і транспортування.
        </p>
      </Answer>
      <p>2. Основні кількісні показники теорії надійності.</p>
      <Answer>
        <ul>
          <li>ймовірність безвідмовної роботи P(t) = N(t) / N₀;</li>
          <li>ймовірність відмови Q(t) = 1 − P(t) = (N₀ − N(t)) / N₀;</li>
          <li>частота відмов f(t) = n(Δt) / (N₀·Δt);</li>
          <li>інтенсивність відмов λ(t) = n(Δt) / (N(t)·Δt);</li>
          <li>середній час безвідмовної роботи T = (1/N₀)·Σ nᵢ·tᵢ.</li>
        </ul>
      </Answer>
      <p>3. Види надійності</p>
      <Answer>
        <p>фізична, схемна, апаратна, програмна, функціональна.</p>
      </Answer>

      <h3>Практичний блок</h3>
      <p>
        1. Тестування надійності проводилось над {data.n0} зразками однотипних об'єктів протягом {data.failures.length}{' '}
        однакових інтервалів часу. Сумарний час тестування – {ua(data.totalTime)} год. Кількість відмов за інтервалами:{' '}
        {data.failures.join(', ')}. Знайти середній час безвідмовної роботи об'єкту та всі кількісні показники
        надійності для {k}-го інтервалу тестування.
      </p>
      <Answer>
        <p>Δt = {ua(data.totalTime)} / {data.failures.length} = {ua(r.dt)} год.</p>
        <p>T = ({sumTerms}) / {data.n0} ≈ {ua(r.meanTime, 2)} год.</p>
        <p>
          Інтервал {k}: ({ua(row.t0)}; {ua(row.t1)}] год, N({ua(row.t0)}) = {row.nStart}, N({ua(row.t1)}) = {row.nEnd}, n = {row.failed}.
        </p>
        <p>P({ua(row.t1)}) = {row.nEnd} / {data.n0} ≈ {ua(row.p)};  Q({ua(row.t1)}) = 1 − {ua(row.p)} = {ua(row.q)};</p>
        <p>
          f = {row.failed} / ({data.n0}·{ua(r.dt)}) ≈ {ua(row.f)} год⁻¹;  λ ={' '}
          {row.lambda === null ? '— (зразків не лишилося)' : <>{row.failed} / ({row.nStart}·{ua(r.dt)}) ≈ {ua(row.lambda)} год⁻¹.</>}
        </p>
        <p>
          Відповідь: T ≈ {ua(r.meanTime, 2)} год; P ≈ {ua(row.p)}; Q ≈ {ua(row.q)}; f ≈ {ua(row.f)} год⁻¹; λ ≈{' '}
          {row.lambda === null ? '—' : `${ua(row.lambda)} год⁻¹`}.
        </p>
      </Answer>
    </A4Sheet>
  )
}

export default function Lab1() {
  const [draft, setDraft] = useState<Draft>(TASK_DRAFT)
  const { data, interval } = useMemo(() => parse(draft), [draft])
  const errors = useMemo(() => {
    const e = validateTestData(data)
    if (!e.length && (!Number.isInteger(interval) || interval < 1 || interval > data.failures.length)) {
      e.push(`Номер інтервалу — від 1 до ${data.failures.length}`)
    }
    return e
  }, [data, interval])
  const result = useMemo(() => (errors.length ? null : computeIndicators(data)), [errors, data])
  const isTask = (Object.keys(TASK_DRAFT) as (keyof Draft)[]).every((key) => draft[key] === TASK_DRAFT[key])
  const set = (key: keyof Draft) => (e: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [key]: e.target.value })

  return (
    <>
      {result ? (
        <Sheet data={data} r={result} k={interval} />
      ) : (
        <Alert variant="warning">Аркуш з'явиться, коли дані буде виправлено.</Alert>
      )}

      <Window
        title="Вікно 1. Вхідні дані"
        icon="bi-input-cursor-text"
        actions={
          <Button size="sm" variant="outline-secondary" className="no-print" onClick={() => setDraft(TASK_DRAFT)} disabled={isTask}>
            <i className="bi bi-arrow-counterclockwise me-1" />Дані завдання
          </Button>
        }
      >
        <Row className="g-3">
          <Col sm={6} lg={3}>
            <Form.Group controlId="t-n0">
              <Form.Label className="fw-medium">Кількість зразків N₀</Form.Label>
              <Form.Control className="mono" inputMode="numeric" value={draft.n0} onChange={set('n0')} />
            </Form.Group>
          </Col>
          <Col sm={6} lg={3}>
            <Form.Group controlId="t-time">
              <Form.Label className="fw-medium">Сумарний час, год</Form.Label>
              <Form.Control className="mono" inputMode="decimal" value={draft.totalTime} onChange={set('totalTime')} />
            </Form.Group>
          </Col>
          <Col sm={8} lg={4}>
            <Form.Group controlId="t-fail">
              <Form.Label className="fw-medium">Відмови по інтервалах</Form.Label>
              <Form.Control className="mono" value={draft.failures} onChange={set('failures')} placeholder="3, 6, 8, 19" />
            </Form.Group>
          </Col>
          <Col sm={4} lg={2}>
            <Form.Group controlId="t-k">
              <Form.Label className="fw-medium">Інтервал</Form.Label>
              <Form.Control className="mono" inputMode="numeric" value={draft.interval} onChange={set('interval')} />
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
        <Window title="Вікно 2. Показники за всіма інтервалами" icon="bi-table">
          <Table responsive size="sm" className="mono mb-2 align-middle">
            <thead>
              <tr>
                <th>№</th><th>Інтервал, год</th><th>n</th><th>N(t₀)</th><th>N(t₁)</th>
                <th>P(t₁)</th><th>Q(t₁)</th><th>f, год⁻¹</th><th>λ, год⁻¹</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((x) => (
                <tr key={x.index} className={x.index === interval ? 'table-active fw-semibold' : undefined}>
                  <td>{x.index}</td>
                  <td className="text-nowrap">{dot(x.t0, 3)}–{dot(x.t1, 3)}</td>
                  <td>{x.failed}</td>
                  <td>{x.nStart}</td>
                  <td>{x.nEnd}</td>
                  <td>{dot(x.p)}</td>
                  <td>{dot(x.q)}</td>
                  <td>{dot(x.f)}</td>
                  <td>{x.lambda === null ? '—' : dot(x.lambda)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mono mb-2">T = Σ nᵢ·tᵢ / N₀ = {dot(result.meanTime, 4)} год</div>
          <div className="small text-body-secondary">
            λ рахується через N(t) на початок інтервалу, як у лекції 1. Якщо брати середнє N на інтервалі, для
            інтервалу {interval}: λ ={' '}
            {result.rows[interval - 1].lambdaAvg === null ? '—' : dot(result.rows[interval - 1].lambdaAvg!)} год⁻¹.
          </div>
        </Window>
      )}
    </>
  )
}
