import axios from 'axios'
import type { Waybill, ScanEvent, User, DashboardStats, ExceptionCodeInfo, AuditLog, Carrier, CarrierEvent, AppSettings, Team, Attachment, ETAPrediction, EscalationRule, Escalation, DwellSegment, DwellAlert, GeofenceEvent, ReportSchedule, RegionPerformance, ErpIntegration, DriverAssignment, DriverScanEvent, CodPayment, CostAnalytics, DemandForecast, CarbonFootprint, ECommerceDashboard, ECommercePlatform, ECommerceSyncLog, WhiteLabelPortalData, IotSensorDashboard, GPSLocation, WaybillGPSView } from '@/types/waybill'
import { isTokenExpired } from '@/utils/jwt'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('access_token')
  if (!token) return config

  if (isTokenExpired(token)) {
    const newToken = await attemptRefresh()
    if (newToken) {
      config.headers.Authorization = `Bearer ${newToken}`
      return config
    }
    localStorage.removeItem('access_token')
    window.location.href = '/login'
    return Promise.reject(new Error('token expired'))
  }

  config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/login' || originalRequest.url === '/auth/register') {
        return Promise.reject(err)
      }
      originalRequest._retry = true
      const newToken = await attemptRefresh()
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

async function attemptRefresh(): Promise<string | null> {
  const token = localStorage.getItem('access_token')
  if (!token) return null

  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingRequests.push((t: string) => resolve(t))
    })
  }

  isRefreshing = true
  try {
    const res = await axios.post<{ accessToken: string; user: User }>(
      `${api.defaults.baseURL}/auth/refresh`,
      { accessToken: token },
    )
    const newToken = res.data.accessToken
    localStorage.setItem('access_token', newToken)
    pendingRequests.forEach((cb) => cb(newToken))
    pendingRequests = []
    return newToken
  } catch {
    pendingRequests.forEach((cb) => cb(''))
    pendingRequests = []
    return null
  } finally {
    isRefreshing = false
  }
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
  refresh: (accessToken: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/refresh', { accessToken }),
}

export const waybillService = {
  list: (params?: Record<string, any>) => api.get<any>('/waybills', { params }).then(r => ({
    ...r,
    data: Array.isArray(r.data) ? r.data : (r.data?.data ?? []),
    meta: r.data?.meta ?? null,
  })),
  get: (id: string) => api.get<Waybill>(`/waybills/${id}`),
  track: (trackingNumber: string) => api.get<Waybill>(`/track/${trackingNumber}`),
  create: (data: Partial<Waybill>) => api.post<Waybill>('/waybills', data),
  updateStatus: (id: string, event: Partial<ScanEvent>) => api.patch<Waybill>(`/waybills/${id}/status`, event),
  update: (id: string, data: Partial<Waybill>) => api.patch<Waybill>(`/waybills/${id}`, data),
  batchStatusUpdate: (ids: string[], status: string, location?: string) =>
    api.post('/waybills/batch-status', { ids, status, location }),
  delete: (id: string) => api.delete(`/waybills/${id}`),
  importCSV: (formData: FormData) => api.post<{ created: number; failed: number; errors: string[] }>('/waybills/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const exceptionCodeService = {
  list: () => api.get<ExceptionCodeInfo[]>('/exception-codes'),
}

export const analyticsService = {
  stats: () => api.get<DashboardStats>('/analytics/stats'),
  slaReport: (from: string, to: string) =>
    api.get('/analytics/sla', { params: { from, to } }),
  exportExcel: (from: string, to: string) =>
    api.get('/analytics/export', { params: { from, to }, responseType: 'blob' }),
  carrierPerformance: () => api.get<any[]>('/analytics/carrier-performance'),
  getWaybillsMap: () => api.get<any[]>('/waybills/map-data'),
  predictEta: (waybillId: string) => api.get<ETAPrediction>(`/analytics/predict-eta/${waybillId}`),
}

export const userService = {
  list: () => api.get<User[]>('/users'),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User>) => api.patch<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
}

export const carrierService = {
  list: () => api.get<Carrier[]>('/carriers'),
  create: (data: Partial<Carrier>) => api.post<Carrier>('/carriers', data),
  update: (id: string, data: Partial<Carrier>) => api.patch<Carrier>(`/carriers/${id}`, data),
  delete: (id: string) => api.delete(`/carriers/${id}`),
  getEvents: (waybillId: string) => api.get<CarrierEvent[]>(`/carriers/events/${waybillId}`),
}

export const aggregatedTrackingService = {
  list: () => api.get<any[]>('/tracking/aggregated'),
  assign: (waybillId: string, data: any) =>
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
  upload: (waybillId: string, data: any) =>
    api.post<Attachment>(`/waybills/${waybillId}/attachments`, data),
  get: (attachmentId: string) => api.get<Attachment>(`/attachments/${attachmentId}`),
  delete: (attachmentId: string) => api.delete(`/attachments/${attachmentId}`),
}

export const returnService = {
  listReturns: () => api.get<any[]>('/returns'),
  initiateReturn: (waybillId: string, data: any) =>
    api.post(`/waybills/${waybillId}/initiate-return`, data),
  updateReturnStatus: (waybillId: string, data: any) =>
    api.patch(`/waybills/${waybillId}/return-status`, data),
}

export const escalationService = {
  list: () => api.get<Escalation[]>('/escalations'),
  acknowledge: (id: string) => api.post(`/escalations/${id}/acknowledge`),
  resolve: (id: string) => api.post(`/escalations/${id}/resolve`),
}

