import { useEffect, useState } from 'react'

export interface Route {
  subjectId?: string
  workId?: string
  /** Зайві сегменти адреси, напр. #/maid/lab1/x */
  extra?: boolean
}

// Адреси першої версії сайту
const LEGACY: Record<string, string> = { '#home': '#/', '#lab1': '#/maid/lab1', '#lab2': '#/maid/lab2' }

function parse(): Route {
  const legacy = LEGACY[window.location.hash.replace(/\/+$/, '').toLowerCase()]
  if (legacy) history.replaceState(null, '', legacy)
  const path = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  const [subjectId, workId, ...rest] = path.split('/').filter(Boolean)
  return { subjectId, workId, extra: rest.length > 0 }
}

/** #/ — головна, #/<предмет>, #/<предмет>/<робота> */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
