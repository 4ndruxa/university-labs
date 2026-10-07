export interface ResolvedReport {
  href: string
  /** Атрибут download працює лише для файлів з того ж сайту */
  downloadable: boolean
}

/** '' → null; https://… — як є; відносний шлях — від base (import.meta.env.BASE_URL) */
export function resolveReport(link: string | undefined, base: string): ResolvedReport | null {
  const value = link?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return { href: value, downloadable: false }
  const prefix = base.endsWith('/') ? base : `${base}/`
  return { href: prefix + value.replace(/^\.?\/+/, ''), downloadable: true }
}
