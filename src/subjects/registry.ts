// Новий предмет: тека в src/subjects + запис у SUBJECTS
import { maid } from './maid/meta'
import { tnps } from './tnps/meta'
import type { Subject, Work } from './types'

export const SUBJECTS: readonly Subject[] = [maid, tnps]

export function findSubject(id: string | undefined): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id)
}

export function findWork(subject: Subject, id: string | undefined): Work | undefined {
  return subject.works.find((w) => w.id === id)
}

export const subjectHref = (s: Subject): string => `#/${s.id}`
export const workHref = (s: Subject, w: Work): string => `#/${s.id}/${w.id}`
