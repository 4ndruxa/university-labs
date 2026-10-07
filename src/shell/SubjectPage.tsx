import { Suspense } from 'react'
import { Badge, Breadcrumb, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import { workHref } from '../subjects/registry'
import type { Subject } from '../subjects/types'

export function SubjectPage({ subject }: { subject: Subject }) {
  const Overview = subject.overview
  return (
    <>
      <Breadcrumb className="small no-print">
        <Breadcrumb.Item href="#/">Головна</Breadcrumb.Item>
        <Breadcrumb.Item active>{subject.short}</Breadcrumb.Item>
      </Breadcrumb>
      <div className="d-flex align-items-center gap-3 mb-2">
        <div className="lab-icon"><i className={`bi ${subject.icon}`} /></div>
        <div>
          <Badge bg="primary" className="mb-1">{subject.short}</Badge>
          <h1 className="h3 mb-0">{subject.title}</h1>
        </div>
      </div>
      <p className="text-body-secondary mb-4">{subject.description}</p>

      <Row className="g-4 mb-4">
        {subject.works.map((w) => (
          <Col md={6} key={w.id}>
            <Card className="lab-card h-100 border-0 shadow-sm rounded-4">
              <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h2 className="h5 mb-0">{w.title}</h2>
                  {w.component
                    ? <Badge bg="success-subtle" text="success-emphasis"><i className="bi bi-check2 me-1" />Виконано</Badge>
                    : <Badge bg="secondary-subtle" text="secondary-emphasis"><i className="bi bi-hourglass-split me-1" />У розробці</Badge>}
                </div>
                <p className="small text-body-secondary mb-4">{w.topic}</p>
                <Button href={workHref(subject, w)} className="mt-auto align-self-start" variant={w.component ? 'primary' : 'outline-secondary'}>
                  Відкрити <i className="bi bi-arrow-right ms-1" />
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {Overview && (
        <Suspense fallback={<Spinner animation="border" size="sm" />}>
          <Overview />
        </Suspense>
      )}
    </>
  )
}
