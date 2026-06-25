import type { AxiosInstance } from 'axios'
import type { Waybill, ScanEvent, User, DashboardStats, ExceptionCodeInfo, AuditLog, Carrier, AppSettings, Team, Attachment, EscalationRule, Escalation, DwellSegment, DwellAlert, GeofenceEvent, ReportSchedule, RegionPerformance, ErpIntegration, DriverAssignment, DriverScanEvent, CustomsShipment, CodPayment, BiIntegration, CostAnalytics, DemandForecast, CarbonFootprint, ECommerceDashboard, WhiteLabelPortalData, IotSensorDashboard } from '@/types/waybill'

const MOCK_USER: User = { id: 'admin-001', email: 'admin@waybilltrack.com', name: 'Admin User', role: 'ADMIN', company: 'WaybillTrack' }
const MOCK_TOKEN = 'mock-jwt-token-admin'

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

const seedCustomsShipments: CustomsShipment[] = [
  { id: 'cst-001', waybillId: 'wb-001', trackingNumber: 'LBC-2024-1001', shipperName: 'Juan Dela Cruz Trading', recipientName: 'Ricardo Dimagiba', origin: 'Manila', destination: 'Makati City', originCountry: 'Philippines', destinationCountry: 'Philippines', customsStatus: 'NOT_REQUIRED', documents: [], estimatedClearance: '', lastUpdated: ago(12) },
  { id: 'cst-002', waybillId: 'wb-004', trackingNumber: 'DHL-PH-99123', shipperName: 'Global Trade Corp', recipientName: 'ABC Trading Co.', origin: 'Shanghai', destination: 'Manila', originCountry: 'China', destinationCountry: 'Philippines', customsStatus: 'CLEARANCE_IN_PROGRESS', documents: [
    { id: 'cdoc-001', waybillId: 'wb-004', trackingNumber: 'DHL-PH-99123', docType: 'COMMERCIAL_INVOICE', title: 'Commercial Invoice INV-2024-8912', status: 'APPROVED', fileName: 'invoice_8912.pdf', fileSize: 245760, notes: 'Value declared correctly', submittedAt: ago(48), approvedAt: ago(36), createdAt: ago(72) },
    { id: 'cdoc-002', waybillId: 'wb-004', trackingNumber: 'DHL-PH-99123', docType: 'PACKING_LIST', title: 'Packing List PL-2024-8912', status: 'APPROVED', fileName: 'packing_list_8912.pdf', fileSize: 122880, submittedAt: ago(48), approvedAt: ago(36), createdAt: ago(72) },
    { id: 'cdoc-003', waybillId: 'wb-004', trackingNumber: 'DHL-PH-99123', docType: 'CERT_OF_ORIGIN', title: 'Certificate of Origin CO-2024-8912', status: 'SUBMITTED', fileName: 'cert_of_origin_8912.pdf', fileSize: 184320, submittedAt: ago(24), createdAt: ago(72) },
    { id: 'cdoc-004', waybillId: 'wb-004', trackingNumber: 'DHL-PH-99123', docType: 'CUSTOMS_DECLARATION', title: 'Customs Declaration Form BOC-2024-8912', status: 'PENDING', fileName: 'customs_decl_8912.pdf', fileSize: 307200, createdAt: ago(12) },
  ], estimatedClearance: new Date(Date.now() + 86400000 * 2).toISOString(), lastUpdated: ago(4) },
  { id: 'cst-003', waybillId: 'wb-010', trackingNumber: 'DHL-PH-45127', shipperName: 'Worldwide Logistics HK', recipientName: 'Miguel Tan', origin: 'Hong Kong', destination: 'Taguig', originCountry: 'Hong Kong', destinationCountry: 'Philippines', customsStatus: 'DOCUMENTS_PENDING', documents: [
    { id: 'cdoc-005', waybillId: 'wb-010', trackingNumber: 'DHL-PH-45127', docType: 'COMMERCIAL_INVOICE', title: 'Commercial Invoice INV-2024-45127', status: 'PENDING', fileName: 'invoice_45127.pdf', fileSize: 198656, createdAt: ago(6) },
  ], estimatedClearance: new Date(Date.now() + 86400000 * 3).toISOString(), lastUpdated: ago(6) },
  { id: 'cst-004', waybillId: 'wb-003', trackingNumber: 'JT-2024-3001', shipperName: 'Davao Agri Enterprises', recipientName: 'Josefa Mercado', origin: 'Davao City', destination: 'Manila', originCountry: 'Philippines', destinationCountry: 'Philippines', customsStatus: 'NOT_REQUIRED', documents: [], estimatedClearance: '', lastUpdated: ago(16) },
  { id: 'cst-005', waybillId: 'wb-005', trackingNumber: 'GOGO-2024-5001', shipperName: 'Cebu Electronics Inc.', recipientName: 'Roberto Gonzales', origin: 'Cebu', destination: 'Subic Bay', originCountry: 'Philippines', destinationCountry: 'Philippines', customsStatus: 'CLEARED', documents: [
    { id: 'cdoc-006', waybillId: 'wb-005', trackingNumber: 'GOGO-2024-5001', docType: 'COMMERCIAL_INVOICE', title: 'Commercial Invoice INV-2024-5001', status: 'APPROVED', fileName: 'invoice_5001.pdf', fileSize: 159744, submittedAt: ago(96), approvedAt: ago(84), createdAt: ago(120) },
    { id: 'cdoc-007', waybillId: 'wb-005', trackingNumber: 'GOGO-2024-5001', docType: 'BILL_OF_LADING', title: 'Bill of Lading BL-2024-5001', status: 'APPROVED', fileName: 'bol_5001.pdf', fileSize: 278528, submittedAt: ago(96), approvedAt: ago(84), createdAt: ago(120) },
  ], estimatedClearance: ago(80), lastUpdated: ago(80) },
  { id: 'cst-006', waybillId: 'wb-013', trackingNumber: 'GOGO-2024-5013', shipperName: 'Northern Traders Inc.', recipientName: 'Grace Villar', origin: 'Manila', destination: 'Iloilo City', originCountry: 'Philippines', destinationCountry: 'Philippines', customsStatus: 'NOT_REQUIRED', documents: [], estimatedClearance: '', lastUpdated: ago(10) },
]

