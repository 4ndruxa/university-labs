import { useMemo, useState } from 'react'
import { Alert, Badge, Button, ButtonGroup, Col, Form, Row, Table } from 'react-bootstrap'
import { Window } from '../../../shared/components/Window'
import { load, save } from '../../../shared/lib/storage'
import {
  LEVEL_LABEL,
  STATUS_LABEL,
  URGENCY_HORIZON,
  WEIGHTS,
  demoTasks,
  rank,
  report,
  today,
  validateTask,
  type Level,
  type Status,
  type Task,
} from '../core/tasks'

const STORAGE_KEY = 'usr-tasks'
const LEVEL_BG: Record<Level, string> = { high: 'danger', medium: 'warning', low: 'secondary' }
const STATUS_BG: Record<Status, string> = { inProgress: 'info', done: 'success', overdue: 'danger' }
const fmtDate = (iso: string) => iso.split('-').reverse().join('.')

type Draft = Omit<Task, 'id' | 'importance' | 'complexity'> & { importance: string; complexity: string }
const emptyDraft = (on: string): Draft => ({ title: '', assignee: '', deadline: on, importance: '3', complexity: '3', done: false })
const toDraft = (t: Task): Draft => ({ ...t, importance: String(t.importance), complexity: String(t.complexity) })

/** Новий id: t + (найбільший числовий номер + 1) */
const nextId = (tasks: readonly Task[]): string => `t${Math.max(0, ...tasks.map((t) => Number(t.id.replace(/\D/g, '')) || 0)) + 1}`

function loadTasks(on: string): Task[] {
  const raw = load<unknown>(STORAGE_KEY, null)
  if (!Array.isArray(raw)) return demoTasks(on)
  return raw.filter((t): t is Task => !!t && typeof t === 'object' && typeof (t as Task).id === 'string' && validateTask(t as Task).length === 0)
}

