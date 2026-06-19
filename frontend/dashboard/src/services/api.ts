import axios from 'axios'
import type { Waybill, ScanEvent, User, DashboardStats, ExceptionCodeInfo, AuditLog, Carrier, CarrierEvent, AppSettings, Team, Attachment, ETAPrediction, EscalationRule, Escalation, DwellSegment, DwellAlert, GeofenceEvent, ReportSchedule, RegionPerformance, ErpIntegration, DriverAssignment, DriverScanEvent } from '@/types/waybill'

const MOCK_USER: User = { id: 'admin-001', email: 'admin@waybilltrack.com', name: 'Admin User', role: 'ADMIN', company: 'WaybillTrack' }
const MOCK_TOKEN = 'mock-jwt-token-admin'

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

function uid() { return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 14) }
function ago(h: number) { return new Date(Date.now() - h * 3600000).toISOString() }
function later(h: number) { return new Date(Date.now() + h * 3600000).toISOString() }

const seedExceptionCodes: ExceptionCodeInfo[] = [
  { code: 'DELAY', label: 'Delivery Delayed', description: 'Shipment is behind schedule' },
  { code: 'DAMAGE', label: 'Package Damaged', description: 'Package has visible damage' },
  { code: 'WRONG_ADDRESS', label: 'Wrong Address', description: 'Address is incorrect or incomplete' },
  { code: 'CUSTOMER_NOT_AVAILABLE', label: 'Customer Not Available', description: 'Recipient not present at delivery' },
  { code: 'LOST', label: 'Lost in Transit', description: 'Shipment location unknown' },
  { code: 'WEATHER_DELAY', label: 'Weather Delay', description: 'Weather conditions causing delay' },
  { code: 'CUSTOMS_HOLD', label: 'Customs Hold', description: 'Customs clearance pending' },
]

const seedUsers: User[] = [
  { id: 'usr-001', email: 'admin@waybilltrack.com', name: 'Admin User', role: 'ADMIN', company: 'WaybillTrack' },
  { id: 'usr-002', email: 'maria.santos@waybilltrack.com', name: 'Maria Santos', role: 'OPS', company: 'WaybillTrack' },
  { id: 'usr-003', email: 'juan.delacruz@waybilltrack.com', name: 'Juan Dela Cruz', role: 'COURIER' },
  { id: 'usr-004', email: 'shipping@acmecorp.ph', name: 'Acme Corporation', role: 'SHIPPER', company: 'Acme Corporation' },
  { id: 'usr-005', email: 'carlos.reyes@waybilltrack.com', name: 'Carlos Reyes', role: 'OPS', company: 'WaybillTrack' },
  { id: 'usr-006', email: 'ana.mendoza@bestsupplies.ph', name: 'Ana Mendoza', role: 'SHIPPER', company: 'Best Supplies Inc.' },
  { id: 'usr-007', email: 'pedro.lim@express.ph', name: 'Pedro Lim', role: 'COURIER' },
]

const seedTeams: Team[] = [
  { id: 'team-001', name: 'Metro Manila', description: 'NCR delivery team', color: '#2563eb' },
  { id: 'team-002', name: 'Cebu Hub', description: 'Visayas sorting hub', color: '#7c3aed' },
  { id: 'team-003', name: 'Davao Ops', description: 'Mindanao operations', color: '#16a34a' },
  { id: 'team-004', name: 'Luzon North', description: 'Northern Luzon routes', color: '#d97706' },
  { id: 'team-005', name: 'Palawan Special', description: 'Remote island deliveries', color: '#0891b2' },
]

const seedCarriers: Carrier[] = [
  { id: 'car-001', name: 'LBC Express', apiEndpoint: 'https://api.lbcexpress.com', apiKey: 'lbc-key-001', isActive: true, trackingUrlTemplate: 'https://track.lbcexpress.com/{tracking}', createdAt: ago(720) },
  { id: 'car-002', name: 'DHL Philippines', apiEndpoint: 'https://api.dhl.ph', apiKey: 'dhl-key-002', isActive: true, trackingUrlTemplate: 'https://www.dhl.com/ph-en/{tracking}', createdAt: ago(720) },
  { id: 'car-003', name: 'FedEx Philippines', apiEndpoint: 'https://api.fedex.com/ph', apiKey: 'fedex-key-003', isActive: false, trackingUrlTemplate: 'https://www.fedex.com/app/{tracking}', createdAt: ago(720) },
  { id: 'car-004', name: 'GoGo Xpress', apiEndpoint: 'https://api.gogoxpress.com', apiKey: 'gogo-key-004', isActive: true, trackingUrlTemplate: 'https://track.gogoxpress.com/{tracking}', createdAt: ago(720) },
  { id: 'car-005', name: 'J&T Express', apiEndpoint: 'https://api.jtexpress.ph', apiKey: 'jt-key-005', isActive: true, trackingUrlTemplate: 'https://www.jtexpress.ph/track/{tracking}', createdAt: ago(720) },
]

const seedCarrierPerformance: any[] = [
  { carrierId: 'car-001', carrierName: 'LBC Express', totalShipments: 1520, onTimeRate: 88.2, exceptionRate: 4.8, deliveredCount: 1340, slaBreaches: 180, avgTransitHours: 22.4, isActive: true },
  { carrierId: 'car-002', carrierName: 'DHL Philippines', totalShipments: 880, onTimeRate: 94.9, exceptionRate: 2.1, deliveredCount: 835, slaBreaches: 45, avgTransitHours: 16.8, isActive: true },
  { carrierId: 'car-004', carrierName: 'GoGo Xpress', totalShipments: 650, onTimeRate: 80.0, exceptionRate: 6.5, deliveredCount: 520, slaBreaches: 130, avgTransitHours: 28.5, isActive: true },
  { carrierId: 'car-005', carrierName: 'J&T Express', totalShipments: 2100, onTimeRate: 85.0, exceptionRate: 5.1, deliveredCount: 1785, slaBreaches: 315, avgTransitHours: 24.1, isActive: true },
]

function makeEvents(wbId: string, baseTime: number, origin: string, destination: string, courier = 'Juan Dela Cruz'): ScanEvent[] {
  return [
    { id: uid(), waybillId: wbId, status: 'CREATED', location: 'Online Portal', timestamp: ago(baseTime + 4), eventType: 'MILESTONE' },
    { id: uid(), waybillId: wbId, status: 'PICKED_UP', location: `${origin} Warehouse`, courierName: courier, timestamp: ago(baseTime + 3), eventType: 'MILESTONE' },
    { id: uid(), waybillId: wbId, status: 'AT_SORTING_CENTER', location: `${origin} Sorting Hub`, timestamp: ago(baseTime + 2), eventType: 'MILESTONE' },
    { id: uid(), waybillId: wbId, status: 'IN_TRANSIT', location: `En Route to ${destination}`, timestamp: ago(baseTime + 1), eventType: 'SCAN' },
    { id: uid(), waybillId: wbId, status: 'AT_SORTING_CENTER', location: `${destination} Sorting Facility`, timestamp: ago(baseTime - 1), eventType: 'MILESTONE' },
    { id: uid(), waybillId: wbId, status: 'OUT_FOR_DELIVERY', location: `${destination} Delivery Hub`, timestamp: ago(baseTime - 3), eventType: 'MILESTONE' },
  ]
}