export const escalationRuleService = {
  list: () => api.get<EscalationRule[]>('/escalation-rules'),
  create: (data: Partial<EscalationRule>) =>
    api.post<EscalationRule>('/escalation-rules', data),
  update: (id: string, data: Partial<EscalationRule>) =>
    api.patch<EscalationRule>(`/escalation-rules/${id}`, data),
  delete: (id: string) => api.delete(`/escalation-rules/${id}`),
}

export const dwellTimeService = {
  listAlerts: () => api.get<DwellAlert[]>('/dwell-alerts'),
  getDwell: (waybillId: string) => api.get<DwellSegment[]>(`/waybills/${waybillId}/dwell`),
  acknowledge: (id: string) => api.post(`/dwell-alerts/${id}/acknowledge`),
  getThreshold: () => api.get<{ thresholdMinutes: number }>('/settings/dwell-threshold'),
  setThreshold: (thresholdMinutes: number) =>
    api.put('/settings/dwell-threshold', { thresholdMinutes }),
}

export const geofenceService = {
  list: () => api.get<GeofenceEvent[]>('/geofence-events'),
  getForWaybill: (waybillId: string) =>
    api.get<GeofenceEvent[]>(`/waybills/${waybillId}/geofence`),
}

export const reportScheduleService = {
  list: () => api.get<ReportSchedule[]>('/reports/schedules'),
  create: (data: Partial<ReportSchedule>) =>
    api.post<ReportSchedule>('/reports/schedules', data),
  update: (id: string, data: Partial<ReportSchedule>) =>
    api.patch<ReportSchedule>(`/reports/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/reports/schedules/${id}`),
  trigger: (id: string) => api.post(`/reports/schedules/${id}/trigger`),
}

export const driverService = {
  listAssignments: () => api.get<DriverAssignment[]>('/driver-assignments'),
  getAssignment: (id: string) =>
    api.get<DriverAssignment>(`/driver-assignments/${id}`),
  updateStatus: (id: string, data: any) =>
    api.post<DriverAssignment>(`/driver-assignments/${id}/status`, data),
  listScans: () => api.get<DriverScanEvent[]>('/driver-scans'),
}

export const regionService = {
  performance: () => api.get<RegionPerformance[]>('/analytics/region-performance'),
}

export const costAnalyticsService = {
  get: () => api.get<CostAnalytics>('/analytics/cost-per-shipment'),
}

export const demandForecastService = {
  get: () => api.get<DemandForecast>('/analytics/demand-forecast'),
}

export const carbonFootprintService = {
  get: () => api.get<CarbonFootprint>('/analytics/carbon-footprint'),
}

export const eCommerceService = {
  getDashboard: () => api.get<ECommerceDashboard>('/integrations/ecommerce'),
  listPlatforms: () => api.get<ECommercePlatform[]>('/integrations/ecommerce/platforms'),
  createPlatform: (data: Partial<ECommercePlatform>) => api.post<ECommercePlatform>('/integrations/ecommerce/platforms', data),
  updatePlatform: (id: string, data: Partial<ECommercePlatform>) => api.patch<ECommercePlatform>(`/integrations/ecommerce/platforms/${id}`, data),
  deletePlatform: (id: string) => api.delete(`/integrations/ecommerce/platforms/${id}`),
  listSyncLogs: () => api.get<ECommerceSyncLog[]>('/integrations/ecommerce/sync-logs'),
}

export const whiteLabelService = {
  getPortal: () => api.get<WhiteLabelPortalData>('/integrations/white-label'),
  updateConfig: (data: Partial<WhiteLabelPortalData['config']>) => api.patch<WhiteLabelPortalData['config']>('/integrations/white-label', data),
}

export const iotSensorService = {
  getDashboard: () => api.get<IotSensorDashboard>('/integrations/iot-sensors'),
}

export const gpsService = {
  createLocation: (data: Partial<GPSLocation>) => api.post<GPSLocation>('/gps/location', data),
  listCurrent: () => api.get<WaybillGPSView[]>('/gps/waybills'),
  getHistory: (id: string) => api.get<GPSLocation[]>(`/gps/waybills/${id}/history`),
  getLatest: (id: string) => api.get<GPSLocation>(`/gps/waybills/${id}/latest`),
}

export const codService = {
  list: () => api.get<CodPayment[]>('/cod-payments'),
  settle: (id: string) => api.post<CodPayment>(`/cod-payments/${id}/settle`),
  dispute: (id: string, reason: string) =>
    api.post<CodPayment>(`/cod-payments/${id}/dispute`, { reason }),
  refund: (id: string) => api.post<CodPayment>(`/cod-payments/${id}/refund`),
}

export const erpIntegrationService = {
  list: () => api.get<ErpIntegration[]>('/erp-integrations'),
  create: (data: Partial<ErpIntegration>) =>
    api.post<ErpIntegration>('/erp-integrations', data),
  update: (id: string, data: Partial<ErpIntegration>) =>
    api.patch<ErpIntegration>(`/erp-integrations/${id}`, data),
  delete: (id: string) => api.delete(`/erp-integrations/${id}`),
  test: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/erp-integrations/${id}/test`),
  sync: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/erp-integrations/${id}/sync`),
}

export default api

if (import.meta.env.DEV) {
  import('./mock-api').then(m => m.installMockInterceptor(api))
}
