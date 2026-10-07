import { Suspense } from 'react'
import { Breadcrumb, Button, Nav, Spinner } from 'react-bootstrap'
import { subjectHref, workHref } from '../subjects/registry'
import type { Subject, Work } from '../subjects/types'
import { Window } from '../shared/components/Window'

export function WorkPage({ subject, work }: { subject: Subject; work: Work }) {
  const idx = subject.works.indexOf(work)
  const prev = subject.works[idx - 1]
  const next = subject.works[idx + 1]
  const Page = work.component

  return (
    <>
      <Breadcrumb className="small no-print">
        <Breadcrumb.Item href="#/">Головна</Breadcrumb.Item>
        <Breadcrumb.Item href={subjectHref(subject)} title={subject.title}>{subject.short}</Breadcrumb.Item>
        <Breadcrumb.Item active>{work.short}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex flex-wrap align-items-start gap-3 mb-4">
        <div className="me-auto">
          <div className="small text-primary fw-semibold mb-1">{subject.title}</div>
          <h1 className="h3 mb-1">{work.title}</h1>
          <div className="text-body-secondary">{work.topic}</div>
        </div>
        <Nav variant="pills" className="work-pills no-print" activeKey={work.id}>
          {subject.works.map((w) => (
            <Nav.Item key={w.id}>
              <Nav.Link eventKey={w.id} href={workHref(subject, w)}>{w.short}</Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>

      {Page ? (
        <Suspense fallback={<div className="py-5 text-center"><Spinner animation="border" /></div>}>
          <Page />
        </Suspense>
      ) : (
        <Window title="Робота в розробці" icon="bi-hourglass-split">
          <p className="mb-0 text-body-secondary">
            Розділ «{work.title}» з дисципліни «{subject.title}» ще готується і з'явиться найближчим часом.
          </p>
        </Window>
      )}

      <div className="d-flex justify-content-between gap-2 mt-2 no-print">
        {prev ? (
          <Button variant="outline-secondary" href={workHref(subject, prev)}><i className="bi bi-arrow-left me-1" />{prev.short}</Button>
        ) : <span />}
        {next ? (
          <Button variant="outline-secondary" href={workHref(subject, next)}>{next.short}<i className="bi bi-arrow-right ms-1" /></Button>
        ) : (
          <Button variant="outline-secondary" href={subjectHref(subject)}>До дисципліни<i className="bi bi-arrow-up-right ms-1" /></Button>
        )}
      </div>
    </>
  )
}
