import { useState } from 'react'
import { Badge, Button, Form } from 'react-bootstrap'
import { PROFILE } from '../../profile'

interface Props {
  value: number
  count: number
  onChange: (variant: number) => void
}

/** Бейдж варіанту; за замовчуванням — свій, інший обирається через «інший» */
export function VariantPicker({ value, count, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const mine = value === PROFILE.listNumber
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <Badge bg={mine ? 'primary' : 'warning'} text={mine ? undefined : 'dark'} className="fw-medium">
        Варіант {value}
      </Badge>
      {open ? (
        <Form.Select
          size="sm"
          className="variant-select no-print"
          value={value}
          aria-label="Варіант"
          autoFocus
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          onChange={(e) => {
            onChange(Number(e.target.value))
            setOpen(false)
          }}
        >
          {Array.from({ length: count }, (_, i) => (
            <option key={i} value={i + 1}>{i + 1}{i + 1 === PROFILE.listNumber ? ' (мій)' : ''}</option>
          ))}
        </Form.Select>
      ) : (
        <Button variant="link" size="sm" className="variant-link p-0 no-print" onClick={() => setOpen(true)}>
          {mine ? 'інший' : 'змінити'}
        </Button>
      )}
      {!mine && !open && (
        <Button variant="link" size="sm" className="variant-link p-0 no-print" onClick={() => onChange(PROFILE.listNumber)}>
          мій
        </Button>
      )}
    </span>
  )
}
