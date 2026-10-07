import { useEffect, useState } from 'react'
import { OverlayTrigger, Popover } from 'react-bootstrap'
import { PROFILE } from '../profile'

const details = (
  <Popover id="student-popover">
    <Popover.Header as="div" className="fw-semibold">{PROFILE.name}</Popover.Header>
    <Popover.Body>
      <StudentDetails />
    </Popover.Body>
  </Popover>
)

export function StudentDetails() {
  return (
    <dl className="student-details mb-0">
      <dt>Група</dt><dd>{PROFILE.group}</dd>
      <dt>Номер у списку</dt><dd>{PROFILE.listNumber}</dd>
    </dl>
  )
}

export function StudentBadge() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const hide = () => setShow(false)
    window.addEventListener('hashchange', hide)
    return () => window.removeEventListener('hashchange', hide)
  }, [])
  return (
    <OverlayTrigger trigger="click" placement="bottom-end" overlay={details} rootClose show={show} onToggle={setShow}>
      <button type="button" className="student-badge" aria-label={`Студент: ${PROFILE.name}, група ${PROFILE.group}`}>
        <span className="avatar">{PROFILE.initials}</span>
        <span className="d-none d-xl-flex flex-column text-start lh-sm">
          <span className="fw-semibold">{PROFILE.name}</span>
          <span className="small opacity-75">{PROFILE.group} · №{PROFILE.listNumber} у списку</span>
        </span>
      </button>
    </OverlayTrigger>
  )
}
