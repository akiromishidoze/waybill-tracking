export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[SW] registered:', registration.scope)
        })
        .catch((error) => {
          console.error('[SW] registration failed:', error)
        })
    })
  }
}
