import type { ReactNode } from 'react'
import { Card } from 'react-bootstrap'

interface Props {
  title: string
  icon?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function Window({ title, icon, actions, children, className = '' }: Props) {
  return (
    <Card className={`window mb-4 ${className}`}>
      <Card.Header className="d-flex align-items-center gap-2">
        <span className="window-dots" aria-hidden>
          <span style={{ background: '#f87171' }} />
          <span style={{ background: '#fbbf24' }} />
          <span style={{ background: '#34d399' }} />
        </span>
        {icon && <i className={`bi ${icon} text-primary`} aria-hidden />}
        <span className="window-title">{title}</span>
        {actions && <span className="window-actions ms-auto">{actions}</span>}
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  )
}
