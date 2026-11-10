import { describe, expect, it } from 'vitest'
import { demoTasks, level, priority, rank, report, status, urgency, validateTask, type Task } from '../../../src/subjects/usr/core/tasks'

const ON = '2026-11-10'
const task = (o: Partial<Task>): Task => ({ id: 'x', title: 'Задача', assignee: 'Андрій', deadline: ON, importance: 3, complexity: 3, done: false, ...o })

describe('УСР тренінг: Task Manager', () => {
  it('статус: завершено / прострочено / в роботі', () => {
    expect(status(task({ done: true, deadline: '2026-01-01' }), ON)).toBe('done')
    expect(status(task({ deadline: '2026-11-09' }), ON)).toBe('overdue')
    expect(status(task({ deadline: ON }), ON)).toBe('inProgress')
  })

  it('терміновість: 1 на дедлайні й після, 0 через 14+ днів, лінійно між', () => {
    expect(urgency(task({ deadline: ON }), ON)).toBe(1)
    expect(urgency(task({ deadline: '2026-11-01' }), ON)).toBe(1)
    expect(urgency(task({ deadline: '2026-11-17' }), ON)).toBeCloseTo(0.5, 12)
    expect(urgency(task({ deadline: '2026-12-31' }), ON)).toBe(0)
  })

  it('пріоритет за формулою 100·(0,45·I + 0,20·S + 0,35·U)', () => {
    expect(priority(task({ importance: 5, complexity: 5, deadline: ON }), ON)).toBe(100)
    expect(priority(task({ importance: 1, complexity: 1, deadline: '2027-01-01' }), ON)).toBe(0)
    // I = 0,5; S = 0,5; U = 0,5 → 50
    expect(priority(task({ importance: 3, complexity: 3, deadline: '2026-11-17' }), ON)).toBe(50)
    expect(priority(task({ importance: 5, done: true }), ON)).toBe(0)
    expect([level(65), level(64), level(40), level(39)]).toEqual(['high', 'medium', 'medium', 'low'])
  })

  it('сортування: за пріоритетом, завершені — в кінці', () => {
    const rows = rank(demoTasks(ON), ON)
    expect(rows.at(-1)!.done).toBe(true)
    for (let i = 1; i < rows.length - 1; i++) expect(rows[i - 1].priority).toBeGreaterThanOrEqual(rows[i].priority)
  })

  it('звіт: топ-3, прострочені, навантаження, виконання', () => {
    const r = report(demoTasks(ON), ON)
    expect(r.total).toBe(8)
    expect(r.byStatus).toEqual({ inProgress: 5, done: 1, overdue: 2 })
    expect(r.top3).toHaveLength(3)
    expect(r.top3.every((t) => !t.done)).toBe(true)
    expect(r.overdue.map((t) => t.id).sort()).toEqual(['t2', 't7'])
    expect(r.completion).toBe(13)
    const andrii = r.load.find((p) => p.assignee === 'Андрій')!
    expect(andrii).toMatchObject({ open: 1, overdue: 0, points: 4 })
  })

  it('перевірка введення', () => {
    expect(validateTask(task({}))).toEqual([])
    expect(validateTask(task({ title: ' ', assignee: '' }))).toHaveLength(2)
    expect(validateTask(task({ deadline: '10.11.2026' }))).toEqual(['Вкажіть дедлайн'])
    expect(validateTask(task({ importance: 6, complexity: 0 }))).toHaveLength(2)
  })
})