const seedBiIntegrations: BiIntegration[] = [
  { id: 'bi-001', name: 'Power BI - Executive Dashboard', platform: 'POWER_BI', status: 'CONNECTED', endpoint: 'https://app.powerbi.com/groups/me/dashboards/abc123', datasets: ['waybills', 'analytics/stats', 'carrier-performance'], lastSyncAt: ago(2), refreshInterval: 15, createdAt: ago(720) },
  { id: 'bi-002', name: 'Looker - Operations Analytics', platform: 'LOOKER', status: 'CONNECTED', endpoint: 'https://waybilltrack.looker.com/dashboards/456', datasets: ['waybills', 'analytics/stats'], lastSyncAt: ago(6), refreshInterval: 30, createdAt: ago(540) },
  { id: 'bi-003', name: 'Tableau - Carrier Performance', platform: 'TABLEAU', status: 'DISCONNECTED', datasets: ['carrier-performance'], refreshInterval: 60, createdAt: ago(360) },
  { id: 'bi-004', name: 'Grafana - Real-time Monitoring', platform: 'GRAFANA', status: 'ERROR', endpoint: 'https://grafana.waybilltrack.com/d/789', datasets: ['waybills/map-data'], lastSyncAt: ago(48), refreshInterval: 5, createdAt: ago(180) },
  { id: 'bi-005', name: 'Superset - Regional Analytics', platform: 'SUPERSET', status: 'CONNECTED', endpoint: 'https://superset.waybilltrack.com/superset/dashboard/321/', datasets: ['analytics/region-performance', 'analytics/stats'], lastSyncAt: ago(12), refreshInterval: 60, createdAt: ago(90) },
]

