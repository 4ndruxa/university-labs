import { useEffect, useState } from 'react'
import { Button, Container, Nav, NavDropdown, Navbar, Offcanvas } from 'react-bootstrap'
import { PROFILE } from '../profile'
import type { Route } from '../shared/lib/useRoute'
import type { Theme } from '../shared/lib/useTheme'
import { SUBJECTS, subjectHref, workHref } from '../subjects/registry'
import { StudentBadge, StudentDetails } from './StudentBadge'

interface Props {
  route: Route
  theme: Theme
  onToggleTheme: () => void
}

export function NavBar({ route, theme, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  // Закрити й після «Назад» у браузері та при переході на десктопну ширину
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 992px)')
    const onWide = () => wide.matches && setOpen(false)
    window.addEventListener('hashchange', close)
    wide.addEventListener('change', onWide)
    return () => {
      window.removeEventListener('hashchange', close)
      wide.removeEventListener('change', onWide)
    }
  }, [])

  const themeButton = (
    <Button
      size="sm"
      variant="outline-light"
      onClick={onToggleTheme}
      title={theme === 'light' ? 'Темна тема' : 'Світла тема'}
      aria-label="Перемкнути тему"
      className="theme-btn"
    >
      <i className={`bi ${theme === 'light' ? 'bi-moon-stars' : 'bi-sun'}`} />
    </Button>
  )

  return (
    <Navbar expand="lg" variant="dark" className="app-navbar py-2 shadow-sm" sticky="top" expanded={open} onToggle={setOpen}>
      <Container>
        <Navbar.Brand href="#/" onClick={close} className="d-flex align-items-center gap-2 me-lg-4">
          <i className="bi bi-mortarboard-fill brand-mark" />
          <span className="fw-semibold">Лабораторні роботи</span>
        </Navbar.Brand>

        <div className="d-flex align-items-center gap-2 ms-auto order-lg-last">
          <StudentBadge />
          <span className="d-none d-lg-inline">{themeButton}</span>
          <Navbar.Toggle aria-controls="main-menu" className="ms-1" />
        </div>

        <Navbar.Offcanvas id="main-menu" placement="end" aria-labelledby="main-menu-title" className="menu-offcanvas">
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title id="main-menu-title" className="d-flex align-items-center gap-2">
              <span className="avatar">{PROFILE.initials}</span>
              <span className="lh-sm">
                <span className="d-block fw-semibold">{PROFILE.name}</span>
                <span className="d-block small opacity-75">{PROFILE.group}</span>
              </span>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="flex-column flex-lg-row">
            <div className="d-lg-none small mb-3 opacity-75"><StudentDetails /></div>
            <Nav className="me-auto gap-lg-1" onSelect={close}>
              <Nav.Link href="#/" active={!route.subjectId}><i className="bi bi-house me-1" />Головна</Nav.Link>
              {SUBJECTS.map((s) => (
                <NavDropdown
                  key={s.id}
                  data-accent={s.id}
                  id={`menu-${s.id}`}
                  title={<span title={s.title}><i className={`bi ${s.icon} me-1`} />{s.short}</span>}
                  active={route.subjectId === s.id}
                >
                  <NavDropdown.Header className="subject-menu-title">{s.title}</NavDropdown.Header>
                  <NavDropdown.Item href={subjectHref(s)} active={route.subjectId === s.id && !route.workId}>
                    <i className="bi bi-grid me-2" />Огляд дисципліни
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  {s.works.map((w) => (
                    <NavDropdown.Item key={w.id} href={workHref(s, w)} active={route.subjectId === s.id && route.workId === w.id}>
                      <b className="me-2">{w.short}</b>
                      <span className="small text-body-secondary">{w.component ? w.topic : 'у розробці'}</span>
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              ))}
            </Nav>
            <div className="d-lg-none mt-4">{themeButton} <span className="small opacity-75 ms-2">Тема оформлення</span></div>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  )
}
