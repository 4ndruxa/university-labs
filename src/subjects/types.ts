import type { ComponentType, LazyExoticComponent } from 'react'

export interface Work {
  id: string // #/<subject>/<id>
  short: string // «ЛР1»
  title: string // «Лабораторна робота №1»
  topic: string
  /** Немає сторінки — робота в розробці */
  component?: LazyExoticComponent<ComponentType>
}

export interface Subject {
  id: string
  title: string
  short: string // «МАІД»
  icon: string // bootstrap-icons
  description: string
  works: Work[]
  /** Додатковий блок на сторінці предмета */
  overview?: LazyExoticComponent<ComponentType>
}
