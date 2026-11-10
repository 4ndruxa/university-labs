import type { ReactNode } from 'react'
import type { Scheme } from '../core/pr4'

// Структурна схема надійності: послідовні блоки — зліва направо, паралельні — один під одним
const BOX = { w: 34, h: 22 }
const GAP_X = 14 // провід між послідовними блоками
const RAIL = 12 // відступ від шини паралельного з'єднання
const GAP_Y = 8

interface Size {
  w: number
  h: number
}

function size(s: Scheme): Size {
  if (s.type === 'el') return BOX
  const kids = s.items.map(size)
  if (s.type === 'ser') return { w: kids.reduce((a, k) => a + k.w, 0) + GAP_X * (kids.length - 1), h: Math.max(...kids.map((k) => k.h)) }
  return { w: Math.max(...kids.map((k) => k.w)) + 2 * RAIL, h: kids.reduce((a, k) => a + k.h, 0) + GAP_Y * (kids.length - 1) }
}

function draw(s: Scheme, x: number, y: number, out: ReactNode[]): void {
  const { w, h } = size(s)
  const cy = y + h / 2
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    out.push(<line key={out.length} className="scheme-wire" x1={x1} y1={y1} x2={x2} y2={y2} />)

  if (s.type === 'el') {
    out.push(
      <g key={out.length}>
        <rect className="scheme-box" x={x} y={y} width={w} height={h} rx={4} />
        <text className="scheme-label" x={x + w / 2} y={cy + 4} textAnchor="middle">{s.id}</text>
      </g>,
    )
    return
  }
  if (s.type === 'ser') {
    let cx = x
    s.items.forEach((item, i) => {
      const k = size(item)
      draw(item, cx, cy - k.h / 2, out)
      cx += k.w
      if (i < s.items.length - 1) line(cx, cy, cx + GAP_X, cy)
      cx += GAP_X
    })
    return
  }
  const xl = x + RAIL / 2
  const xr = x + w - RAIL / 2
  line(x, cy, xl, cy)
  line(xr, cy, x + w, cy)
  let top = y
  const mids: number[] = []
  for (const item of s.items) {
    const k = size(item)
    const kx = x + (w - k.w) / 2
    const ky = top + k.h / 2
    mids.push(ky)
    line(xl, ky, kx, ky)
    line(kx + k.w, ky, xr, ky)
    draw(item, kx, top, out)
    top += k.h + GAP_Y
  }
  line(xl, mids[0], xl, mids[mids.length - 1])
  line(xr, mids[0], xr, mids[mids.length - 1])
}

/** Рисунок структурної схеми; вхід і вихід — короткі виводи зліва і справа */
export function SchemeView({ scheme, ariaLabel }: { scheme: Scheme; ariaLabel: string }) {
  const { w, h } = size(scheme)
  const pad = 10
  const out: ReactNode[] = []
  draw(scheme, pad, pad, out)
  const cy = pad + h / 2
  return (
    <svg viewBox={`0 0 ${w + 2 * pad} ${h + 2 * pad}`} className="scheme" role="img" aria-label={ariaLabel}>
      <line className="scheme-wire" x1={0} y1={cy} x2={pad} y2={cy} />
      <line className="scheme-wire" x1={w + pad} y1={cy} x2={w + 2 * pad} y2={cy} />
      {out}
    </svg>
  )
}