const seedCodPayments: CodPayment[] = [
  { id: 'cod-001', waybillId: 'wb-001', trackingNumber: 'LBC-2024-1001', shipperName: 'Juan Dela Cruz Trading', recipientName: 'Ricardo Dimagiba', amount: 2500.00, fee: 75.00, netAmount: 2425.00, currency: 'PHP', collectedAt: ago(48), status: 'SETTLED', settledAt: ago(36), carrierName: 'LBC Express' },
  { id: 'cod-002', waybillId: 'wb-002', trackingNumber: 'LBC-2024-1002', shipperName: 'Maria Santos Enterprises', recipientName: 'Antonio Lopez', amount: 4750.00, fee: 142.50, netAmount: 4607.50, currency: 'PHP', collectedAt: ago(36), status: 'SETTLED', settledAt: ago(24), carrierName: 'LBC Express' },
  { id: 'cod-003', waybillId: 'wb-004', trackingNumber: 'DHL-PH-99123', shipperName: 'Global Trade Corp', recipientName: 'ABC Trading Co.', amount: 15200.00, fee: 456.00, netAmount: 14744.00, currency: 'PHP', collectedAt: ago(24), status: 'PENDING_SETTLEMENT', carrierName: 'DHL Express' },
  { id: 'cod-004', waybillId: 'wb-006', trackingNumber: '2GO-2024-6001', shipperName: 'Luzon Distributors Inc.', recipientName: 'Carmen Villanueva', amount: 3800.00, fee: 114.00, netAmount: 3686.00, currency: 'PHP', collectedAt: ago(12), status: 'PENDING_SETTLEMENT', carrierName: '2Go Logistics' },
  { id: 'cod-005', waybillId: 'wb-007', trackingNumber: 'FD-PH-78901', shipperName: 'Visayan Food Products', recipientName: 'Fernando Reyes', amount: 1820.00, fee: 54.60, netAmount: 1765.40, currency: 'PHP', collectedAt: ago(72), status: 'DISPUTED', disputeReason: 'Customer claims overpayment', carrierName: 'Flash Delivery' },
  { id: 'cod-006', waybillId: 'wb-008', trackingNumber: 'LBC-2024-1008', shipperName: 'Mindanao Exports Co.', recipientName: 'Elena Martinez', amount: 6200.00, fee: 186.00, netAmount: 6014.00, currency: 'PHP', collectedAt: ago(96), status: 'COLLECTED', carrierName: 'LBC Express' },
  { id: 'cod-007', waybillId: 'wb-009', trackingNumber: 'DHL-PH-45228', shipperName: 'Asian Tech Supplies', recipientName: 'Gregorio Hernandez', amount: 28900.00, fee: 867.00, netAmount: 28033.00, currency: 'PHP', collectedAt: ago(8), status: 'COLLECTED', carrierName: 'DHL Express' },
  { id: 'cod-008', waybillId: 'wb-011', trackingNumber: 'LBC-2024-1011', shipperName: 'Island Hardware Supply', recipientName: 'Luis Mendoza', amount: 1450.00, fee: 43.50, netAmount: 1406.50, currency: 'PHP', collectedAt: ago(120), status: 'REFUNDED', notes: 'Customer returned item', carrierName: 'LBC Express' },
  { id: 'cod-009', waybillId: 'wb-012', trackingNumber: 'JT-2024-3002', shipperName: 'Bicol Agri Traders', recipientName: 'Sofia Dela Cruz', amount: 5600.00, fee: 168.00, netAmount: 5432.00, currency: 'PHP', collectedAt: ago(16), status: 'PENDING_SETTLEMENT', carrierName: 'J&T Express' },
  { id: 'cod-010', waybillId: 'wb-013', trackingNumber: 'GOGO-2024-5013', shipperName: 'Northern Traders Inc.', recipientName: 'Grace Villar', amount: 9100.00, fee: 273.00, netAmount: 8827.00, currency: 'PHP', collectedAt: ago(10), status: 'COLLECTED', carrierName: 'GoGo Xpress' },
]

