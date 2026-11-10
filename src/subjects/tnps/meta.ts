import { lazy } from 'react'
import type { Subject } from '../types'

// Порядок і нумерація — як у курсі на СДН: практичні та лабораторні нумеруються окремо,
// лабораторної №1 у курсі немає
export const tnps: Subject = {
  id: 'tnps',
  title: 'Теорія надійності програмних систем',
  short: 'ТНПС',
  icon: 'bi-shield-check',
  description: 'Кількісні показники надійності, закони розподілу відмов, готовність і ризик систем, структурні схеми, резервування.',
  works: [
    {
      id: 'pr1',
      short: 'ПР1',
      title: 'Практична робота №1',
      kind: 'practical',
      topic: 'Кількісні характеристики надійності за статистичними даними про відмови',
      component: lazy(() => import('./pages/Pr1')),
    },
    {
      id: 'pr2',
      short: 'ПР2',
      title: 'Практична робота №2',
      kind: 'practical',
      topic: 'Найбільш поширені закони розподілу часу до відмови',
      component: lazy(() => import('./pages/Pr2')),
    },
    {
      id: 'lr2',
      short: 'ЛР2',
      title: 'Лабораторна робота №2',
      topic: 'Дослідження надійності і ризику відновлювальної нерезервованої системи',
      component: lazy(() => import('./pages/Lr2')),
    },
    {
      id: 'pr3',
      short: 'ПР3',
      title: 'Практична робота №3',
      kind: 'practical',
      topic: 'Надійність і ризик нерезервованої невідновлювальної системи',
      component: lazy(() => import('./pages/Pr3')),
    },
    {
      id: 'pr4',
      short: 'ПР4',
      title: 'Практична робота №4',
      kind: 'practical',
      topic: 'Метод структурних схем: імовірність безвідмовної роботи системи',
      component: lazy(() => import('./pages/Pr4')),
    },
    {
      id: 'lr3',
      short: 'ЛР3',
      title: 'Лабораторна робота №3',
      topic: 'Визначення надійності складних систем з резервуванням',
    },
  ],
}
