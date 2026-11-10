import { lazy } from 'react'
import type { Subject } from '../types'

export const usr: Subject = {
  id: 'usr',
  title: 'Управління та стратегічний розвиток ІТ-бізнесу',
  short: 'УСР',
  icon: 'bi-briefcase',
  description: 'Програмне забезпечення для управління командою: задачі, пріоритети, дедлайни, звіти для менеджера.',
  works: [
    {
      id: 'tm',
      short: 'Тренінг',
      title: 'Тренінг та самостійна робота',
      kind: 'training',
      topic: 'Варіант 1. Task Manager для команди',
      component: lazy(() => import('./pages/TaskManager')),
    },
  ],
}