const seedECommerceDashboard: ECommerceDashboard = {
  platforms: [
    { id: 'ec-001', platform: 'Shopify', storeName: 'Philippine Treasures PH', connected: true, lastSync: ago(1), totalOrders: 12800, syncedOrders: 12750, webhookUrl: 'https://hooks.waybilltrack.com/shopify/treasures', storeUrl: 'https://philippine-treasures.myshopify.com' },
    { id: 'ec-002', platform: 'Lazada', storeName: 'Manila Lifestyle Store', connected: true, lastSync: ago(2), totalOrders: 9500, syncedOrders: 9400, webhookUrl: null, storeUrl: 'https://www.lazada.com.ph/shop/manila-lifestyle' },
    { id: 'ec-003', platform: 'Shopee', storeName: 'Cebu Gadget Hub', connected: true, lastSync: ago(4), totalOrders: 7200, syncedOrders: 7180, webhookUrl: null, storeUrl: 'https://shopee.ph/cebugadgethub' },
    { id: 'ec-004', platform: 'Amazon', storeName: 'GlobalExports PH', connected: false, lastSync: ago(360), totalOrders: 2100, syncedOrders: 2080, webhookUrl: null, storeUrl: 'https://www.amazon.com/shops/globalexportsph' },
    { id: 'ec-005', platform: 'WooCommerce', storeName: 'Davao Organic Market', connected: true, lastSync: ago(3), totalOrders: 3400, syncedOrders: 3390, webhookUrl: 'https://hooks.waybilltrack.com/woo/davao-organic', storeUrl: 'https://davao-organic-market.com' },
    { id: 'ec-006', platform: 'Shopify', storeName: 'Baguio Crafts & Co.', connected: false, lastSync: ago(720), totalOrders: 1800, syncedOrders: 1750, webhookUrl: null, storeUrl: 'https://baguio-crafts.myshopify.com' },
  ],
  recentSyncs: [
    { id: 'sync-001', platformId: 'ec-001', platform: 'Shopify', storeName: 'Philippine Treasures PH', status: 'success', ordersSynced: 145, errorsCount: 0, syncedAt: ago(1) },
    { id: 'sync-002', platformId: 'ec-002', platform: 'Lazada', storeName: 'Manila Lifestyle Store', status: 'success', ordersSynced: 98, errorsCount: 2, syncedAt: ago(2) },
    { id: 'sync-003', platformId: 'ec-005', platform: 'WooCommerce', storeName: 'Davao Organic Market', status: 'success', ordersSynced: 42, errorsCount: 0, syncedAt: ago(3) },
    { id: 'sync-004', platformId: 'ec-003', platform: 'Shopee', storeName: 'Cebu Gadget Hub', status: 'success', ordersSynced: 76, errorsCount: 1, syncedAt: ago(4) },
    { id: 'sync-005', platformId: 'ec-001', platform: 'Shopify', storeName: 'Philippine Treasures PH', status: 'failed', ordersSynced: 0, errorsCount: 12, syncedAt: ago(8) },
    { id: 'sync-006', platformId: 'ec-005', platform: 'WooCommerce', storeName: 'Davao Organic Market', status: 'in_progress', ordersSynced: 18, errorsCount: 0, syncedAt: ago(0.5) },
    { id: 'sync-007', platformId: 'ec-004', platform: 'Amazon', storeName: 'GlobalExports PH', status: 'failed', ordersSynced: 0, errorsCount: 5, syncedAt: ago(72) },
  ],
  summary: { totalConnected: 4, totalDisconnected: 2, totalOrdersSynced: 36850, lastSyncAt: ago(1) },
}

const seedWhiteLabelPortal: WhiteLabelPortalData = {
  config: {
    brandName: 'TrackExpress',
    logoUrl: null,
    customDomain: 'track.yourcompany.com',
    primaryColor: '#2563eb',
    supportEmail: 'support@traackexpress.com',
    supportPhone: '+63 2 8888 7777',
    enabled: true,
    portalUrl: 'https://track.yourcompany.com',
  },
  stats: { activeSessions: 142, trackingQueriesToday: 3850, totalRegisteredCustomers: 12800, averageSatisfaction: 4.6 },
  recentTracking: [
    { id: 'wl-001', trackingNumber: 'LBC-2024-1001', customerName: 'Ricardo Dimagiba', status: 'IN_TRANSIT', carrier: 'LBC Express', timestamp: ago(1) },
    { id: 'wl-002', trackingNumber: 'DHL-PH-99123', customerName: 'ABC Trading Co.', status: 'DELIVERED', carrier: 'DHL Express', timestamp: ago(3) },
    { id: 'wl-003', trackingNumber: '2GO-2024-6001', customerName: 'Carmen Villanueva', status: 'OUT_FOR_DELIVERY', carrier: '2Go Logistics', timestamp: ago(5) },
    { id: 'wl-004', trackingNumber: 'FD-PH-78901', customerName: 'Fernando Reyes', status: 'PICKED_UP', carrier: 'Flash Delivery', timestamp: ago(8) },
    { id: 'wl-005', trackingNumber: 'LBC-2024-1008', customerName: 'Elena Martinez', status: 'IN_TRANSIT', carrier: 'LBC Express', timestamp: ago(12) },
  ],
}

