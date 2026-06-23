import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  success: () => {},
  error: () => {},
  info: () => {},
})

let nextId = 0

const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: '#065f46', border: '#059669', text: '#d1fae5' },
  error: { bg: '#7f1d1d', border: '#dc2626', text: '#fee2e2' },
  info: { bg: '#1e3a5f', border: '#2563eb', text: '#dbeafe' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const success = useCallback((message: string) => addToast('success', message), [addToast])
  const error = useCallback((message: string) => addToast('error', message), [addToast])
  const info = useCallback((message: string) => addToast('info', message), [addToast])

  return (
    <ToastContext.Provider value={{ toasts, success, error, info }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: COLORS[t.type].bg,
              border: `1px solid ${COLORS[t.type].border}`,
              color: COLORS[t.type].text,
              padding: '0.75rem 1rem',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              pointerEvents: 'auto',
              animation: 'slideIn 0.2s ease-out',
              maxWidth: 360,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
