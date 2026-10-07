// localStorage може кидати помилки (приватний режим, вимкнене сховище).
// Префікс — щоб не перетинатися з іншими сайтами на <user>.github.io.
const PREFIX = 'labs:'
const OLD_PREFIXES = ['interval-labs:'] // попередня версія сайту

export function load<T>(key: string, fallback: T): T {
  try {
    let raw = localStorage.getItem(PREFIX + key)
    if (raw === null) {
      for (const old of OLD_PREFIXES) {
        const legacy = localStorage.getItem(old + key)
        if (legacy !== null) {
          localStorage.setItem(PREFIX + key, legacy)
          localStorage.removeItem(old + key)
          raw = legacy
          break
        }
      }
    }
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // сховище недоступне
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ігноруємо
  }
}

export function clearAll(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => [PREFIX, ...OLD_PREFIXES].some((p) => k.startsWith(p)))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // ігноруємо
  }
}
