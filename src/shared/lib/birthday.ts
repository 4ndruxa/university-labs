const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** Найближчий день народження (00:00 місцевого часу), не раніше сьогодні */
export function nextBirthday(day: number, month: number, now: Date): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let y = now.getFullYear(); ; y++) {
    if (month === 2 && day === 29 && !isLeap(y)) continue
    const d = new Date(y, month - 1, day)
    if (d >= today) return d
  }
}

export interface Countdown {
  today: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function countdown(day: number, month: number, now: Date): Countdown {
  const target = nextBirthday(day, month, now)
  const ms = target.getTime() - now.getTime()
  if (ms <= 0) return { today: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  const s = Math.floor(ms / 1000)
  return {
    today: false,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

const plural = new Intl.PluralRules('uk')
const DAY_FORMS: Record<string, string> = { one: 'день', few: 'дні', many: 'днів', other: 'дня' }

export const daysWord = (n: number): string => `${n} ${DAY_FORMS[plural.select(n)]}`
