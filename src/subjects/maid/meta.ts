import { lazy } from 'react'
import type { Subject } from '../types'

export const maid: Subject = {
  id: 'maid',
  title: 'Методи аналізу інтервальних даних',
  short: 'МАІД',
  icon: 'bi-bounding-box-circles',
  description: 'Арифметика дійсних і комплексних інтервалів, інтервальні вирази та інтервальні матриці.',
  overview: lazy(() => import('./pages/Overview')),
  works: [
    {
      id: 'lab1',
      short: 'ЛР1',
      title: 'Лабораторна робота №1',
      topic: 'Програмні системи для обчислення виразів та рівнянь, заданих в інтервальному вигляді',
      component: lazy(() => import('./pages/Lab1')),
    },
    {
      id: 'lab2',
      short: 'ЛР2',
      title: 'Лабораторна робота №2',
      topic: 'Арифметичні операції з інтервальними матрицями: Q = B × C − A',
      component: lazy(() => import('./pages/Lab2')),
    },
    { id: 'lab3', short: 'ЛР3', title: 'Лабораторна робота №3', topic: 'Локалізація нулів функції однієї дійсної змінної' },
    { id: 'lab4', short: 'ЛР4', title: 'Лабораторна робота №4', topic: 'Інтервальна система лінійних алгебраїчних рівнянь' },
    {
      id: 'lab5',
      short: 'ЛР5',
      title: 'Лабораторна робота №5',
      topic: 'Оптимізація параметрів інтервальних систем на основі ітераційних методів',
    },
    { id: 'lab6', short: 'ЛР6', title: 'Лабораторна робота №6', topic: 'Методи структурної ідентифікації інтервальних систем' },
  ],
}
