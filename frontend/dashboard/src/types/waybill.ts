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