const seedIotDashboard: IotSensorDashboard = {
  summary: { totalDevices: 48, activeDevices: 42, alertsToday: 7, avgBatteryLevel: 78, readingsToday: 15200 },
  devices: [
    { id: 'iot-001', deviceId: 'SHT-2401-001', model: 'Sensirion SHT40', active: true, batteryLevel: 85, assignedTracking: 'LBC-2024-1001', lastReading: ago(0.5) },
    { id: 'iot-002', deviceId: 'SHT-2401-002', model: 'Sensirion SHT40', active: true, batteryLevel: 72, assignedTracking: 'DHL-PH-99123', lastReading: ago(1) },
    { id: 'iot-003', deviceId: 'SHK-2401-001', model: 'ShockWatch RFID', active: true, batteryLevel: 91, assignedTracking: '2GO-2024-6001', lastReading: ago(0.25) },
    { id: 'iot-004', deviceId: 'SHT-2401-003', model: 'Sensirion SHT40', active: false, batteryLevel: 12, assignedTracking: null, lastReading: ago(360) },
    { id: 'iot-005', deviceId: 'LGT-2401-001', model: 'LiteSense LUX', active: true, batteryLevel: 65, assignedTracking: 'FD-PH-78901', lastReading: ago(2) },
    { id: 'iot-006', deviceId: 'SHT-2402-001', model: 'Sensirion SHT41', active: true, batteryLevel: 54, assignedTracking: 'LBC-2024-1008', lastReading: ago(0.75) },
    { id: 'iot-007', deviceId: 'SHK-2401-002', model: 'ShockWatch RFID', active: true, batteryLevel: 88, assignedTracking: 'JT-2024-3002', lastReading: ago(1.5) },
    { id: 'iot-008', deviceId: 'VIB-2401-001', model: 'VibraSense Pro', active: false, batteryLevel: 3, assignedTracking: null, lastReading: ago(720) },
  ],
  recentReadings: [
    { id: 'rd-001', deviceId: 'SHT-2401-001', type: 'TEMPERATURE', trackingNumber: 'LBC-2024-1001', value: 24.5, unit: '°C', thresholdMin: 2, thresholdMax: 30, status: 'NORMAL', recordedAt: ago(0.5) },
    { id: 'rd-002', deviceId: 'SHT-2401-002', type: 'TEMPERATURE', trackingNumber: 'DHL-PH-99123', value: 31.2, unit: '°C', thresholdMin: 2, thresholdMax: 30, status: 'WARNING', recordedAt: ago(1) },
    { id: 'rd-003', deviceId: 'SHK-2401-001', type: 'SHOCK', trackingNumber: '2GO-2024-6001', value: 45, unit: 'G', thresholdMin: 0, thresholdMax: 50, status: 'NORMAL', recordedAt: ago(0.25) },
    { id: 'rd-004', deviceId: 'SHT-2401-003', type: 'TEMPERATURE', trackingNumber: 'UNASSIGNED', value: 28.0, unit: '°C', thresholdMin: 2, thresholdMax: 30, status: 'NORMAL', recordedAt: ago(360) },
    { id: 'rd-005', deviceId: 'LGT-2401-001', type: 'LIGHT', trackingNumber: 'FD-PH-78901', value: 850, unit: 'lux', thresholdMin: 0, thresholdMax: 100, status: 'ALERT', recordedAt: ago(2) },
    { id: 'rd-006', deviceId: 'SHT-2402-001', type: 'HUMIDITY', trackingNumber: 'LBC-2024-1008', value: 68, unit: '%', thresholdMin: 20, thresholdMax: 80, status: 'NORMAL', recordedAt: ago(0.75) },
    { id: 'rd-007', deviceId: 'SHK-2401-002', type: 'SHOCK', trackingNumber: 'JT-2024-3002', value: 72, unit: 'G', thresholdMin: 0, thresholdMax: 50, status: 'ALERT', recordedAt: ago(1.5) },
    { id: 'rd-008', deviceId: 'VIB-2401-001', type: 'VIBRATION', trackingNumber: 'UNASSIGNED', value: 0.2, unit: 'mm/s', thresholdMin: 0, thresholdMax: 10, status: 'NORMAL', recordedAt: ago(720) },
    { id: 'rd-009', deviceId: 'SHT-2401-001', type: 'HUMIDITY', trackingNumber: 'LBC-2024-1001', value: 52, unit: '%', thresholdMin: 20, thresholdMax: 80, status: 'NORMAL', recordedAt: ago(0.75) },
    { id: 'rd-010', deviceId: 'LGT-2401-001', type: 'LIGHT', trackingNumber: 'FD-PH-78901', value: 120, unit: 'lux', thresholdMin: 0, thresholdMax: 100, status: 'ALERT', recordedAt: ago(3) },
  ],
}

