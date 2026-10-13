import { fileURLToPath } from 'node:url'

export const SITE_URL = 'https://4ndruxa.github.io/university-labs/'
export const REPO_URL = 'https://github.com/4ndruxa/university-labs'

/** Адреса сторінки роботи, напр. workUrl('maid', 'lab2') */
export const workUrl = (subject: string, work: string): string => `${SITE_URL}#/${subject}/${work}`

export const MAID_TEACHER = { position: 'к.т.н., доцент', name: 'Крепич С. Я.', female: true }

/** Шлях до файлу ядра предмета */
export const coreFile = (subject: string, name: string): string =>
  fileURLToPath(new URL(`../../../src/subjects/${subject}/core/${name}`, import.meta.url))

// ТНПС веде той самий викладач
export const TNPS_TEACHER = MAID_TEACHER
