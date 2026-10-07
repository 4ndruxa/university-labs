import { Badge, Button, Card, Col, Row } from 'react-bootstrap'
import { PROFILE } from '../profile'
import { SUBJECTS, subjectHref, workHref } from '../subjects/registry'

export default function PortalHome() {
  return (
    <>
      <section className="hero p-4 p-md-5 mb-4 shadow">
        <Row className="align-items-center g-4">
          <Col lg={8}>
            <div className="text-uppercase small opacity-75 mb-2 fw-semibold">Портфоліо лабораторних робіт</div>
            <h1 className="display-6 fw-bold mb-3">{PROFILE.name}</h1>
            <p className="lead mb-0">
              Студент групи <b>{PROFILE.group}</b> · №{PROFILE.listNumber} у списку групи.
              Інтерактивне виконання лабораторних робіт з навчальних дисциплін.
            </p>
          </Col>
          <Col lg={4} className="d-none d-lg-flex justify-content-end">
            <div className="hero-avatar" aria-hidden>{PROFILE.initials}</div>
          </Col>
        </Row>
      </section>

      <h2 className="h5 mb-3">Дисципліни</h2>
      <Row className="g-4">
        {SUBJECTS.map((s) => {
          const ready = s.works.filter((w) => w.component).length
          return (
            <Col md={6} key={s.id}>
              <Card className="lab-card h-100 border-0 shadow-sm rounded-4" data-accent={s.id}>
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="lab-icon"><i className={`bi ${s.icon}`} /></div>
                    <div>
                      <Badge bg="primary" className="mb-1">{s.short}</Badge>
                      <h3 className="h5 mb-0">{s.title}</h3>
                    </div>
                  </div>
                  <p className="small text-body-secondary">{s.description}</p>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {s.works.map((w) => (
                      <Button key={w.id} href={workHref(s, w)} size="sm" variant={w.component ? 'outline-primary' : 'outline-secondary'}>
                        {w.short}
                        {!w.component && <i className="bi bi-hourglass-split ms-1" title="У розробці" />}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-auto d-flex align-items-center justify-content-between gap-2">
                    <span className="small text-body-secondary">Виконано {ready} з {s.works.length}</span>
                    <Button href={subjectHref(s)}>Відкрити <i className="bi bi-arrow-right ms-1" /></Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>
    </>
  )
}
