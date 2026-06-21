import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await authService.login(email, password)
      localStorage.setItem('access_token', res.data.accessToken)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
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
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
          Email: <strong>Admin</strong> / Password: <strong>admin</strong>
        </p>
        {error && (
          <p style={{ color: 'var(--badge-red-text)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </p>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
            Email
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.625rem',
              border: '1px solid var(--color-border-input)',
              borderRadius: 6,
              fontSize: '1rem',
            }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.625rem',
              border: '1px solid var(--color-border-input)',
              borderRadius: 6,
              fontSize: '1rem',
            }}
          />
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
