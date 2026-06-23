import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { isTokenExpired, decodeToken } from '@/utils/jwt'
import type { User } from '@/types/waybill'

interface ProtectedRouteProps {
  allowedRoles?: User['role'][]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (!token || isTokenExpired(token)) {
    if (token) localStorage.removeItem('access_token')
    return <Navigate to="/login" replace />
  }

  const role = user?.role || (token ? decodeToken(token)?.role : null)

  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role as User['role'])) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <Outlet />
}