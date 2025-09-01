import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Что-то пошло не так 😔</h2>
          <p>Произошла ошибка в приложении. Попробуйте перезагрузить страницу.</p>
          <button 
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Перезагрузить
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="error-details">
              <summary>Детали ошибки (только для разработки)</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