export default function TaskManager() {
  const on = today()
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(on))
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all')
  const [editing, setEditing] = useState<string | null>(null) // id або 'new'
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(on))
  const [touched, setTouched] = useState(false)

  const commit = (next: Task[]) => {
    setTasks(next)
    save(STORAGE_KEY, next)
  }
  const rows = useMemo(() => rank(tasks, on), [tasks, on])
  const shown = rows.filter((r) => (statusFilter === 'all' || r.status === statusFilter) && (levelFilter === 'all' || r.level === levelFilter))
  const rep = useMemo(() => report(tasks, on), [tasks, on])
  const parsed: Omit<Task, 'id'> = { ...draft, importance: Number(draft.importance), complexity: Number(draft.complexity) }
  const errors = validateTask(parsed)
  const people = [...new Set(tasks.map((t) => t.assignee))].sort()

  const startNew = () => { setEditing('new'); setDraft(emptyDraft(on)); setTouched(false) }
  const startEdit = (t: Task) => { setEditing(t.id); setDraft(toDraft(t)); setTouched(false) }
  const submit = () => {
    setTouched(true)
    if (errors.length) return
    if (editing === 'new') commit([...tasks, { ...parsed, id: nextId(tasks) }])
    else commit(tasks.map((t) => (t.id === editing ? { ...parsed, id: t.id } : t)))
    setEditing(null)
  }
  const remove = (id: string) => {
    const t = tasks.find((x) => x.id === id)
    if (t && window.confirm(`Видалити задачу «${t.title}»?`)) commit(tasks.filter((x) => x.id !== id))
  }

  return (
    <>
      <Window
        title="Вікно 1. Задачі команди"
        icon="bi-list-task"
        actions={
          <span className="d-inline-flex gap-2 no-print">
            <Button size="sm" onClick={startNew}><i className="bi bi-plus-lg me-1" />Додати</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => window.confirm('Повернути демонстраційні задачі?') && commit(demoTasks(on))}>
              <i className="bi bi-arrow-counterclockwise me-1" />Демо-дані
            </Button>
          </span>
        }
      >
        <Row className="g-2 mb-3 no-print">
          <Col sm="auto">
            <ButtonGroup size="sm" aria-label="Фільтр за статусом">
              {(['all', 'inProgress', 'overdue', 'done'] as const).map((s) => (
                <Button key={s} variant={statusFilter === s ? 'primary' : 'outline-primary'} onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'Усі' : STATUS_LABEL[s]}
                </Button>
              ))}
            </ButtonGroup>
          </Col>
          <Col sm="auto">
            <Form.Select size="sm" value={levelFilter} aria-label="Фільтр за пріоритетом" onChange={(e) => setLevelFilter(e.target.value as Level | 'all')}>
              <option value="all">Будь-який пріоритет</option>
              {(['high', 'medium', 'low'] as const).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
            </Form.Select>
          </Col>
          <Col className="small text-body-secondary align-self-center text-sm-end">Сьогодні {fmtDate(on)} · показано {shown.length} з {rows.length}</Col>
        </Row>

        <Table responsive hover size="sm" className="align-middle mb-2">
          <thead>
            <tr><th>Назва задачі</th><th>Пріоритет</th><th>Відповідальний</th><th>Дедлайн</th><th>Статус</th><th className="no-print" /></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className={r.done ? 'text-body-secondary' : undefined}>
                <td>
                  <Form.Check
                    inline
                    className="me-1 no-print"
                    checked={r.done}
                    aria-label={`Завершено: ${r.title}`}
                    onChange={() => commit(tasks.map((t) => (t.id === r.id ? { ...t, done: !t.done } : t)))}
                  />
                  <span className={r.done ? 'text-decoration-line-through' : 'fw-medium'}>{r.title}</span>
                  <div className="small text-body-secondary">важливість {r.importance}/5 · складність {r.complexity}/5</div>
                </td>
                <td><Badge bg={LEVEL_BG[r.level]} text={r.level === 'medium' ? 'dark' : undefined}>{r.priority}</Badge> <span className="small">{LEVEL_LABEL[r.level]}</span></td>
                <td>{r.assignee}</td>
                <td className="text-nowrap">
                  {fmtDate(r.deadline)}
                  {!r.done && <div className="small text-body-secondary">{r.daysLeft >= 0 ? `за ${r.daysLeft} дн.` : `${-r.daysLeft} дн. тому`}</div>}
                </td>
                <td><Badge bg={STATUS_BG[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                <td className="text-end text-nowrap no-print">
                  <Button size="sm" variant="link" className="p-1" onClick={() => startEdit(r)} aria-label={`Редагувати ${r.title}`}><i className="bi bi-pencil" /></Button>
                  <Button size="sm" variant="link" className="p-1 text-danger" onClick={() => remove(r.id)} aria-label={`Видалити ${r.title}`}><i className="bi bi-trash" /></Button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={6} className="text-center text-body-secondary py-3">Немає задач за обраними фільтрами</td></tr>}
          </tbody>
        </Table>
        <div className="small text-body-secondary">
          Пріоритет P = 100·({WEIGHTS.importance}·I + {WEIGHTS.complexity}·S + {WEIGHTS.urgency}·U), де I, S — важливість і складність
          (1…5 → 0…1), U — терміновість (1 на дедлайні й після нього, 0 за {URGENCY_HORIZON}+ днів). Високий — від 65, середній — від 40.
        </div>
      </Window>

      {editing && (
        <Window title={editing === 'new' ? 'Нова задача' : 'Редагування задачі'} icon="bi-pencil-square" className="no-print">
          <Form noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="tm-title">
                  <Form.Label className="fw-medium">Назва задачі</Form.Label>
                  <Form.Control value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="tm-assignee">
                  <Form.Label className="fw-medium">Відповідальний</Form.Label>
                  <Form.Control list="tm-people" value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} />
                  <datalist id="tm-people">{people.map((p) => <option key={p} value={p} />)}</datalist>
                </Form.Group>
              </Col>
              <Col sm={4}>
                <Form.Group controlId="tm-deadline">
                  <Form.Label className="fw-medium">Дедлайн</Form.Label>
                  <Form.Control type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
                </Form.Group>
              </Col>
              {(['importance', 'complexity'] as const).map((k) => (
                <Col sm={4} key={k}>
                  <Form.Group controlId={`tm-${k}`}>
                    <Form.Label className="fw-medium">{k === 'importance' ? 'Важливість' : 'Складність'} (1–5)</Form.Label>
                    <Form.Select value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}>
                      {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              ))}
            </Row>
            {touched && errors.length > 0 && <Alert variant="danger" className="small mt-3 mb-0">{errors.map((e) => <div key={e}>{e}</div>)}</Alert>}
            <div className="d-flex gap-2 mt-3">
              <Button type="submit"><i className="bi bi-check-lg me-1" />Зберегти</Button>
              <Button variant="outline-secondary" onClick={() => setEditing(null)}>Скасувати</Button>
            </div>
          </Form>
        </Window>
      )}

      <Window title="Вікно 2. Звіт по задачах команди" icon="bi-clipboard-data">
        <Row className="g-3 mb-3">
          {([['Усього', rep.total, ''], ['В роботі', rep.byStatus.inProgress, ''], ['Прострочено', rep.byStatus.overdue, 'emph'], ['Виконано', `${rep.completion} %`, '']] as const).map(([label, value, cls]) => (
            <Col xs={6} md={3} key={label}>
              <div className={`result-tile ${cls}`}>
                <div className="label">{label}</div>
                <div className="value mono">{value}</div>
              </div>
            </Col>
          ))}
        </Row>
        <Row className="g-4">
          <Col lg={6}>
            <div className="fw-medium mb-2">Топ-3 за пріоритетом</div>
            <ol className="mb-0">
              {rep.top3.map((r) => <li key={r.id}><b>{r.title}</b> — {r.assignee}, P = {r.priority}, до {fmtDate(r.deadline)}</li>)}
            </ol>
            <div className="fw-medium mt-3 mb-2">Прострочені задачі</div>
            {rep.overdue.length ? (
              <ul className="mb-0">{rep.overdue.map((r) => <li key={r.id}>{r.title} — {r.assignee}, дедлайн {fmtDate(r.deadline)} ({-r.daysLeft} дн. тому)</li>)}</ul>
            ) : <div className="text-body-secondary">Немає 🎉</div>}
          </Col>
          <Col lg={6}>
            <div className="fw-medium mb-2">Навантаження учасників (незавершені задачі)</div>
            <Table size="sm" className="mb-0">
              <thead><tr><th>Учасник</th><th className="text-end">Задач</th><th className="text-end">Прострочено</th><th className="text-end">Бали складності</th></tr></thead>
              <tbody>
                {rep.load.map((p) => (
                  <tr key={p.assignee}><td>{p.assignee}</td><td className="text-end">{p.open}</td><td className={`text-end ${p.overdue ? 'text-danger fw-semibold' : ''}`}>{p.overdue}</td><td className="text-end">{p.points}</td></tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
        <div className="d-flex justify-content-end mt-3 no-print">
          <Button variant="outline-primary" onClick={() => window.print()}><i className="bi bi-printer me-1" />Друк / PDF</Button>
        </div>
      </Window>
    </>
  )
}