const seedCarbonFootprint: CarbonFootprint = {
  summary: { totalEmissions: 28450, avgPerShipment: 38.2, totalShipments: 745, offsetCredits: 5000, netEmissions: 23450, vsLastMonth: -5.2 },
  byCarrier: [
    { carrierId: 'car-1', carrierName: 'GoGo Xpress', totalEmissions: 8250, shipmentCount: 180, avgPerShipment: 45.8, efficiency: 'average' },
    { carrierId: 'car-2', carrierName: 'LBC Express', totalEmissions: 6200, shipmentCount: 190, avgPerShipment: 32.6, efficiency: 'good' },
    { carrierId: 'car-3', carrierName: '2Go Logistics', totalEmissions: 5100, shipmentCount: 110, avgPerShipment: 46.4, efficiency: 'average' },
    { carrierId: 'car-4', carrierName: 'DHL Express', totalEmissions: 3200, shipmentCount: 95, avgPerShipment: 33.7, efficiency: 'good' },
    { carrierId: 'car-5', carrierName: 'FedEx', totalEmissions: 2850, shipmentCount: 80, avgPerShipment: 35.6, efficiency: 'good' },
    { carrierId: 'car-6', carrierName: 'Ninja Van', totalEmissions: 1850, shipmentCount: 50, avgPerShipment: 37.0, efficiency: 'average' },
    { carrierId: 'car-7', carrierName: 'Flash Express', totalEmissions: 1000, shipmentCount: 40, avgPerShipment: 25.0, efficiency: 'good' },
  ],
  byRegion: [
    { region: 'NCR', totalEmissions: 10200, shipmentCount: 280, avgPerShipment: 36.4 },
    { region: 'Luzon', totalEmissions: 7200, shipmentCount: 180, avgPerShipment: 40.0 },
    { region: 'Visayas', totalEmissions: 5800, shipmentCount: 155, avgPerShipment: 37.4 },
    { region: 'Mindanao', totalEmissions: 3800, shipmentCount: 90, avgPerShipment: 42.2 },
    { region: 'Remote', totalEmissions: 1450, shipmentCount: 40, avgPerShipment: 36.3 },
  ],
  monthlyTrend: [
    { month: 'Aug', emissions: 3100, shipments: 82 },
    { month: 'Sep', emissions: 3400, shipments: 88 },
    { month: 'Oct', emissions: 3750, shipments: 96 },
    { month: 'Nov', emissions: 4100, shipments: 105 },
    { month: 'Dec', emissions: 4500, shipments: 115 },
    { month: 'Jan', emissions: 4800, shipments: 122 },
    { month: 'Feb', emissions: 4600, shipments: 118 },
  ],
}

const seedDemandForecast: DemandForecast = {
  summary: { totalForecast: 84500, totalCapacity: 102000, utilizationRate: 82.8, nextMonthGrowth: 12.5 },
  byLane: [
    { lane: 'NCR-Luzon', origin: 'Manila', destination: 'Northern Luzon', currentVolume: 12000, forecastedVolume: 13800, growth: 15.0, confidence: 88 },
    { lane: 'NCR-Visayas', origin: 'Manila', destination: 'Cebu', currentVolume: 8500, forecastedVolume: 9600, growth: 12.9, confidence: 82 },
    { lane: 'NCR-Mindanao', origin: 'Manila', destination: 'Davao', currentVolume: 6200, forecastedVolume: 7100, growth: 14.5, confidence: 75 },
    { lane: 'Luzon-NCR', origin: 'Clark', destination: 'Manila', currentVolume: 9800, forecastedVolume: 10500, growth: 7.1, confidence: 90 },
    { lane: 'Visayas-NCR', origin: 'Cebu', destination: 'Manila', currentVolume: 5400, forecastedVolume: 5900, growth: 9.3, confidence: 78 },
    { lane: 'Mindanao-Luzon', origin: 'Davao', destination: 'Manila', currentVolume: 3200, forecastedVolume: 3800, growth: 18.8, confidence: 65 },
    { lane: 'NCR-Remote', origin: 'Manila', destination: 'Palawan', currentVolume: 2800, forecastedVolume: 3100, growth: 10.7, confidence: 70 },
    { lane: 'Luzon-Visayas', origin: 'Clark', destination: 'Cebu', currentVolume: 4100, forecastedVolume: 4700, growth: 14.6, confidence: 72 },
  ],
  byRegion: [
    { region: 'NCR', currentVolume: 29500, forecastedVolume: 33400, growth: 13.2 },
    { region: 'Luzon', currentVolume: 13900, forecastedVolume: 15200, growth: 9.4 },
    { region: 'Visayas', currentVolume: 12600, forecastedVolume: 14300, growth: 13.5 },
    { region: 'Mindanao', currentVolume: 9400, forecastedVolume: 10900, growth: 16.0 },
    { region: 'Remote', currentVolume: 3800, forecastedVolume: 4200, growth: 10.5 },
  ],
  monthlyForecast: [
    { month: 'Aug', volume: 68500, capacity: 82000 },
    { month: 'Sep', volume: 71200, capacity: 84000 },
    { month: 'Oct', volume: 73800, capacity: 86000 },
    { month: 'Nov', volume: 78200, capacity: 90000 },
    { month: 'Dec', volume: 84500, capacity: 102000 },
    { month: 'Jan', volume: 81000, capacity: 95000 },
    { month: 'Feb', volume: 76500, capacity: 88000 },
  ],
}

