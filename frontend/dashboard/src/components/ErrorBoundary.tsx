import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '@/utils/errorReporter'
import s from '@/styles/components.module.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className={s.errorContainer}>
          <h1 className={s.errorTitle}>Something went wrong</h1>

          <p className={s.errorMsg}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>

          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = '/'
            }}

            className={s.errorBtn}
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}