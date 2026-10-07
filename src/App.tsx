import { Button, Container } from 'react-bootstrap'
import { PROFILE } from './profile'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { Window } from './shared/components/Window'
import { useRoute } from './shared/lib/useRoute'
import { useTheme } from './shared/lib/useTheme'
import { NavBar } from './shell/NavBar'
import PortalHome from './shell/PortalHome'
import { SubjectPage } from './shell/SubjectPage'
import { WorkPage } from './shell/WorkPage'
import { findSubject, findWork } from './subjects/registry'

function NotFound() {
  return (
    <Window title="Сторінку не знайдено" icon="bi-signpost-split">
      <p>За цією адресою нічого немає.</p>
      <Button href="#/">На головну</Button>
    </Window>
  )
}

export default function App() {
  const route = useRoute()
  const [theme, toggleTheme] = useTheme()

  const subject = findSubject(route.subjectId)
  const work = subject && route.workId ? findWork(subject, route.workId) : undefined

  let page
  if (!route.subjectId) page = <PortalHome />
  else if (!subject || (route.workId && !work) || route.extra) page = <NotFound />
  else if (work) page = <WorkPage subject={subject} work={work} />
  else page = <SubjectPage subject={subject} />

  return (
    <>
      <NavBar route={route} theme={theme} onToggleTheme={toggleTheme} />
      <Container as="main" className="py-4" data-accent={subject?.id}>
        <ErrorBoundary key={`${route.subjectId}/${route.workId}`}>{page}</ErrorBoundary>
      </Container>
      <footer className="text-center text-body-secondary small pb-4 px-3">
        {PROFILE.name} · {PROFILE.group}{subject ? ` · ${subject.short}` : ''}{work ? ` · ${work.short}` : ''}
      </footer>
    </>
  )
}