const seedWaybills: Waybill[] = [
  {
    id: 'wb-001', trackingNumber: 'LBC-2024-1001', shipperId: 'usr-004', shipperName: 'Acme Corporation',
    recipientName: 'Ricardo Dimagiba', recipientAddress: '45 P. Gomez St, Brgy. San Lorenzo, Makati City',
    recipientPhone: '+63 917 555 1212', origin: 'Manila', destination: 'Makati City',
    weight: 2.5, dimensions: '30x20x15', serviceType: 'EXPRESS',
    status: 'DELIVERED', estimatedDelivery: ago(6), actualDelivery: ago(8),
    createdAt: ago(96), updatedAt: ago(8),
    events: [...makeEvents('wb-001', 14, 'Manila', 'Makati City'), { id: uid(), waybillId: 'wb-001', status: 'DELIVERED', location: '45 P. Gomez St, Makati City', courierName: 'Juan Dela Cruz', timestamp: ago(8), eventType: 'MILESTONE' }],
    slaBreached: false, teamId: 'team-001', teamName: 'Metro Manila',
  },
  {
    id: 'wb-002', trackingNumber: 'LBC-2024-1002', shipperId: 'usr-006', shipperName: 'Best Supplies Inc.',
    recipientName: 'Jocelyn Mercado', recipientAddress: '88 Magallanes St, Cebu City',
    recipientPhone: '+63 922 888 7711', origin: 'Manila', destination: 'Cebu City',
    weight: 5.0, dimensions: '40x30x20', serviceType: 'STANDARD',
    status: 'OUT_FOR_DELIVERY', estimatedDelivery: ago(2),
    createdAt: ago(72), updatedAt: ago(6),
    events: makeEvents('wb-002', 16, 'Manila', 'Cebu City'),
    slaBreached: true, teamId: 'team-002', teamName: 'Cebu Hub', carrierId: 'car-001', carrierName: 'LBC Express',
  },
  {
    id: 'wb-003', trackingNumber: 'JT-2024-3001', shipperId: 'usr-004', shipperName: 'Acme Corporation',
    recipientName: 'Ferdinand Salvador', recipientAddress: '12 Rizal Extension, Brgy. 5-A, Davao City',
    recipientPhone: '+63 908 777 3344', origin: 'Cebu', destination: 'Davao City',
    weight: 1.2, dimensions: '20x15x10', serviceType: 'EXPRESS',
    status: 'AT_SORTING_CENTER', estimatedDelivery: later(18),
    createdAt: ago(36), updatedAt: ago(14),
    events: makeEvents('wb-003', 18, 'Cebu', 'Davao City'),
    slaBreached: false, teamId: 'team-003', teamName: 'Davao Ops',
  },
  {
    id: 'wb-004', trackingNumber: 'DHL-PH-99123', shipperId: 'usr-001', shipperName: 'Admin User',
    recipientName: 'Catalina Villanueva', recipientAddress: '77 Session Rd, Brgy. Upper Market, Baguio City',
    recipientPhone: '+63 939 666 2211', origin: 'Manila', destination: 'Baguio City',
    weight: 3.8, dimensions: '35x25x18', serviceType: 'STANDARD',
    status: 'IN_TRANSIT', estimatedDelivery: later(28),
    createdAt: ago(24), updatedAt: ago(10),
    events: makeEvents('wb-004', 20, 'Manila', 'Baguio City'),
    slaBreached: false, teamId: 'team-004', teamName: 'Luzon North',
    carrierId: 'car-002', carrierName: 'DHL Philippines', carrierTrackingNumber: 'DHL-800-7722-4100',
    carrierEvents: [
      { id: uid(), carrierId: 'car-002', carrierName: 'DHL Philippines', waybillId: 'wb-004', status: 'Picked Up', location: 'Manila', timestamp: ago(16), remark: 'Package scanned at pickup' },
      { id: uid(), carrierId: 'car-002', carrierName: 'DHL Philippines', waybillId: 'wb-004', status: 'In Transit', location: 'DHL Gateway Manila', timestamp: ago(12), remark: 'Departed Manila hub' },
      { id: uid(), carrierId: 'car-002', carrierName: 'DHL Philippines', waybillId: 'wb-004', status: 'Customs Clearance', location: 'Clark Freeport', timestamp: ago(10), remark: 'Customs cleared' },
    ],
  },
  {
    id: 'wb-005', trackingNumber: 'GOGO-2024-5001', shipperId: 'usr-006', shipperName: 'Best Supplies Inc.',
    recipientName: 'Roberto Gonzales', recipientAddress: '200 Subic Bay Gateway Park, Zambales',
    recipientPhone: '+63 927 444 5566', origin: 'Cebu', destination: 'Subic Bay',
    weight: 10.0, dimensions: '60x40x30', serviceType: 'EXPRESS',
    status: 'PICKED_UP', estimatedDelivery: later(42),
    createdAt: ago(12), updatedAt: ago(6),
    events: [
      { id: uid(), waybillId: 'wb-005', status: 'CREATED', location: 'Online Portal', timestamp: ago(14), eventType: 'MILESTONE' },
      { id: uid(), waybillId: 'wb-005', status: 'PICKED_UP', location: 'Cebu Warehouse', courierName: 'Pedro Lim', timestamp: ago(6), eventType: 'MILESTONE' },
    ],
    slaBreached: false,
  },
  {
    id: 'wb-006', trackingNumber: 'LBC-2024-1006', shipperId: 'usr-004', shipperName: 'Acme Corporation',
    recipientName: 'Leticia Chua', recipientAddress: '303 Ortigas Ave, Brgy. San Antonio, Pasig City',
    recipientPhone: '+63 915 333 7788', origin: 'Manila', destination: 'Pasig City',
    weight: 0.8, dimensions: '15x10x8', serviceType: 'STANDARD',
    status: 'FAILED_DELIVERY', estimatedDelivery: ago(2),
    createdAt: ago(48), updatedAt: ago(2),
    events: [...makeEvents('wb-006', 10, 'Manila', 'Pasig City'),
      { id: uid(), waybillId: 'wb-006', status: 'OUT_FOR_DELIVERY', location: 'Pasig Hub', timestamp: ago(6), eventType: 'MILESTONE' },
      { id: uid(), waybillId: 'wb-006', status: 'FAILED_DELIVERY', location: '303 Ortigas Ave, Pasig City', timestamp: ago(2), eventType: 'MILESTONE', exceptionCode: 'CUSTOMER_NOT_AVAILABLE', exceptionDetail: 'Recipient not home after 3 attempts. Left notice card.' },
    ],
    slaBreached: true, teamId: 'team-001', teamName: 'Metro Manila',
    returnInfo: { status: 'RETURN_REQUESTED', reason: 'Delivery failed after 3 attempts', requestedAt: ago(1), notes: 'Recipient called to request re-delivery to office address' },
  },
  {
    id: 'wb-007', trackingNumber: 'JT-2024-3007', shipperId: 'usr-004', shipperName: 'Acme Corporation',
    recipientName: 'Karen Limjoco', recipientAddress: '404 Ayala Ave cor Paseo de Roxas, Makati City',
    recipientPhone: '+63 905 222 9900', origin: 'Davao', destination: 'Makati City',
    weight: 4.5, dimensions: '40x30x20', serviceType: 'EXPRESS',
    status: 'CREATED', estimatedDelivery: later(56),
    createdAt: ago(4), updatedAt: ago(4),
    events: [{ id: uid(), waybillId: 'wb-007', status: 'CREATED', location: 'Online Portal', timestamp: ago(4), eventType: 'MILESTONE' }],
    slaBreached: false,
  },
  {
    id: 'wb-008', trackingNumber: 'LBC-2024-1008', shipperId: 'usr-004', shipperName: 'Acme Corporation',
    recipientName: 'Dr. Manuel Reyes', recipientAddress: '55 National Highway, Brgy. Bancao-Bancao, Puerto Princesa',
    recipientPhone: '+63 909 888 6644', origin: 'Manila', destination: 'Puerto Princesa',
    weight: 6.2, dimensions: '50x35x25', serviceType: 'STANDARD',
    status: 'AT_SORTING_CENTER', estimatedDelivery: later(48),
    createdAt: ago(16), updatedAt: ago(8),
    events: makeEvents('wb-008', 10, 'Manila', 'Puerto Princesa'),
    slaBreached: false, teamId: 'team-005', teamName: 'Palawan Special',
  },
  {
    id: 'wb-009', trackingNumber: 'GOGO-2024-5009', shipperId: 'usr-006', shipperName: 'Best Supplies Inc.',
    recipientName: 'Sofia Alcantara', recipientAddress: '22 Bonifacio St, Brgy. 8, Legazpi City',
    recipientPhone: '+63 918 111 2233', origin: 'Manila', destination: 'Legazpi City',
    weight: 3.0, dimensions: '30x25x15', serviceType: 'EXPRESS',
    status: 'DELIVERED', estimatedDelivery: ago(12), actualDelivery: ago(14),
    createdAt: ago(84), updatedAt: ago(14),
    events: [...makeEvents('wb-009', 18, 'Manila', 'Legazpi City'), { id: uid(), waybillId: 'wb-009', status: 'DELIVERED', location: '22 Bonifacio St, Legazpi City', courierName: 'Pedro Lim', timestamp: ago(14), eventType: 'MILESTONE' }],
    slaBreached: false, teamId: 'team-004', teamName: 'Luzon North',
  },
  {
    id: 'wb-010', trackingNumber: 'DHL-PH-45127', shipperId: 'usr-001', shipperName: 'Admin User',
    recipientName: 'Miguel Tan', recipientAddress: '5th Floor, XYZ Building, 25th St, BGC, Taguig',
    recipientPhone: '+63 921 777 8899', origin: 'Cebu', destination: 'Taguig',
    weight: 1.8, dimensions: '25x18x12', serviceType: 'EXPRESS',
    status: 'OUT_FOR_DELIVERY', estimatedDelivery: later(4),
    createdAt: ago(30), updatedAt: ago(2),
    events: makeEvents('wb-010', 12, 'Cebu', 'Taguig'),
    slaBreached: false, teamId: 'team-001', teamName: 'Metro Manila',
    carrierId: 'car-002', carrierName: 'DHL Philippines', carrierTrackingNumber: 'DHL-800-4512-7001',
    carrierEvents: [
      { id: uid(), carrierId: 'car-002', carrierName: 'DHL Philippines', waybillId: 'wb-010', status: 'Picked Up', location: 'Cebu', timestamp: ago(10), remark: '' },
      { id: uid(), carrierId: 'car-002', carrierName: 'DHL Philippines', waybillId: 'wb-010', status: 'In Transit', location: 'NAIA Cargo Terminal', timestamp: ago(6), remark: 'Air waybill issued' },
    ],
  },
  {
    id: 'wb-011', trackingNumber: 'JT-2024-3011', shipperId: 'usr-006', shipperName: 'Best Supplies Inc.',
    recipientName: 'Cristina Hernandez', recipientAddress: '7 Mabini St, Brgy. Poblacion, Bacolod City',
    recipientPhone: '+63 933 444 5566', origin: 'Cebu', destination: 'Bacolod City',
    weight: 2.0, dimensions: '28x20x14', serviceType: 'STANDARD',
    status: 'IN_TRANSIT', estimatedDelivery: later(12),
    createdAt: ago(20), updatedAt: ago(8),
    events: makeEvents('wb-011', 8, 'Cebu', 'Bacolod City'),
    slaBreached: false, teamId: 'team-002', teamName: 'Cebu Hub',
  },
  {
    id: 'wb-012', trackingNumber: 'LBC-2024-1012', shipperId: 'usr-004', shipperName: 'Acme Corporation',
    recipientName: 'Antonio Bautista', recipientAddress: '99 MacArthur Hwy, Brgy. San Jose, Angeles City',
    recipientPhone: '+63 906 555 7788', origin: 'Manila', destination: 'Angeles City',
    weight: 7.5, dimensions: '55x40x30', serviceType: 'STANDARD',
    status: 'DELIVERED', estimatedDelivery: ago(24), actualDelivery: ago(20),
    createdAt: ago(96), updatedAt: ago(20),
    events: [...makeEvents('wb-012', 20, 'Manila', 'Angeles City'), { id: uid(), waybillId: 'wb-012', status: 'DELIVERED', location: '99 MacArthur Hwy, Angeles City', courierName: 'Juan Dela Cruz', timestamp: ago(20), eventType: 'MILESTONE' }],
    slaBreached: false, teamId: 'team-004', teamName: 'Luzon North',
  },
  {
    id: 'wb-013', trackingNumber: 'GOGO-2024-5013', shipperId: 'usr-006', shipperName: 'Best Supplies Inc.',
    recipientName: 'Grace Villar', recipientAddress: '15 Luna St, Brgy. 3, Iloilo City',
    recipientPhone: '+63 919 888 1122', origin: 'Manila', destination: 'Iloilo City',
    weight: 4.0, dimensions: '35x25x18', serviceType: 'EXPRESS',
    status: 'FAILED_DELIVERY', estimatedDelivery: ago(6),
    createdAt: ago(60), updatedAt: ago(4),
    events: [...makeEvents('wb-013', 11, 'Manila', 'Iloilo City'),
      { id: uid(), waybillId: 'wb-013', status: 'OUT_FOR_DELIVERY', location: 'Iloilo Hub', timestamp: ago(8), eventType: 'MILESTONE' },
      { id: uid(), waybillId: 'wb-013', status: 'FAILED_DELIVERY', location: '15 Luna St, Iloilo City', timestamp: ago(4), eventType: 'MILESTONE', exceptionCode: 'WRONG_ADDRESS', exceptionDetail: 'Address incomplete — street number does not exist' },
    ],
    slaBreached: true, teamId: 'team-002', teamName: 'Cebu Hub', returnInfo: { status: 'RETURN_IN_TRANSIT', reason: 'Wrong address provided', requestedAt: ago(2), notes: 'Shipper contacted for correct address' } },
  {
    id: 'wb-014', trackingNumber: 'JT-2024-3014', shipperId: 'usr-004', shipperName: 'Acme Corporation',
    recipientName: 'Dennis Uy', recipientAddress: '88 National Road, Brgy. San Pedro, General Santos City',
    recipientPhone: '+63 925 333 4455', origin: 'Davao', destination: 'General Santos City',
    weight: 9.0, dimensions: '70x50x40', serviceType: 'STANDARD',
    status: 'AT_SORTING_CENTER', estimatedDelivery: later(14),
    createdAt: ago(22), updatedAt: ago(10),
    events: makeEvents('wb-014', 9, 'Davao', 'General Santos City'),
    slaBreached: false, teamId: 'team-003', teamName: 'Davao Ops',
  },
  {
    id: 'wb-015', trackingNumber: 'LBC-2024-1015', shipperId: 'usr-004', shipperName: 'Acme Corporation',
    recipientName: 'Helen Cruz', recipientAddress: '42 National Hwy, Brgy. Lourdes, San Fernando',
    recipientPhone: '+63 911 777 3344', origin: 'Manila', destination: 'San Fernando, La Union',
    weight: 1.5, dimensions: '22x16x10', serviceType: 'EXPRESS',
    status: 'DELIVERED', estimatedDelivery: ago(48), actualDelivery: ago(50),
    createdAt: ago(144), updatedAt: ago(50),
    events: [...makeEvents('wb-015', 22, 'Manila', 'San Fernando'), { id: uid(), waybillId: 'wb-015', status: 'DELIVERED', location: '42 National Hwy, San Fernando', courierName: 'Juan Dela Cruz', timestamp: ago(50), eventType: 'MILESTONE' }],
    slaBreached: false, teamId: 'team-004', teamName: 'Luzon North',
  },
]

