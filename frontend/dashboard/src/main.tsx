import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initErrorReporter } from '@/utils/errorReporter'
import { registerServiceWorker } from '@/utils/registerServiceWorker'
import { installMockInterceptor } from '@/services/mock-api'
import api from '@/services/api'
import App from './App'
import './index.css'

initErrorReporter()
registerServiceWorker()

if (import.meta.env.DEV) {
  installMockInterceptor(api)
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)