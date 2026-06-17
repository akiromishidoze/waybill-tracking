import axios from 'axios'
import type { Waybill, ScanEvent, User, DashboardStats, ExceptionCodeInfo, AuditLog, Carrier, CarrierEvent } from '@/types/waybill'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export const waybillService = {
  list: (params?: Record<string, string>) =>
    api.get<Waybill[]>('/waybills', { params }),
  get: (id: string) => api.get<Waybill>(`/waybills/${id}`),
  track: (trackingNumber: string) =>
    api.get<Waybill>(`/track/${trackingNumber}`),
  create: (data: Partial<Waybill>) => api.post<Waybill>('/waybills', data),
  updateStatus: (id: string, event: Partial<ScanEvent>) =>
    api.patch<Waybill>(`/waybills/${id}/status`, event),
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', {
      email,
      password,
    }),
  me: () => api.get<User>('/auth/me'),
}

export const exceptionCodeService = {
  list: () => api.get<ExceptionCodeInfo[]>('/exception-codes'),
}

export const analyticsService = {
  stats: () => api.get<DashboardStats>('/analytics/stats'),
  slaReport: (from: string, to: string) =>
    api.get('/analytics/sla', { params: { from, to } }),
  exportExcel: (from: string, to: string) =>
    api.get('/analytics/export', {
      params: { from, to },
      responseType: 'blob',
    }),
}

export const userService = {
  list: () => api.get<User[]>('/users'),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
}

export const auditLogService = {
  list: () => api.get<AuditLog[]>('/audit-logs'),
}

export const aggregatedTrackingService = {
  list: () => api.get<any[]>('/tracking/aggregated'),
}

export const carrierService = {
  list: () => api.get<Carrier[]>('/carriers'),
  getEvents: (waybillId: string) =>
    api.get<CarrierEvent[]>(`/carriers/events/${waybillId}`),
}

export default api
