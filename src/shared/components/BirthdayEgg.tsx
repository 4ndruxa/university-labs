import { useEffect, useState } from 'react'
import { CloseButton, Toast, ToastContainer } from 'react-bootstrap'
import { countdown, daysWord } from '../lib/birthday'

const pad = (n: number) => String(n).padStart(2, '0')

function Banner({ day, month, onClose }: { day: number; month: number; onClose: () => void }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const c = countdown(day, month, now)
  return (
    <Toast onClose={onClose} autohide delay={6000} className="bday-toast">
      <Toast.Body className="d-flex align-items-start gap-2">
        <div className="me-auto">
          {c.today ? (
            <div className="fw-semibold"><span className="bday-wiggle">🎉</span> Сьогодні день народження!</div>
          ) : (
            <div>
              🎂 До дня народження{' '}
              <b className="mono text-nowrap">{daysWord(c.days)} {c.hours} год {pad(c.minutes)} хв {pad(c.seconds)} с</b>
            </div>
          )}
          <div className="small text-body-secondary mt-1">Не забудьте привітати :)</div>
        </div>
        <CloseButton onClick={onClose} aria-label="Закрити" />
      </Toast.Body>
    </Toast>
  )
}

/** Пасхалка: банер з відліком до дня народження (opened — момент відкриття, null — закрито) */
export function BirthdayToast({ day, month, opened, onClose }: { day: number; month: number; opened: number | null; onClose: () => void }) {
  return (
    <ToastContainer position="bottom-end" containerPosition="fixed" className="p-3 d-print-none">
      {opened !== null && <Banner key={opened} day={day} month={month} onClose={onClose} />}
    </ToastContainer>
  )
}
