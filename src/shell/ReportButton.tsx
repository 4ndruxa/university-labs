import { Button, ButtonGroup } from 'react-bootstrap'
import { PROFILE } from '../profile'
import { REPORTS } from '../reports'
import { resolveReport } from '../shared/lib/reports'
import type { Subject, Work } from '../subjects/types'

export function ReportButton({ subject, work }: { subject: Subject; work: Work }) {
  const report = resolveReport(REPORTS[`${subject.id}/${work.id}`], import.meta.env.BASE_URL)

  if (!report) {
    return (
      <Button variant="outline-secondary" size="sm" disabled className="no-print">
        <i className="bi bi-file-earmark-pdf me-1" />Звіт ще не готовий
      </Button>
    )
  }

  const fileName = `${PROFILE.name.split(' ')[0]}_${subject.short}_${work.short}.pdf`
  return (
    <ButtonGroup size="sm" className="no-print">
      <Button variant="outline-primary" href={report.href} target="_blank" rel="noopener">
        <i className="bi bi-file-earmark-pdf me-1" />Звіт PDF
      </Button>
      {report.downloadable && (
        <a className="btn btn-outline-primary" href={report.href} download={fileName} title="Завантажити" aria-label="Завантажити звіт">
          <i className="bi bi-download" />
        </a>
      )}
    </ButtonGroup>
  )
}
