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
}

export interface User {
  id: string
  email: string
  name: string
  role: 'SHIPPER' | 'COURIER' | 'OPS' | 'ADMIN'
  company?: string
}

export interface DashboardStats {
  totalActive: number
  deliveredToday: number
  inTransit: number
  pendingPickup: number
  slaCompliance: number
  avgTransitTime: number
}

export interface AnalyticsPayload {
  period: 'daily' | 'weekly' | 'monthly'
  from: string
  to: string
}