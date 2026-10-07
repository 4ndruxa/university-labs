import { fmtTick, niceTicks, scale } from './plot'

export interface Bar {
  label: string
  value: number
}

interface Props {
  bars: Bar[]
  xTitle?: string
  yTitle?: string
  ariaLabel: string
}

const W = 600
const H = 260
const M = { l: 44, r: 12, t: 22, b: 44 }

/** Стовпчикова діаграма з підписом значення над кожним стовпцем */
export function BarChart({ bars, xTitle, yTitle, ariaLabel }: Props) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  const ticks = niceTicks(0, max, 4).filter((t) => Number.isInteger(t))
  const sy = scale(0, Math.max(max, ticks[ticks.length - 1] ?? max), H - M.b, M.t)
  const bw = (W - M.l - M.r) / bars.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={ariaLabel}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="chart-grid" x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} />
          <text className="chart-tick" x={M.l - 6} y={sy(t) + 4} textAnchor="end">{fmtTick(t)}</text>
        </g>
      ))}
      {bars.map((b, i) => {
        const x = M.l + i * bw
        return (
          <g key={b.label}>
            <rect className="chart-bar" x={x + 3} y={sy(b.value)} width={bw - 6} height={sy(0) - sy(b.value)} />
            <text className="chart-value" x={x + bw / 2} y={sy(b.value) - 5} textAnchor="middle">{b.value}</text>
            <text className="chart-tick" x={x + bw / 2} y={H - M.b + 16} textAnchor="middle">{b.label}</text>
          </g>
        )
      })}
      <line className="chart-axis" x1={M.l} x2={W - M.r} y1={sy(0)} y2={sy(0)} />
      <line className="chart-axis" x1={M.l} x2={M.l} y1={M.t} y2={sy(0)} />
      {xTitle && <text className="chart-title" x={(W + M.l) / 2} y={H - 6} textAnchor="middle">{xTitle}</text>}
      {yTitle && <text className="chart-title" x={M.l} y={12} textAnchor="middle">{yTitle}</text>}
    </svg>
  )
}