const seedReturns: any[] = [
  { id: 'ret-001', waybillId: 'wb-006', trackingNumber: 'LBC-2024-1006', recipientName: 'Leticia Chua', origin: 'Manila', destination: 'Pasig City', status: 'RETURN_REQUESTED', returnInfo: { status: 'RETURN_REQUESTED', reason: 'Delivery failed — recipient not available after 3 attempts', requestedAt: ago(1), carrier: 'LBC Express', notes: 'Recipient requested re-delivery to office address, pending confirmation' }, reason: 'Delivery failed — recipient not available after 3 attempts', requestedAt: ago(1), carrier: 'LBC Express', notes: 'Recipient requested re-delivery to office address, pending confirmation' },
  { id: 'ret-002', waybillId: 'wb-013', trackingNumber: 'GOGO-2024-5013', recipientName: 'Grace Villar', origin: 'Manila', destination: 'Iloilo City', status: 'RETURN_IN_TRANSIT', returnInfo: { status: 'RETURN_IN_TRANSIT', reason: 'Wrong address provided by shipper', requestedAt: ago(2), carrier: 'GoGo Xpress', notes: 'Shipper contacted — awaiting corrected address' }, reason: 'Wrong address provided by shipper', requestedAt: ago(2), carrier: 'GoGo Xpress', notes: 'Shipper contacted — awaiting corrected address' },
]

