import { Card, Table } from 'react-bootstrap'

const FORMULAS: [string, string][] = [
  ['A + B', '[a₁ + b₁; a₂ + b₂]'],
  ['A − B', '[a₁ − b₂; a₂ − b₁]'],
  ['A · B', '[min{a₁b₁, a₁b₂, a₂b₁, a₂b₂}; max{…}]'],
  ['A / B', '[min{a₁/b₁, a₁/b₂, a₂/b₁, a₂/b₂}; max{…}]'],
  ['K₁ ± K₂', '(A₁ ± B₁) + i(A₂ ± B₂)'],
  ['K₁ · K₂', '(A₁B₁ − A₂B₂) + i(A₁B₂ + A₂B₁)'],
  ['(B × C)ᵢⱼ', 'Σₖ Bᵢₖ · Cₖⱼ'],
]

export default function Overview() {
  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Body className="p-4">
        <h2 className="h5 mb-3"><i className="bi bi-journal-text me-2 text-primary" />Формули з лекцій</h2>
        <Table responsive size="sm" className="mb-0 align-middle">
          <tbody>
            {FORMULAS.map(([op, f]) => (
              <tr key={op}>
                <td className="mono fw-semibold text-nowrap" style={{ width: '9rem' }}>{op}</td>
                <td className="mono text-nowrap">{f}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="small text-body-secondary mt-3 mb-0">
          Ділення на інтервал, що містить 0, виконується за правилом min/max чотирьох часток (лекція 1, приклад 3);
          програма позначає такі випадки попередженням.
        </p>
      </Card.Body>
    </Card>
  )
}
