import type { Matrix } from '../core'
import { ComplexText } from './Numbers'

interface Props {
  name: string
  matrix: Matrix
  numbers?: readonly (readonly number[])[] // номери елементів з умови
  selected?: [number, number] | null
  onSelect?: (i: number, j: number) => void
  highlight?: (i: number, j: number) => boolean
}

const SUB = ['₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

export function MatrixView({ name, matrix, numbers, selected, onSelect, highlight }: Props) {
  return (
    <div className="d-inline-flex align-items-center gap-2">
      <span className="mono fw-bold fs-5 text-nowrap">{name} =</span>
      <div className="matrix" role="group" aria-label={`Матриця ${name}`}>
        {matrix.map((row, i) =>
          row.map((z, j) => {
            const isSel = selected?.[0] === i && selected?.[1] === j
            const cls = `matrix-cell ${isSel ? 'selected' : ''} ${highlight?.(i, j) ? 'highlight' : ''}`
            const content = (
              <>
                <span className="idx">{numbers ? `(${numbers[i][j]})` : `${name}${SUB[i]}${SUB[j]}`}</span>
                <ComplexText value={z} stacked />
              </>
            )
            return onSelect ? (
              <button type="button" key={`${i}${j}`} className={cls} onClick={() => onSelect(i, j)} aria-pressed={isSel}>
                {content}
              </button>
            ) : (
              <div key={`${i}${j}`} className={cls}>{content}</div>
            )
          }))}
      </div>
    </div>
  )
}
