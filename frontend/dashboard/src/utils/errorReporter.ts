import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
let initialized = false

export function initErrorReporter() {
  if (initialized || !DSN) return
  initialized = true
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  })
}

export function reportError(error: Error, context?: Record<string, unknown>) {
  if (DSN && initialized) {
    Sentry.captureException(error, { extra: context })
  }
  console.error('[ErrorReporter]', error, context ?? '')
}

export function setErrorUser(email: string, id?: string) {
  if (DSN && initialized) {
    Sentry.setUser({ email, id })
  }
}

export function clearErrorUser() {
  if (DSN && initialized) {
    Sentry.setUser(null)
  }
}