const seedDwellAlerts: DwellAlert[] = [
  { id: 'dwl-001', waybillId: 'wb-002', trackingNumber: 'LBC-2024-1002', facility: 'Cebu Sorting Center', arrivedAt: ago(20), durationMinutes: 2880, thresholdMinutes: 1440, acknowledged: false, createdAt: ago(6) },
  { id: 'dwl-002', waybillId: 'wb-003', trackingNumber: 'JT-2024-3001', facility: 'Davao Sorting Facility', arrivedAt: ago(18), durationMinutes: 2160, thresholdMinutes: 1440, acknowledged: false, createdAt: ago(4) },
  { id: 'dwl-003', waybillId: 'wb-008', trackingNumber: 'LBC-2024-1008', facility: 'Puerto Princesa Hub', arrivedAt: ago(10), durationMinutes: 720, thresholdMinutes: 1440, acknowledged: true, createdAt: ago(2) },
]

const seedGeofenceEvents: GeofenceEvent[] = [
  { id: 'geo-001', waybillId: 'wb-001', trackingNumber: 'LBC-2024-1001', eventType: 'ENTRY', zone: 'Makati Delivery Zone', zoneType: 'DELIVERY_ZONE', latitude: 14.5547, longitude: 121.0244, timestamp: ago(9), metadata: 'Driver entered Makati delivery area' },
  { id: 'geo-002', waybillId: 'wb-001', trackingNumber: 'LBC-2024-1001', eventType: 'ENTRY', zone: '45 P. Gomez St', zoneType: 'DELIVERY_POINT', latitude: 14.5532, longitude: 121.0211, timestamp: ago(8), metadata: 'Arrived at delivery address' },
  { id: 'geo-003', waybillId: 'wb-002', trackingNumber: 'LBC-2024-1002', eventType: 'EXIT', zone: 'Manila Hub', zoneType: 'WAREHOUSE', latitude: 14.5995, longitude: 120.9842, timestamp: ago(14), metadata: 'Shipment departed Manila warehouse' },
  { id: 'geo-004', waybillId: 'wb-002', trackingNumber: 'LBC-2024-1002', eventType: 'ENTRY', zone: 'Cebu Sorting Center', zoneType: 'SORTING_CENTER', latitude: 10.3157, longitude: 123.8854, timestamp: ago(12), metadata: 'Arrived at Cebu sorting facility' },
  { id: 'geo-005', waybillId: 'wb-003', trackingNumber: 'JT-2024-3001', eventType: 'ENTRY', zone: 'Davao Service Center', zoneType: 'SERVICE_CENTER', latitude: 7.1907, longitude: 125.4553, timestamp: ago(16), metadata: 'Entered Davao service center' },
  { id: 'geo-006', waybillId: 'wb-010', trackingNumber: 'DHL-PH-45127', eventType: 'ENTRY', zone: 'BGC Premium Zone', zoneType: 'DELIVERY_ZONE', latitude: 14.5504, longitude: 121.0473, timestamp: ago(4), metadata: 'Entered BGC delivery zone' },
  { id: 'geo-007', waybillId: 'wb-013', trackingNumber: 'GOGO-2024-5013', eventType: 'ENTRY', zone: 'Iloilo City Center', zoneType: 'CITY_ZONE', latitude: 10.7202, longitude: 122.5621, timestamp: ago(6), metadata: 'Entered Iloilo City delivery zone' },
]

const seedEscalationRules: EscalationRule[] = [
  { id: 'er-001', name: 'SLA Breach Auto-Escalate', condition: 'SLA_BREACHED', threshold: 0, targetRole: 'OPS', isActive: true, createdAt: ago(720) },
  { id: 'er-002', name: 'Exception Aging — 24h', condition: 'EXCEPTION_AGE', threshold: 24, targetRole: 'ADMIN', isActive: true, createdAt: ago(720) },
  { id: 'er-003', name: 'Stuck Shipment (48h)', condition: 'STATUS_STUCK', threshold: 48, targetRole: 'OPS', isActive: true, createdAt: ago(720) },
  { id: 'er-004', name: 'Dwell Time Exceeded', condition: 'HIGH_VALUE', threshold: 24, targetRole: 'OPS', isActive: true, createdAt: ago(480) },
]

