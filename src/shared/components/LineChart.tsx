import { fmtTick, niceTicks, scale } from './plot'

export interface Series {
  label: string
  values: number[]
  dash?: string // stroke-dasharray
  marker: 'circle' | 'square' | 'triangle'
}

interface Props {
  x: number[]
  series: Series[]
  yMin?: number
  yMax?: number
  xTitle?: string
  yTitle?: string
  ariaLabel: string
}

const W = 600
const H = 280
const M = { l: 48, r: 14, t: 22, b: 40 }

function Marker({ kind, x, y }: { kind: Series['marker']; x: number; y: number }) {
  if (kind === 'circle') return <circle className="chart-marker" cx={x} cy={y} r={4} />
  if (kind === 'square') return <rect className="chart-marker" x={x - 4} y={y - 4} width={8} height={8} />
  return <path className="chart-marker" d={`M${x} ${y - 5} L${x + 5} ${y + 4} L${x - 5} ${y + 4} Z`} />
}

/** Лінійний графік кількох серій; серії розрізняються типом лінії та маркером (читається й у ч/б) */
export function LineChart({ x, series, yMin = 0, yMax = 1, xTitle, yTitle, ariaLabel }: Props) {
  const sx = scale(x[0], x[x.length - 1], M.l, W - M.r)
  const sy = scale(yMin, yMax, H - M.b, M.t)
  const yTicks = niceTicks(yMin, yMax, 5)
  return (
    <>
      <div className="chart-legend-row">
        {series.map((s) => (
          <span key={s.label} className="chart-legend-item">
            <svg viewBox="0 0 34 12" width="34" height="12" aria-hidden>
              <line className="chart-line" strokeDasharray={s.dash} x1={1} x2={33} y1={6} y2={6} />
              <Marker kind={s.marker} x={17} y={6} />
            </svg>
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={ariaLabel}>
        {yTicks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} />
            <text className="chart-tick" x={M.l - 6} y={sy(t) + 4} textAnchor="end">{fmtTick(t)}</text>
          </g>
        ))}
        {x.map((t) => (
          <text key={t} className="chart-tick" x={sx(t)} y={H - M.b + 16} textAnchor="middle">{fmtTick(t)}</text>
        ))}
        <line className="chart-axis" x1={M.l} x2={W - M.r} y1={sy(yMin)} y2={sy(yMin)} />
        <line className="chart-axis" x1={M.l} x2={M.l} y1={M.t} y2={sy(yMin)} />
        {series.map((s) => (
          <g key={s.label}>
            <polyline className="chart-line" strokeDasharray={s.dash} points={s.values.map((v, i) => `${sx(x[i])},${sy(v)}`).join(' ')} />
            {s.values.map((v, i) => <Marker key={i} kind={s.marker} x={sx(x[i])} y={sy(v)} />)}
          </g>
        ))}
        {xTitle && <text className="chart-title" x={W - M.r} y={H - 6} textAnchor="end">{xTitle}</text>}
        {yTitle && <text className="chart-title" x={8} y={M.t - 10}>{yTitle}</text>}
      </svg>
    </>
  )
}
