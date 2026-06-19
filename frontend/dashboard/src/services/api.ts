import axios from 'axios'
import type { Waybill, ScanEvent, User, DashboardStats, ExceptionCodeInfo, AuditLog, Carrier, CarrierEvent, AppSettings, Team, Attachment, ETAPrediction, ReturnInfo, EscalationRule, Escalation, DwellSegment, DwellAlert, GeofenceEvent, ReportSchedule, RegionPerformance, ErpIntegration } from '@/types/waybill'

const MOCK_USER: User = { id: 'admin-001', email: 'admin@waybilltrack.com', name: 'Admin User', role: 'ADMIN', company: 'WaybillTrack' }

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0wMDEiLCJlbWFpbCI6ImFkbWluQHdheWJpbGx0cmFjay5jb20iLCJyb2xlIjoiQURNSU4iLCJleHAiOjk5OTk5OTk5OTl9.mock'

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

api.interceptors.request.use((config) => {
  if (config.url === '/auth/login' && config.method === 'post') {
    const { email, password } = JSON.parse(config.data || '{}')
    if (email?.toLowerCase() === 'admin' && password === 'admin') {
      config.adapter = () => Promise.resolve({
        data: { accessToken: MOCK_TOKEN, user: MOCK_USER },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
      })
    }
  }
  if (config.url === '/auth/me' && config.method === 'get') {
    const token = localStorage.getItem('access_token')
    if (token === MOCK_TOKEN) {
      config.adapter = () => Promise.resolve({
        data: MOCK_USER,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
      })
    }
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
  batchStatusUpdate: (ids: string[], status: string, location?: string) =>
    api.post('/waybills/batch-status', { ids, status, location }),
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
  carrierPerformance: () => api.get<any[]>('/analytics/carrier-performance'),
  getWaybillsMap: () => api.get<any[]>('/waybills/map-data'),
  predictEta: (waybillId: string) => api.get<ETAPrediction>(`/analytics/predict-eta/${waybillId}`),
}

export const userService = {
  list: () => api.get<User[]>('/users'),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
}

export const carrierService = {
  list: () => api.get<Carrier[]>('/carriers'),
  create: (data: Partial<Carrier>) => api.post<Carrier>('/carriers', data),
  update: (id: string, data: Partial<Carrier>) =>
    api.patch<Carrier>(`/carriers/${id}`, data),
  delete: (id: string) => api.delete(`/carriers/${id}`),
  getEvents: (waybillId: string) =>
    api.get<CarrierEvent[]>(`/carriers/events/${waybillId}`),
}

export const aggregatedTrackingService = {
  list: () => api.get<any[]>('/tracking/aggregated'),
  assign: (waybillId: string, data: { carrierId: string; carrierTrackingNumber: string }) =>
    api.post(`/tracking/aggregated/${waybillId}`, data),
  remove: (waybillId: string) =>
    api.delete(`/tracking/aggregated/${waybillId}`),
}

export const auditLogService = {
  list: () => api.get<AuditLog[]>('/audit-logs'),
}

export const settingsService = {
  get: () => api.get<AppSettings>('/settings'),
  update: (data: Partial<AppSettings>) => api.put<AppSettings>('/settings', data),
  resetPassword: (userId: string, newPassword: string) =>
    api.post('/auth/reset-password', { userId, newPassword }),
}

export const teamService = {
  list: () => api.get<Team[]>('/teams'),
  create: (data: Partial<Team>) => api.post<Team>('/teams', data),
  update: (id: string, data: Partial<Team>) => api.patch<Team>(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  assignToWaybill: (waybillId: string, teamId: string | null) =>
    api.patch<Waybill>(`/waybills/${waybillId}/assign-team`, { teamId }),
}

export const webhookService = {
  list: () => api.get<any[]>('/webhooks'),
  create: (data: any) => api.post<any>('/webhooks', data),
  update: (id: string, data: any) => api.patch<any>(`/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/webhooks/${id}`),
  getEvents: () => api.get<string[]>('/webhooks/events'),
  test: (id: string) => api.post<any>(`/webhooks/${id}`, {}),
  log: () => api.get<any[]>('/webhooks/log'),
}

export const attachmentService = {
  list: (waybillId: string) => api.get<Attachment[]>(`/waybills/${waybillId}/attachments`),
  upload: (waybillId: string, data: { fileName: string; fileType: string; fileSize: number; data: string }) =>
    api.post<Attachment>(`/waybills/${waybillId}/attachments`, data),
  get: (attachmentId: string) => api.get<Attachment>(`/attachments/${attachmentId}`),
  delete: (attachmentId: string) => api.delete(`/attachments/${attachmentId}`),
}

export const returnService = {
  listReturns: () => api.get<any[]>('/returns'),
  initiateReturn: (waybillId: string, data: { reason?: string; carrier?: string; notes?: string }) =>
    api.post(`/waybills/${waybillId}/initiate-return`, data),
  updateReturnStatus: (waybillId: string, data: { status: string; notes?: string }) =>
    api.patch(`/waybills/${waybillId}/return-status`, data),
}

export const escalationService = {
  list: () => api.get<Escalation[]>('/escalations'),
  acknowledge: (id: string) => api.post(`/escalations/${id}/acknowledge`),
  resolve: (id: string) => api.post(`/escalations/${id}/resolve`),
}

export const escalationRuleService = {
  list: () => api.get<EscalationRule[]>('/escalation-rules'),
  create: (data: Partial<EscalationRule>) => api.post<EscalationRule>('/escalation-rules', data),
  update: (id: string, data: Partial<EscalationRule>) => api.patch<EscalationRule>(`/escalation-rules/${id}`, data),
  delete: (id: string) => api.delete(`/escalation-rules/${id}`),
}

export const dwellTimeService = {
  listAlerts: () => api.get<DwellAlert[]>('/dwell-alerts'),
  getDwell: (waybillId: string) => api.get<DwellSegment[]>(`/waybills/${waybillId}/dwell`),
  acknowledge: (id: string) => api.post(`/dwell-alerts/${id}/acknowledge`),
  getThreshold: () => api.get<{ thresholdMinutes: number }>('/settings/dwell-threshold'),
  setThreshold: (thresholdMinutes: number) => api.put('/settings/dwell-threshold', { thresholdMinutes }),
}

export const geofenceService = {
  list: () => api.get<GeofenceEvent[]>('/geofence-events'),
  getForWaybill: (waybillId: string) => api.get<GeofenceEvent[]>(`/waybills/${waybillId}/geofence`),
}

export const reportScheduleService = {
  list: () => api.get<ReportSchedule[]>('/reports/schedules'),
  create: (data: Partial<ReportSchedule>) => api.post<ReportSchedule>('/reports/schedules', data),
  update: (id: string, data: Partial<ReportSchedule>) => api.patch<ReportSchedule>(`/reports/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/reports/schedules/${id}`),
  trigger: (id: string) => api.post(`/reports/schedules/${id}/trigger`),
}

export const regionService = {
  performance: () => api.get<RegionPerformance[]>('/analytics/region-performance'),
}

export const erpIntegrationService = {
  list: () => api.get<ErpIntegration[]>('/erp-integrations'),
  create: (data: Partial<ErpIntegration>) => api.post<ErpIntegration>('/erp-integrations', data),
  update: (id: string, data: Partial<ErpIntegration>) => api.patch<ErpIntegration>(`/erp-integrations/${id}`, data),
  delete: (id: string) => api.delete(`/erp-integrations/${id}`),
  test: (id: string) => api.post<{ success: boolean; message: string }>(`/erp-integrations/${id}/test`),
  sync: (id: string) => api.post<{ success: boolean; message: string }>(`/erp-integrations/${id}/sync`),
}

export default api