const seedEscalations: Escalation[] = [
  { id: 'esc-001', waybillId: 'wb-002', trackingNumber: 'LBC-2024-1002', ruleId: 'er-001', ruleName: 'SLA Breach Auto-Escalate', reason: 'SLA breached for waybill LBC-2024-1002 — estimated delivery was 6h ago', status: 'OPEN', escalatedTo: 'OPS', createdAt: ago(4) },
  { id: 'esc-002', waybillId: 'wb-006', trackingNumber: 'LBC-2024-1006', ruleId: 'er-002', ruleName: 'Exception Aging — 24h', reason: 'Failed delivery exception open for 48+ hours on waybill LBC-2024-1006', status: 'ACKNOWLEDGED', escalatedTo: 'ADMIN', createdAt: ago(12), acknowledgedAt: ago(8), acknowledgedBy: 'Maria Santos' },
  { id: 'esc-003', waybillId: 'wb-013', trackingNumber: 'GOGO-2024-5013', ruleId: 'er-002', ruleName: 'Exception Aging — 24h', reason: 'Wrong address exception — shipper was contacted but no response within 24h', status: 'OPEN', escalatedTo: 'ADMIN', createdAt: ago(2) },
]

const seedAuditLogs: AuditLog[] = [
  { id: 'aud-001', userId: 'usr-001', userName: 'Admin User', userRole: 'ADMIN', action: 'LOGIN', resourceType: 'AUTH', resourceId: 'usr-001', details: 'User logged in from dashboard', ipAddress: '192.168.1.100', createdAt: ago(2) },
  { id: 'aud-002', userId: 'usr-001', userName: 'Admin User', userRole: 'ADMIN', action: 'UPDATE_STATUS', resourceType: 'WAYBILL', resourceId: 'wb-002', details: 'Status updated from AT_SORTING_CENTER to OUT_FOR_DELIVERY', ipAddress: '192.168.1.100', createdAt: ago(8) },
  { id: 'aud-003', userId: 'usr-002', userName: 'Maria Santos', userRole: 'OPS', action: 'UPDATE_STATUS', resourceType: 'WAYBILL', resourceId: 'wb-003', details: 'Status updated to AT_SORTING_CENTER at Davao facility', ipAddress: '192.168.1.101', createdAt: ago(16) },
  { id: 'aud-004', userId: 'usr-001', userName: 'Admin User', userRole: 'ADMIN', action: 'CREATE', resourceType: 'USER', resourceId: 'usr-007', details: 'Created new courier: Pedro Lim', ipAddress: '192.168.1.100', createdAt: ago(168) },
  { id: 'aud-005', userId: 'usr-005', userName: 'Carlos Reyes', userRole: 'OPS', action: 'ACKNOWLEDGE', resourceType: 'ESCALATION', resourceId: 'esc-002', details: 'Acknowledged escalation for LBC-2024-1006', ipAddress: '192.168.1.102', createdAt: ago(8) },
  { id: 'aud-006', userId: 'usr-002', userName: 'Maria Santos', userRole: 'OPS', action: 'UPDATE_STATUS', resourceType: 'WAYBILL', resourceId: 'wb-009', details: 'Status updated to DELIVERED', ipAddress: '192.168.1.101', createdAt: ago(14) },
  { id: 'aud-007', userId: 'usr-001', userName: 'Admin User', userRole: 'ADMIN', action: 'LOGIN', resourceType: 'AUTH', resourceId: 'usr-001', details: 'User logged in from admin panel', ipAddress: '10.0.0.15', createdAt: ago(24) },
]

const seedAggregatedTracking: any[] = [
  { id: 'agg-001', waybillId: 'wb-004', trackingNumber: 'DHL-PH-99123', carrierId: 'car-002', carrierName: 'DHL Philippines', carrierTrackingNumber: 'DHL-800-7722-4100', status: 'IN_TRANSIT', lastEvent: 'Customs cleared at Clark Freeport', updatedAt: ago(10) },
  { id: 'agg-002', waybillId: 'wb-010', trackingNumber: 'DHL-PH-45127', carrierId: 'car-002', carrierName: 'DHL Philippines', carrierTrackingNumber: 'DHL-800-4512-7001', status: 'OUT_FOR_DELIVERY', lastEvent: 'Out for delivery in BGC area', updatedAt: ago(2) },
]

const seedWebhooks: any[] = [
  { id: 'wh-001', name: 'Slack Notifications', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: ['waybill.delivered', 'exception.raised'], isActive: true, createdAt: ago(720) },
  { id: 'wh-002', name: 'SAP Order Sync', url: 'https://sap-prod.example.com/webhook/waybills', events: ['waybill.created', 'waybill.updated'], isActive: true, createdAt: ago(480) },
]

const seedAttachments: Attachment[] = [
  { id: 'att-001', waybillId: 'wb-006', fileName: 'delivery_attempt_photo.jpg', fileType: 'image/jpeg', fileSize: 245000, data: '', uploadedAt: ago(2), uploadedBy: 'usr-003' },
  { id: 'att-002', waybillId: 'wb-006', fileName: 'notice_card_left.pdf', fileType: 'application/pdf', fileSize: 89000, data: '', uploadedAt: ago(2), uploadedBy: 'usr-003' },
]

const seedReportSchedules: ReportSchedule[] = [
  { id: 'rs-001', name: 'Weekly SLA Performance Report', format: 'PDF', frequency: 'WEEKLY', recipients: ['ops@waybilltrack.com', 'admin@waybilltrack.com'], filters: { teams: 'team-001,team-002,team-003,team-004' }, lastSentAt: ago(72), nextScheduledAt: later(96), isActive: true, createdAt: ago(720) },
  { id: 'rs-002', name: 'Daily Exception Summary', format: 'CSV', frequency: 'DAILY', recipients: ['ops@waybilltrack.com'], filters: { exceptionCodes: 'CUSTOMER_NOT_AVAILABLE,WRONG_ADDRESS,DAMAGE' }, isActive: true, createdAt: ago(720) },
  { id: 'rs-003', name: 'Monthly Carrier Scorecard', format: 'PDF', frequency: 'MONTHLY', recipients: ['admin@waybilltrack.com', 'ops@waybilltrack.com'], filters: {}, isActive: false, lastSentAt: ago(360), nextScheduledAt: later(240), createdAt: ago(720) },
]

const seedRegionPerformance: RegionPerformance[] = [
  { region: 'NCR', totalShipments: 1240, deliveredCount: 1180, onTimeCount: 1062, exceptionCount: 58, avgTransitHours: 18.5, slaCompliance: 90.0 },
  { region: 'Luzon', totalShipments: 890, deliveredCount: 845, onTimeCount: 725, exceptionCount: 42, avgTransitHours: 28.3, slaCompliance: 85.8 },
  { region: 'Visayas', totalShipments: 560, deliveredCount: 532, onTimeCount: 450, exceptionCount: 28, avgTransitHours: 32.1, slaCompliance: 84.6 },
  { region: 'Mindanao', totalShipments: 340, deliveredCount: 323, onTimeCount: 260, exceptionCount: 18, avgTransitHours: 40.2, slaCompliance: 80.5 },
]

