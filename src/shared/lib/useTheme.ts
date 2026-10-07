import { useEffect, useState } from 'react'
import { load, save } from './storage'

export type Theme = 'light' | 'dark'

/** Тема Bootstrap через data-bs-theme */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => (load<unknown>('theme', 'light') === 'dark' ? 'dark' : 'light'))
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    save('theme', theme)
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))]
}
