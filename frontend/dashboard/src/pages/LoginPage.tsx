import { useState } from 'react'
import { authService } from '@/services/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    const trimmed = email.trim()
    const errs: { email?: string; password?: string } = {}
    if (!trimmed) errs.email = 'Email is required'
    if (!password) errs.password = 'Password is required'
    setErrors(errs)
    if (errs.email || errs.password) return

    try {
      const res = await authService.login(trimmed, password)
      localStorage.setItem('access_token', res.data.accessToken)
      window.location.href = '/dashboard'
    } catch {
      setServerError('Invalid email or password')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--color-surface)',
          padding: '2.5rem',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>Sign In</h1>
        {import.meta.env.DEV ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            Dev hint: Email: <strong>admin@waybilltrack.com</strong> / Password: <strong>admin</strong>
          </p>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            Enter your credentials to access the dashboard.
          </p>
        )}
        {serverError && (
          <p style={{ color: 'var(--badge-red-text)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {serverError}
          </p>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
            Email
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
            style={{
              width: '100%',
              padding: '0.625rem',
              border: `1px solid ${errors.email ? 'var(--color-danger)' : 'var(--color-border-input)'}`,
              borderRadius: 6,
              fontSize: '1rem',
            }}
          />
          {errors.email && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-danger)' }}>{errors.email}</p>}
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
            style={{
              width: '100%',
              padding: '0.625rem',
              border: `1px solid ${errors.password ? 'var(--color-danger)' : 'var(--color-border-input)'}`,
              borderRadius: 6,
              fontSize: '1rem',
            }}
          />
          {errors.password && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-danger)' }}>{errors.password}</p>}
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
