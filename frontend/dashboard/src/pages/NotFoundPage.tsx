import { useNavigate } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        padding: '2rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 420,
          background: 'var(--color-surface)',
          borderRadius: 12,
          padding: '2.5rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--badge-red-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <AlertCircle size={32} color="var(--badge-red-text)" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          404 — Page Not Found
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9375rem',
          }}
        >
          <Home size={18} /> Go to Dashboard
        </button>
      </div>
    </div>
  )
}
