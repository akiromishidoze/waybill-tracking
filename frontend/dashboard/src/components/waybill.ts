export type WaybillStatus =
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_SORTING_CENTER'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNED'
  | 'CANCELLED'

export type ExceptionCode =
  | 'DELAY'
  | 'DAMAGE'
  | 'WRONG_ADDRESS'
  | 'CUSTOMER_NOT_AVAILABLE'
  | 'ADDRESS_NOT_FOUND'
  | 'REFUSED'
  | 'LOST'
  | 'WEATHER_DELAY'
  | 'CUSTOMS_HOLD'
  | 'INSUFFICIENT_ADDRESS'
  | 'NO_RESPONSE'
  | 'WRONG_PACKAGE'
  | 'OTHER'

export const EXCEPTION_LABELS: Record<ExceptionCode, string> = {
  DELAY: 'Delivery Delayed',
  DAMAGE: 'Package Damaged',
  WRONG_ADDRESS: 'Wrong Address',
  CUSTOMER_NOT_AVAILABLE: 'Customer Not Available',
  ADDRESS_NOT_FOUND: 'Address Not Found',
  REFUSED: 'Refused by Recipient',
  LOST: 'Lost in Transit',
  WEATHER_DELAY: 'Weather Delay',
  CUSTOMS_HOLD: 'Customs Hold',
  INSUFFICIENT_ADDRESS: 'Insufficient Address',
  NO_RESPONSE: 'No Response',
  WRONG_PACKAGE: 'Wrong Package',
  OTHER: 'Other Exception',
}

export type EventType = 'MILESTONE' | 'SCAN' | 'EXCEPTION' | 'NOTE'

export const MILESTONE_LABELS: Record<WaybillStatus, string> = {
  CREATED: 'Shipment Created',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  AT_SORTING_CENTER: 'At Sorting Center',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  FAILED_DELIVERY: 'Delivery Failed',
  RETURNED: 'Returned to Sender',
  CANCELLED: 'Cancelled',
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  MILESTONE: '#2563eb',
  SCAN: '#6b7280',
  EXCEPTION: '#ef4444',
  NOTE: '#8b5cf6',
}

export interface ExceptionCodeInfo {
  code: ExceptionCode
  label: string
  description: string
}

export interface Waybill {
  id: string
  trackingNumber: string
  shipperId: string
  shipperName: string
  recipientName: string
  recipientAddress: string
  recipientPhone: string
  origin: string
  destination: string
  weight: number
  dimensions: string
  serviceType: string
  status: WaybillStatus
  estimatedDelivery: string
  actualDelivery?: string
  createdAt: string
  updatedAt: string
  events: ScanEvent[]
  carrierId?: string
  carrierName?: string
  carrierTrackingNumber?: string
  carrierEvents?: CarrierEvent[]
  slaBreached?: boolean
  attachments?: Attachment[]
  returnInfo?: ReturnInfo
  teamId?: string
  teamName?: string
}

export interface ScanEvent {
  id: string
  waybillId: string
  status: WaybillStatus
  location: string
  courierId?: string
  courierName?: string
  timestamp: string
  remark?: string
  exceptionCode?: ExceptionCode
  exceptionDetail?: string
  resolvedAt?: string
  eventType: EventType
}

export interface User {
  id: string
  email: string
  name: string
  role: 'SHIPPER' | 'COURIER' | 'OPS' | 'ADMIN'
  company?: string
}

export interface Carrier {
  id: string
  name: string
  apiEndpoint: string
  apiKey: string
  isActive: boolean
  trackingUrlTemplate: string
  createdAt: string
}

export interface CarrierEvent {
  id: string
  carrierId: string
  carrierName: string
  waybillId: string
  status: string
  location: string
  timestamp: string
  remark: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  resourceType: string
  resourceId: string
  details: string
  ipAddress: string
  createdAt: string
}

export interface DashboardStats {
  totalActive: number
  deliveredToday: number
  inTransit: number
  pendingPickup: number
  totalVolume: number
  slaCompliance: number
  exceptionRate: number
  avgTransitTime: number
}

export interface AppSettings {
  companyName: string
  timezone: string
  sessionTimeout: number
  emailNotifications: boolean
  defaultServiceType: string
  logoUrl: string
}

export interface Attachment {
  id: string
  waybillId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  data: string
}

export interface Team {
  id: string
  name: string
  description: string
  color: string
}

export interface ETAPrediction {
  waybillId: string
  trackingNumber: string
  predictedDelivery: string | null
  confidence: number
  estimatedHours: number | null
  basedOn: string
}

export type ReturnStatus = 'RETURN_REQUESTED' | 'RETURN_IN_TRANSIT' | 'RETURN_RECEIVED' | 'RETURN_COMPLETED'

export const RETURN_LABELS: Record<ReturnStatus, string> = {
  RETURN_REQUESTED: 'Return Requested',
  RETURN_IN_TRANSIT: 'Return In Transit',
  RETURN_RECEIVED: 'Return Received at Warehouse',
  RETURN_COMPLETED: 'Return Completed',
}

export const RETURN_COLORS: Record<ReturnStatus, string> = {
  RETURN_REQUESTED: '#d97706',
  RETURN_IN_TRANSIT: '#7c3aed',
  RETURN_RECEIVED: '#0891b2',
  RETURN_COMPLETED: '#16a34a',
}

export interface ReturnInfo {
  status: ReturnStatus
  reason: string
  requestedAt: string
  completedAt?: string
  trackingNumber?: string
  carrier?: string
  notes?: string
}

export interface EscalationRule {
  id: string
  name: string
  condition: 'SLA_BREACHED' | 'EXCEPTION_AGE' | 'STATUS_STUCK' | 'HIGH_VALUE'
  threshold: number
  targetRole: string
  isActive: boolean
  createdAt: string
}

export interface Escalation {
  id: string
  waybillId: string
  trackingNumber: string
  ruleId: string
  ruleName: string
  reason: string
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  escalatedTo: string
  createdAt: string
  acknowledgedAt?: string
  resolvedAt?: string
  acknowledgedBy?: string
  resolvedBy?: string
}

export interface DwellSegment {
  id: string
  waybillId: string
  trackingNumber: string
  facility: string
  arrivedAt: string
  departedAt?: string
  durationMinutes?: number
  isActive: boolean
}

export interface DwellAlert {
  id: string
  waybillId: string
  trackingNumber: string
  facility: string
  arrivedAt: string
  durationMinutes: number
  thresholdMinutes: number
  acknowledged: boolean
  acknowledgedAt?: string
  acknowledgedBy?: string
  createdAt: string
}
