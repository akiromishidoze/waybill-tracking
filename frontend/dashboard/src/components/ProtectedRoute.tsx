import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { isTokenExpired } from '@/utils/jwt'

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)

  if (!token || isTokenExpired(token)) {
    if (token) localStorage.removeItem('access_token')
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}