const seedDriverAssignments: DriverAssignment[] = [
  { id: 'drv-001', driverId: 'usr-003', driverName: 'Juan Dela Cruz', waybillId: 'wb-001', trackingNumber: 'LBC-2024-1001', status: 'DELIVERED', assignedAt: ago(12), pickedUpAt: ago(10), deliveredAt: ago(8), recipientName: 'Ricardo Dimagiba', recipientAddress: '45 P. Gomez St, Brgy. San Lorenzo, Makati City', recipientPhone: '+63 917 555 1212', origin: 'Manila', destination: 'Makati City' },
  { id: 'drv-002', driverId: 'usr-003', driverName: 'Juan Dela Cruz', waybillId: 'wb-006', trackingNumber: 'LBC-2024-1006', status: 'FAILED', assignedAt: ago(8), pickedUpAt: ago(6), recipientName: 'Leticia Chua', recipientAddress: '303 Ortigas Ave, Brgy. San Antonio, Pasig City', recipientPhone: '+63 915 333 7788', origin: 'Manila', destination: 'Pasig City', notes: 'Recipient not home after 3 attempts' },
  { id: 'drv-003', driverId: 'usr-007', driverName: 'Pedro Lim', waybillId: 'wb-005', trackingNumber: 'GOGO-2024-5001', status: 'PICKED_UP', assignedAt: ago(8), pickedUpAt: ago(6), recipientName: 'Roberto Gonzales', recipientAddress: '200 Subic Bay Gateway Park, Zambales', recipientPhone: '+63 927 444 5566', origin: 'Cebu', destination: 'Subic Bay' },
  { id: 'drv-004', driverId: 'usr-003', driverName: 'Juan Dela Cruz', waybillId: 'wb-009', trackingNumber: 'GOGO-2024-5009', status: 'DELIVERED', assignedAt: ago(20), pickedUpAt: ago(18), deliveredAt: ago(14), recipientName: 'Sofia Alcantara', recipientAddress: '22 Bonifacio St, Brgy. 8, Legazpi City', recipientPhone: '+63 918 111 2233', origin: 'Manila', destination: 'Legazpi City' },
  { id: 'drv-005', driverId: 'usr-007', driverName: 'Pedro Lim', waybillId: 'wb-013', trackingNumber: 'GOGO-2024-5013', status: 'FAILED', assignedAt: ago(10), pickedUpAt: ago(8), recipientName: 'Grace Villar', recipientAddress: '15 Luna St, Brgy. 3, Iloilo City', recipientPhone: '+63 919 888 1122', origin: 'Manila', destination: 'Iloilo City', notes: 'Wrong address provided' },
  { id: 'drv-006', driverId: 'usr-007', driverName: 'Pedro Lim', waybillId: 'wb-010', trackingNumber: 'DHL-PH-45127', status: 'IN_TRANSIT', assignedAt: ago(6), pickedUpAt: ago(4), recipientName: 'Miguel Tan', recipientAddress: '5th Floor, XYZ Building, 25th St, BGC, Taguig', recipientPhone: '+63 921 777 8899', origin: 'Cebu', destination: 'Taguig' },
]

const seedDriverScans: DriverScanEvent[] = [
  { id: 'scn-001', driverId: 'usr-003', driverName: 'Juan Dela Cruz', waybillId: 'wb-001', trackingNumber: 'LBC-2024-1001', scanType: 'PICKUP', location: 'Manila Warehouse', timestamp: ago(10), latitude: 14.5995, longitude: 120.9842 },
  { id: 'scn-002', driverId: 'usr-003', driverName: 'Juan Dela Cruz', waybillId: 'wb-001', trackingNumber: 'LBC-2024-1001', scanType: 'DELIVERY', location: '45 P. Gomez St, Makati City', timestamp: ago(8), latitude: 14.5532, longitude: 121.0211, signature: 'Ricardo D.', remark: 'Delivered to recipient' },
  { id: 'scn-003', driverId: 'usr-003', driverName: 'Juan Dela Cruz', waybillId: 'wb-006', trackingNumber: 'LBC-2024-1006', scanType: 'ATTEMPT', location: '303 Ortigas Ave, Pasig City', timestamp: ago(5), latitude: 14.5861, longitude: 121.0625, remark: 'No answer at door, left notice card' },
  { id: 'scn-004', driverId: 'usr-007', driverName: 'Pedro Lim', waybillId: 'wb-005', trackingNumber: 'GOGO-2024-5001', scanType: 'PICKUP', location: 'Cebu Warehouse', timestamp: ago(6), latitude: 10.3157, longitude: 123.8854 },
  { id: 'scn-005', driverId: 'usr-007', driverName: 'Pedro Lim', waybillId: 'wb-010', trackingNumber: 'DHL-PH-45127', scanType: 'PICKUP', location: 'Cebu', timestamp: ago(4), latitude: 10.3157, longitude: 123.8854, remark: 'Package scanned at pickup' },
  { id: 'scn-006', driverId: 'usr-007', driverName: 'Pedro Lim', waybillId: 'wb-013', trackingNumber: 'GOGO-2024-5013', scanType: 'ATTEMPT', location: '15 Luna St, Iloilo City', timestamp: ago(6), latitude: 10.7202, longitude: 122.5621, remark: 'Address not found' },
]

const seedSettings: AppSettings = {
  companyName: 'WaybillTrack',
  timezone: 'Asia/Manila',
  sessionTimeout: 480,
  emailNotifications: true,
  defaultServiceType: 'STANDARD',
  logoUrl: '',
}

const seedErpIntegrations: ErpIntegration[] = [
  { id: 'erp-001', name: 'SAP Finance Sync', system: 'SAP', endpoint: 'https://sap-prod.waybilltrack.com/api/orders', authType: 'BASIC', syncDirection: 'EXPORT', lastSyncAt: ago(4), lastSyncStatus: 'SUCCESS', isActive: true, createdAt: ago(720) },
  { id: 'erp-002', name: 'Oracle WMS Import', system: 'ORACLE', endpoint: 'https://oracle-wms.waybilltrack.com/api/shipments', authType: 'OAUTH2', syncDirection: 'IMPORT', lastSyncAt: ago(12), lastSyncStatus: 'FAILED', isActive: true, createdAt: ago(720) },
  { id: 'erp-003', name: 'QuickBooks Billing Export', system: 'OTHER', endpoint: 'https://quickbooks.api.intuit.com/v3/company/123', authType: 'OAUTH2', syncDirection: 'EXPORT', lastSyncAt: ago(48), lastSyncStatus: 'SUCCESS', isActive: true, createdAt: ago(360) },
]

const db: Record<string, any[]> = {
  waybills: seedWaybills,
  users: seedUsers,
  teams: seedTeams,
  carriers: seedCarriers,
  'exception-codes': seedExceptionCodes,
  'audit-logs': seedAuditLogs,
  returns: seedReturns,
  'dwell-alerts': seedDwellAlerts,
  'geofence-events': seedGeofenceEvents,
  'escalation-rules': seedEscalationRules,
  escalations: seedEscalations,
  'reports/schedules': seedReportSchedules,
  'analytics/region-performance': seedRegionPerformance,
  'erp-integrations': seedErpIntegrations,
  'tracking/aggregated': seedAggregatedTracking,
  webhooks: seedWebhooks,
  attachments: seedAttachments,
  'driver-assignments': seedDriverAssignments,
  'driver-scans': seedDriverScans,
}