const seedCostAnalytics: CostAnalytics = {
  summary: { totalCost: 284750.50, totalRevenue: 421500.00, totalShipments: 71, avgCostPerShipment: 4010.57, avgRevenuePerShipment: 5936.62, profitMargin: 32.45 },
  byCarrier: [
    { carrierId: 'carrier-001', carrierName: 'LBC Express', totalCost: 89500.00, totalRevenue: 135000.00, shipmentCount: 22, avgCost: 4068.18 },
    { carrierId: 'carrier-002', carrierName: 'DHL Express', totalCost: 62300.00, totalRevenue: 98500.00, shipmentCount: 14, avgCost: 4450.00 },
    { carrierId: 'carrier-003', carrierName: 'J&T Express', totalCost: 41200.50, totalRevenue: 62000.00, shipmentCount: 12, avgCost: 3433.38 },
    { carrierId: 'carrier-004', carrierName: '2Go Logistics', totalCost: 35400.00, totalRevenue: 52000.00, shipmentCount: 9, avgCost: 3933.33 },
    { carrierId: 'carrier-005', carrierName: 'GoGo Xpress', totalCost: 28600.00, totalRevenue: 38000.00, shipmentCount: 7, avgCost: 4085.71 },
    { carrierId: 'carrier-006', carrierName: 'Flash Delivery', totalCost: 18750.00, totalRevenue: 24000.00, shipmentCount: 4, avgCost: 4687.50 },
    { carrierId: 'carrier-007', carrierName: 'Ninja Van', totalCost: 9000.00, totalRevenue: 12000.00, shipmentCount: 3, avgCost: 3000.00 },
  ],
  byRegion: [
    { region: 'NCR', totalCost: 98500.00, totalRevenue: 148000.00, shipmentCount: 25 },
    { region: 'Luzon', totalCost: 72450.00, totalRevenue: 108000.00, shipmentCount: 18 },
    { region: 'Visayas', totalCost: 56800.50, totalRevenue: 82500.00, shipmentCount: 14 },
    { region: 'Mindanao', totalCost: 45000.00, totalRevenue: 63000.00, shipmentCount: 10 },
    { region: 'Remote', totalCost: 12000.00, totalRevenue: 20000.00, shipmentCount: 4 },
  ],
  byStatus: [
    { status: 'DELIVERED', totalCost: 152300.00, shipmentCount: 38 },
    { status: 'IN_TRANSIT', totalCost: 53450.00, shipmentCount: 12 },
    { status: 'CREATED', totalCost: 22100.00, shipmentCount: 6 },
    { status: 'OUT_FOR_DELIVERY', totalCost: 19800.50, shipmentCount: 5 },
    { status: 'FAILED_DELIVERY', totalCost: 15600.00, shipmentCount: 4 },
    { status: 'RETURNED', totalCost: 12500.00, shipmentCount: 3 },
    { status: 'CANCELLED', totalCost: 9000.00, shipmentCount: 3 },
  ],
  monthlyTrend: [
    { month: 'Jan', cost: 42500.00, revenue: 62000.00, count: 10 },
    { month: 'Feb', cost: 38200.00, revenue: 57500.00, count: 9 },
    { month: 'Mar', cost: 45100.00, revenue: 68000.00, count: 11 },
    { month: 'Apr', cost: 39800.50, revenue: 59000.00, count: 10 },
    { month: 'May', cost: 43200.00, revenue: 63500.00, count: 11 },
    { month: 'Jun', cost: 36750.00, revenue: 55500.00, count: 8 },
    { month: 'Jul', cost: 39200.00, revenue: 58000.00, count: 9 },
    { month: 'Aug', cost: 0, revenue: 0, count: 0 },
  ],
}

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
  'customs-shipments': seedCustomsShipments,
  'cod-payments': seedCodPayments,
  'bi-integrations': seedBiIntegrations,
  'tracking/aggregated': seedAggregatedTracking,
  webhooks: seedWebhooks,
  attachments: seedAttachments,
  'driver-assignments': seedDriverAssignments,
  'driver-scans': seedDriverScans,
}

