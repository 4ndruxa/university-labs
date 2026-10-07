import { Table } from 'react-bootstrap'
import { fmtNum, type Step } from '../core'

const OP_SYMBOL = { '+': '+', '-': '−', '*': '·', '/': '/' } as const
const RULE = {
  '+': 'a₁ + b₁; a₂ + b₂',
  '-': 'a₁ − b₂; a₂ − b₁',
  '*': 'min/max {a₁b₁, a₁b₂, a₂b₁, a₂b₂}',
  '/': 'min/max {a₁/b₁, a₁/b₂, a₂/b₁, a₂/b₂}',
} as const
const CANDIDATE_NAMES = { '*': ['a₁b₁', 'a₁b₂', 'a₂b₁', 'a₂b₂'], '/': ['a₁/b₁', 'a₁/b₂', 'a₂/b₁', 'a₂/b₂'] } as const

export function TraceTable({ steps }: { steps: Step[] }) {
  return (
    <Table responsive size="sm" className="trace-table mb-0">
      <thead>
        <tr>
          <th style={{ width: '2.5rem' }}>#</th>
          <th>Операція</th>
          <th>Правило</th>
          <th>Результат</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((s, i) => (
          <tr key={i}>
            <td className="text-body-secondary">{i + 1}</td>
            {s.kind === 'neg' ? (
              <>
                <td className="mono">−{s.a.toString()}</td>
                <td className="small text-body-secondary">[−a₂; −a₁]</td>
              </>
            ) : (
              <>
                <td className="mono">
                  {s.a.toString()} <b className="text-primary">{OP_SYMBOL[s.op]}</b> {s.b.toString()}
                </td>
                <td className="small text-body-secondary">
                  [{RULE[s.op]}]
                  {s.candidates && (s.op === '*' || s.op === '/') && (
                    <details>
                      <summary>чотири значення</summary>
                      <span className="mono">
                        {s.candidates.map((c, k) => `${CANDIDATE_NAMES[s.op as '*' | '/'][k]} = ${fmtNum(c)}`).join(', ')}
                      </span>
                    </details>
                  )}
                </td>
              </>
            )}
            <td className="mono fw-semibold">{s.result.toString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
