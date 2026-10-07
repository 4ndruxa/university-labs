import type { ReactNode } from 'react'
import './a4.css'

/** Аркуш А4 у вигляді заповненого бланка */
export function A4Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="a4-wrap">
      <article className="a4-sheet" data-bs-theme="light">{children}</article>
    </div>
  )
}

/** Відповідь, вписана в рядок бланка */
export function Ink({ children }: { children: ReactNode }) {
  return <span className="a4-ink">{children}</span>
}

/** Багаторядкова відповідь на лініях бланка */
export function Answer({ children }: { children: ReactNode }) {
  return <div className="a4-answer">{children}</div>
}
