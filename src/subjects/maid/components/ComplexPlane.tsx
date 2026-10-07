import { useMemo, useState } from 'react'
import { Form } from 'react-bootstrap'
import type { ComplexInterval } from '../core'
import { fmtTick, niceTicks, padded, scale } from '../../../shared/components/plot'

export interface PlaneItem {
  key: string
  label: string
  value: ComplexInterval
  color: string
  defaultOn?: boolean
}

const W = 640
const H = 400
const M = { l: 52, r: 16, t: 16, b: 34 }

/** Комплексні інтервали як прямокутники Re × Im; масштаб — за увімкненими фігурами */
export function ComplexPlane({ items }: { items: PlaneItem[] }) {
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((it) => [it.key, it.defaultOn ?? true])))
  const visible = items.filter((it) => on[it.key])

  const geom = useMemo(() => {
    const src = visible.length ? visible : items
    const xs = src.flatMap((it) => [it.value.re.lo, it.value.re.hi, 0])
    const ys = src.flatMap((it) => [it.value.im.lo, it.value.im.hi, 0])
    const [x0, x1] = padded(Math.min(...xs), Math.max(...xs))
    const [y0, y1] = padded(Math.min(...ys), Math.max(...ys))
    return {
      sx: scale(x0, x1, M.l, W - M.r),
      sy: scale(y0, y1, H - M.b, M.t),
      xt: niceTicks(x0, x1),
      yt: niceTicks(y0, y1, 5),
    }
  }, [visible, items])
  const { sx, sy, xt, yt } = geom

  return (
    <div>
      <div className="plane-toggles d-flex flex-wrap column-gap-3 mb-2 no-print">
        {items.map((it) => (
          <Form.Check
            key={it.key}
            type="switch"
            id={`plane-${it.key}`}
            checked={on[it.key]}
            onChange={() => setOn((s) => ({ ...s, [it.key]: !s[it.key] }))}
            label={<span><span className="legend-swatch" style={{ background: it.color }} />{it.label}</span>}
          />
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="Комплексні інтервали на комплексній площині">
        {xt.map((t) => (
          <g key={`x${t}`}>
            <line className="grid" x1={sx(t)} x2={sx(t)} y1={M.t} y2={H - M.b} />
            <text x={sx(t)} y={H - M.b + 16} textAnchor="middle">{fmtTick(t)}</text>
          </g>
        ))}
        {yt.map((t) => (
          <g key={`y${t}`}>
            <line className="grid" x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} />
            <text x={M.l - 6} y={sy(t) + 4} textAnchor="end">{fmtTick(t)}</text>
          </g>
        ))}
        <line className="axis" x1={sx(0)} x2={sx(0)} y1={M.t} y2={H - M.b} />
        <line className="axis" x1={M.l} x2={W - M.r} y1={sy(0)} y2={sy(0)} />
        <text x={W - M.r - 4} y={sy(0) - 6} textAnchor="end">Re</text>
        <text x={sx(0) + 6} y={M.t + 10}>Im</text>
        {visible.map((it) => {
          const x = sx(it.value.re.lo)
          const y = sy(it.value.im.hi)
          const w = Math.max(sx(it.value.re.hi) - x, 2)
          const h = Math.max(sy(it.value.im.lo) - y, 2)
          return (
            <g key={it.key}>
              <rect x={x} y={y} width={w} height={h} fill={it.color} fillOpacity={0.18} stroke={it.color} strokeWidth={2} rx={2}>
                <title>{`${it.label} = ${it.value.toString()}`}</title>
              </rect>
              <text x={x + 4} y={y + 13} style={{ fill: it.color, fontWeight: 700 }}>{it.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