let dbSettings: AppSettings = { ...seedSettings }

api.interceptors.request.use((config) => {
  let url: string = (config.url || '').replace(/^\/api/, '') || '/'
  const { method } = config

  function mock(data: any, status = 200) {
    config.adapter = () => Promise.resolve({ data, status, statusText: 'OK', headers: { 'content-type': 'application/json' }, config })
  }

  if (url === '/auth/login' && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    if (String(body?.email).toLowerCase() === 'admin' && body?.password === 'admin') {
      mock({ accessToken: MOCK_TOKEN, user: MOCK_USER })
    } else {
      mock({ error: 'Invalid credentials' }, 401)
    }
    return config
  }
  if (url === '/auth/me' && method === 'get') {
    if (localStorage.getItem('access_token') === MOCK_TOKEN) mock(MOCK_USER)
    return config
  }

  const listMatch = url.match(/^\/(\w[\w/-]*?)(?:\?|$)/)
  const key = listMatch?.[1] || ''
  const idMatch = url.match(/^\/(\w[\w/-]*?)\/([\w-]+)(?:\/|$)/)
  const collKey = idMatch?.[1] || ''
  const itemId = idMatch?.[2] || ''

  // --- Specific path handlers (must run before generic idMatch) ---
  if (method === 'get' && key === 'analytics/stats') {
    const wbs = seedWaybills
    const totalActive = wbs.filter(w => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(w.status)).length
    const deliveredToday = wbs.filter(w => w.status === 'DELIVERED' && new Date(w.actualDelivery || w.updatedAt) > new Date(Date.now() - 86400000)).length
    const inTransit = wbs.filter(w => w.status === 'IN_TRANSIT').length
    const pendingPickup = wbs.filter(w => w.status === 'CREATED').length
    const totalVolume = wbs.reduce((s, w) => s + w.weight, 0)
    const delivered = wbs.filter(w => w.status === 'DELIVERED').length
    const slaCompliance = delivered > 0 ? Math.round((wbs.filter(w => w.status === 'DELIVERED' && !w.slaBreached).length / delivered) * 100 * 10) / 10 : 100
    const withExceptions = wbs.filter(w => w.events.some(e => e.exceptionCode)).length
    const exceptionRate = wbs.length > 0 ? Math.round((withExceptions / wbs.length) * 100 * 10) / 10 : 0
    mock({ totalActive, deliveredToday, inTransit, pendingPickup, totalVolume, slaCompliance, exceptionRate, avgTransitTime: 26.8 } satisfies DashboardStats)
    return config
  }
  if (method === 'get' && key === 'analytics/carrier-performance') {
    mock(seedCarrierPerformance)
    return config
  }
  if (method === 'get' && key === 'waybills/map-data') {
    mock(seedWaybills.filter(w => ['IN_TRANSIT', 'AT_SORTING_CENTER', 'OUT_FOR_DELIVERY'].includes(w.status)).map(w => ({ id: w.id, trackingNumber: w.trackingNumber, status: w.status, origin: w.origin, destination: w.destination, slaBreached: w.slaBreached })))
    return config
  }
  if (method === 'get' && collKey === 'waybills' && url.includes('/dwell')) {
    mock(seedDwellAlerts.filter(d => d.waybillId === itemId).map(d => ({ id: d.id, waybillId: d.waybillId, trackingNumber: d.trackingNumber, facility: d.facility, arrivedAt: d.arrivedAt, isActive: true, durationMinutes: d.durationMinutes } satisfies DwellSegment)))
    return config
  }
  if (method === 'get' && collKey === 'waybills' && url.includes('/geofence')) {
    mock(seedGeofenceEvents.filter(g => g.waybillId === itemId))
    return config
  }
  if (method === 'get' && collKey === 'waybills' && url.includes('/attachments')) {
    mock(seedAttachments.filter(a => a.waybillId === itemId))
    return config
  }
  if (method === 'get' && collKey === 'carriers' && url.includes('/events')) {
    const wb = seedWaybills.find(w => w.id === itemId)
    mock(wb?.carrierEvents || [])
    return config
  }
  if (method === 'get' && key === 'settings/dwell-threshold') {
    mock({ thresholdMinutes: 1440 })
    return config
  }
  if (method === 'get' && key === 'webhooks/events') {
    mock(['waybill.created', 'waybill.updated', 'waybill.delivered', 'exception.raised'])
    return config
  }
  if (method === 'post' && url === '/waybills/batch-status') {
    mock({ success: true, updatedCount: 2 })
    return config
  }
  if (method === 'get' && key === 'settings') {
    mock(dbSettings)
    return config
  }
  if (method === 'get' && collKey === 'track') {
    const wb = seedWaybills.find(w => w.trackingNumber === itemId)
    if (wb) mock(wb)
    else mock({ error: 'Waybill not found' }, 404)
    return config
  }
  if (method === 'get' && key === 'analytics/sla') {
    const from = config.params?.from || ago(168)
    const to = config.params?.to || ago(0)
    const rows = seedWaybills.filter(w => w.estimatedDelivery >= from && w.estimatedDelivery <= to).reduce((acc: any[], w) => {
      const date = w.estimatedDelivery.slice(0, 10)
      const existing = acc.find(r => r.date === date)
      if (existing) { existing.total++; if (!w.slaBreached) existing.onTime++; else existing.breached++ }
      else acc.push({ date, total: 1, onTime: w.slaBreached ? 0 : 1, breached: w.slaBreached ? 1 : 0 })
      return acc
    }, [])
    mock(rows)
    return config
  }

  // --- Generic collection/item handlers (run after specific path handlers) ---
  if (method === 'get' && idMatch && db[collKey] && url.replace(/\/$/, '') === `/${collKey}/${itemId}`) {
    const item = db[collKey].find((x: any) => x.id === itemId || x.waybillId === itemId)
    if (item) { mock(item); return config }
  }
  if (method === 'get' && db[key]) {
    mock(db[key])
    return config
  }

  if (method === 'put' && key === 'settings') {
    dbSettings = { ...dbSettings, ...(typeof config.data === 'string' ? JSON.parse(config.data) : config.data) }
    mock(dbSettings)
    return config
  }

  if (method === 'put' && key === 'settings/dwell-threshold') {
    mock({ success: true })
    return config
  }

  if (method === 'post' && idMatch && url.endsWith('/acknowledge') && db[collKey]) {
    const now = new Date().toISOString()
    const idx = db[collKey].findIndex((x: any) => x.id === itemId)
    if (idx >= 0) {
      db[collKey][idx] = { ...db[collKey][idx], acknowledged: true, acknowledgedAt: now, acknowledgedBy: 'Admin User', updatedAt: now }
      mock(db[collKey][idx])
    }
    return config
  }

  if (method === 'post' && idMatch && url.endsWith('/status') && db[collKey]) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {})
    const now = new Date().toISOString()
    const idx = db[collKey].findIndex((x: any) => x.id === itemId)
    if (idx >= 0) {
      const updated = { ...db[collKey][idx], status: body.status, updatedAt: now }
      if (body.status === 'PICKED_UP') updated.pickedUpAt = now
      if (body.status === 'DELIVERED') updated.deliveredAt = now
      db[collKey][idx] = updated
      if (body.scanType && db['driver-scans']) {
        db['driver-scans'].push({
          id: uid(), driverId: updated.driverId, driverName: updated.driverName,
          waybillId: updated.waybillId, trackingNumber: updated.trackingNumber,
          scanType: body.scanType, location: body.location || updated.destination,
          timestamp: now, latitude: body.latitude, longitude: body.longitude,
          photoUrl: body.photoUrl, signature: body.signature, remark: body.remark,
        })
      }
      mock(updated)
    }
    return config
  }

  if (method === 'post' && idMatch && url.endsWith('/resolve') && db[collKey]) {
    const now = new Date().toISOString()
    const idx = db[collKey].findIndex((x: any) => x.id === itemId)
    if (idx >= 0) {
      db[collKey][idx] = { ...db[collKey][idx], status: 'RESOLVED', resolvedAt: now, resolvedBy: 'Admin User', updatedAt: now }
      mock(db[collKey][idx])
    }
    return config
  }

  if (method === 'post' || method === 'put' || method === 'patch') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {})
    const now = new Date().toISOString()

    if (idMatch && db[collKey]) {
      const idx = db[collKey].findIndex((x: any) => x.id === itemId)
      if (idx >= 0) {
        db[collKey][idx] = { ...db[collKey][idx], ...body, updatedAt: now }
        mock(db[collKey][idx])
      }
      return config
    }

    if (key === 'waybills/batch-status') {
      mock({ success: true, updatedCount: (body.ids || []).length })
      return config
    }

    if (key === 'auth/reset-password') {
      mock({ success: true })
      return config
    }

    const newItem = { id: uid(), ...body, createdAt: now, updatedAt: now }
    const storeKey = key.replace(/\/$/, '')
    if (db[storeKey]) db[storeKey].push(newItem)
    mock(newItem)
    return config
  }

  if (method === 'delete' && idMatch && db[collKey]) {
    const idx = db[collKey].findIndex((x: any) => x.id === itemId)
    if (idx >= 0) db[collKey].splice(idx, 1)
    mock({ success: true })
    return config
  }

  mock({})
  return config
})