let dbSettings: AppSettings = { ...seedSettings }

export function installMockInterceptor(api: AxiosInstance) {
  api.interceptors.request.use(async (config: any) => {
    let url: string = (config.url || '').replace(/^\/api(?:\/v1)?/, '') || '/'
    const { method } = config

    function mock(data: any, status = 200) {
      config.adapter = () => Promise.resolve({ data, status, statusText: 'OK', headers: { 'content-type': 'application/json' }, config })
    }

    if (url.includes('/auth/login') || url.includes('/auth/me') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
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
    if (method === 'get' && key === 'gps/waybills') {
      mock(seedWaybills.filter(w => !['DELIVERED', 'RETURNED', 'CANCELLED'].includes(w.status)).map((w, i) => ({
        id: w.id,
        trackingNumber: w.trackingNumber,
        recipientName: w.recipientName,
        status: w.status,
        origin: w.origin,
        destination: w.destination,
        lastLocation: 'Mock GPS',
        latitude: 14.5 + Math.sin(i) * 2,
        longitude: 121.0 + Math.cos(i) * 2,
        recordedAt: ago(0.1),
        slaBreached: w.slaBreached,
      })))
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
    if (method === 'post' && url === '/gps/location') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {})
      mock({ id: uid(), waybillId: body.waybillId, latitude: body.latitude, longitude: body.longitude, speed: body.speed, heading: body.heading, recordedAt: new Date().toISOString() })
      return config
    }
    if (method === 'post' && url === '/waybills/import') {
      const file = config.data?.get?.('file') as File | undefined
      let created = 0
      if (file && typeof file.text === 'function') {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
        created = Math.max(0, lines.length - 1)
      }
      mock({ created, failed: 0, errors: [] })
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
    if (method === 'get' && key === 'analytics/cost-per-shipment') {
      mock(seedCostAnalytics)
      return config
    }
    if (method === 'get' && key === 'analytics/demand-forecast') {
      mock(seedDemandForecast)
      return config
    }
    if (method === 'get' && key === 'analytics/carbon-footprint') {
      mock(seedCarbonFootprint)
      return config
    }
    if (method === 'get' && key === 'integrations/ecommerce') {
      mock(seedECommerceDashboard)
      return config
    }
    if (method === 'get' && key === 'integrations/white-label') {
      mock(seedWhiteLabelPortal)
      return config
    }
    if (method === 'get' && key === 'integrations/iot-sensors') {
      mock(seedIotDashboard)
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

    // Pass real-backend resources through without mocking
    const realBackendKeys = ['waybills', 'users', 'teams', 'scan_events', 'audit-logs']
    if (realBackendKeys.includes(key) || realBackendKeys.includes(collKey)) {
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

    if (method === 'post' && collKey === 'cod-payments' && url.includes('/settle') && db[collKey]) {
      const idx = db[collKey].findIndex((x: any) => x.id === itemId)
      if (idx >= 0) { db[collKey][idx] = { ...db[collKey][idx], status: 'SETTLED', settledAt: new Date().toISOString() }; mock(db[collKey][idx]) }
      return config
    }
    if (method === 'post' && collKey === 'cod-payments' && url.includes('/dispute') && db[collKey]) {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {})
      const idx = db[collKey].findIndex((x: any) => x.id === itemId)
      if (idx >= 0) { db[collKey][idx] = { ...db[collKey][idx], status: 'DISPUTED', disputeReason: body.reason || 'Flagged for dispute' }; mock(db[collKey][idx]) }
      return config
    }
    if (method === 'post' && collKey === 'cod-payments' && url.includes('/refund') && db[collKey]) {
      const idx = db[collKey].findIndex((x: any) => x.id === itemId)
      if (idx >= 0) { db[collKey][idx] = { ...db[collKey][idx], status: 'REFUNDED', notes: 'Refunded' }; mock(db[collKey][idx]) }
      return config
    }
    if (method === 'post' || method === 'put' || method === 'patch') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {})
      const now = new Date().toISOString()

      if (idMatch && realBackendKeys.includes(collKey)) {
        return config
      }

      if (key && realBackendKeys.includes(key)) {
        return config
      }

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
}
