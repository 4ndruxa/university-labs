import type { ComplexInterval, Interval } from '../core'

export function IntervalText({ value, className = '' }: { value: Interval; className?: string }) {
  return <span className={`mono ${className}`}>{value.toString()}</span>
}

export function ComplexText({ value, stacked = false }: { value: ComplexInterval; stacked?: boolean }) {
  return (
    <span className="mono">
      <span className="re">{value.re.toString()}</span>
      {stacked ? <br /> : ' '}
      <span className="text-body-secondary">+ i·</span>
      <span className="im">{value.im.toString()}</span>
    </span>
  )
}
