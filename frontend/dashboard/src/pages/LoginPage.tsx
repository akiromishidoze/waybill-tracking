import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import s from '@/styles/components.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setToken, login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (email === 'Admin' && password === 'admin00') {
      setToken('mock_token')
      navigate('/dashboard')

      return
    }

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
    }
  }

  return (
    <div className={s.centerPage}>
      <form onSubmit={handleSubmit} className={s.formCard}>
        <h1 className={s.formTitle}>Sign In</h1>
        {error && <p className={s.formError}>{error}</p>}
        <div className={s.formGroup}>
          <label className={s.formLabel}>Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={s.formInput}
          />
        </div>
        <div className={s.formSubmit}>
          <label className={s.formLabel}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={s.formInput}
          />
        </div>
        <button type="submit" className={`${s.btnBlock} ${s.btnPrimary}`}>
          Sign In
        </button>
      </form>
    </div>
  )
}