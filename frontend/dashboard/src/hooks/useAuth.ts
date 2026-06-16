import { useState, useEffect } from 'react'
import type { User } from '@/types/waybill'
import { authService } from '@/services/api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    authService
      .me()
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error('auth me failed', err)
        localStorage.removeItem('access_token')
      })
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