export const authService = {
  login: async (email: string, password: string) => {
    if (String(email).toLowerCase() === 'admin' && password === 'admin') {
      return { data: { accessToken: MOCK_TOKEN, user: MOCK_USER }, status: 200, statusText: 'OK', headers: {}, config: {} as any }
    }
    return await api.post('/auth/login', { email, password })
  },
  me: async () => {
    if (localStorage.getItem('access_token') === MOCK_TOKEN) {
      return { data: MOCK_USER, status: 200, statusText: 'OK', headers: {}, config: {} as any }
    }
    return await api.get('/auth/me')
  },
}

export const waybillService = {
  list: (params?: Record<string, string>) => api.get<Waybill[]>('/waybills', { params }),
  get: (id: string) => api.get<Waybill>(`/waybills/${id}`),
  track: (trackingNumber: string) => api.get<Waybill>(`/track/${trackingNumber}`),
  create: (data: Partial<Waybill>) => api.post<Waybill>('/waybills', data),
  updateStatus: (id: string, event: Partial<ScanEvent>) => api.patch<Waybill>(`/waybills/${id}/status`, event),
  batchStatusUpdate: (ids: string[], status: string, location?: string) => api.post('/waybills/batch-status', { ids, status, location }),
}

export const exceptionCodeService = { list: () => api.get<ExceptionCodeInfo[]>('/exception-codes') }

export const analyticsService = {
  stats: () => api.get<DashboardStats>('/analytics/stats'),
  slaReport: (from: string, to: string) => api.get('/analytics/sla', { params: { from, to } }),
  exportExcel: (from: string, to: string) => api.get('/analytics/export', { params: { from, to }, responseType: 'blob' }),
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
  assign: (waybillId: string, data: { carrierId: string; carrierTrackingNumber: string }) => api.post(`/tracking/aggregated/${waybillId}`, data),
  remove: (waybillId: string) => api.delete(`/tracking/aggregated/${waybillId}`),
}

export const auditLogService = { list: () => api.get<AuditLog[]>('/audit-logs') }

export const settingsService = {
  get: () => api.get<AppSettings>('/settings'),
  update: (data: Partial<AppSettings>) => api.put<AppSettings>('/settings', data),
  resetPassword: (userId: string, newPassword: string) => api.post('/auth/reset-password', { userId, newPassword }),
}

export const teamService = {
  list: () => api.get<Team[]>('/teams'),
  create: (data: Partial<Team>) => api.post<Team>('/teams', data),
  update: (id: string, data: Partial<Team>) => api.patch<Team>(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  assignToWaybill: (waybillId: string, teamId: string | null) => api.patch<Waybill>(`/waybills/${waybillId}/assign-team`, { teamId }),
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
  upload: (waybillId: string, data: { fileName: string; fileType: string; fileSize: number; data: string }) => api.post<Attachment>(`/waybills/${waybillId}/attachments`, data),
  get: (attachmentId: string) => api.get<Attachment>(`/attachments/${attachmentId}`),
  delete: (attachmentId: string) => api.delete(`/attachments/${attachmentId}`),
}

export const returnService = {
  listReturns: () => api.get<any[]>('/returns'),
  initiateReturn: (waybillId: string, data: { reason?: string; carrier?: string; notes?: string }) => api.post(`/waybills/${waybillId}/initiate-return`, data),
  updateReturnStatus: (waybillId: string, data: { status: string; notes?: string }) => api.patch(`/waybills/${waybillId}/return-status`, data),
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

export const driverService = {
  listAssignments: () => api.get<DriverAssignment[]>('/driver-assignments'),
  getAssignment: (id: string) => api.get<DriverAssignment>(`/driver-assignments/${id}`),
  updateStatus: (id: string, data: {
    status: string; scanType?: string; location?: string;
    latitude?: number; longitude?: number; photoUrl?: string; signature?: string; remark?: string
  }) => api.post<DriverAssignment>(`/driver-assignments/${id}/status`, data),
  listScans: () => api.get<DriverScanEvent[]>('/driver-scans'),
}

export const regionService = { performance: () => api.get<RegionPerformance[]>('/analytics/region-performance') }

export const erpIntegrationService = {
  list: () => api.get<ErpIntegration[]>('/erp-integrations'),
  create: (data: Partial<ErpIntegration>) => api.post<ErpIntegration>('/erp-integrations', data),
  update: (id: string, data: Partial<ErpIntegration>) => api.patch<ErpIntegration>(`/erp-integrations/${id}`, data),
  delete: (id: string) => api.delete(`/erp-integrations/${id}`),
  test: (id: string) => api.post<{ success: boolean; message: string }>(`/erp-integrations/${id}/test`),
  sync: (id: string) => api.post<{ success: boolean; message: string }>(`/erp-integrations/${id}/sync`),
}

export default api