import { Component, type ReactNode } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { clearAll } from '../lib/storage'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    // Після деплою старі чанки зникають — досить перезавантажити
    const outdated = /dynamically imported module|Loading chunk|Failed to fetch|Importing a module script failed/i.test(error.message)
    return (
      <Alert variant={outdated ? 'info' : 'danger'}>
        <Alert.Heading className="h5">{outdated ? 'Сайт оновився' : 'Щось пішло не так'}</Alert.Heading>
        <p className="mb-3">{outdated ? 'Оновіть сторінку, щоб завантажити нову версію.' : error.message}</p>
        <div className="d-flex flex-wrap gap-2">
          <Button variant={outdated ? 'primary' : 'outline-danger'} onClick={() => location.reload()}>
            Оновити сторінку
          </Button>
          {!outdated && (
            <Button
              variant="outline-secondary"
              onClick={() => {
                clearAll()
                location.reload()
              }}
            >
              Скинути збережені дані
            </Button>
          )}
        </div>
      </Alert>
    )
  }
}
