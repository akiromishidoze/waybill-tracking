const http = require('http')

let nextUserId = 5
let nextCarrierId = 4
let nextWbId = 6

const CARRIERS = [
  { id: 'c1', name: 'FastDeliver Logistics', apiEndpoint: 'https://api.fastdeliver.com/v1/track', apiKey: 'sk_fd_****', isActive: true, trackingUrlTemplate: 'https://fastdeliver.com/track/{{number}}', createdAt: new Date(Date.now() - 864000000).toISOString() },
  { id: 'c2', name: 'SpeedShip Express', apiEndpoint: 'https://api.speedship.io/v2/tracking', apiKey: 'sk_ss_****', isActive: true, trackingUrlTemplate: 'https://speedship.io/track/{{number}}', createdAt: new Date(Date.now() - 432000000).toISOString() },
  { id: 'c3', name: 'QuickCourier PH', apiEndpoint: 'https://api.quickcourier.ph/v1', apiKey: 'sk_qc_****', isActive: false, trackingUrlTemplate: 'https://quickcourier.ph/tracking/{{number}}', createdAt: new Date(Date.now() - 216000000).toISOString() },
]

const CARRIER_EVENTS = {
  wb1: [
    { id: 'ce1', carrierId: 'c1', carrierName: 'FastDeliver Logistics', waybillId: 'wb1', status: 'Picked Up', location: 'Quezon City Hub', timestamp: new Date(Date.now() - 345600000).toISOString(), remark: 'Package scanned at origin hub' },
    { id: 'ce2', carrierId: 'c1', carrierName: 'FastDeliver Logistics', waybillId: 'wb1', status: 'In Transit', location: 'Manila Sorting Center', timestamp: new Date(Date.now() - 259200000).toISOString(), remark: 'Arrived at Manila sorting center' },
    { id: 'ce3', carrierId: 'c1', carrierName: 'FastDeliver Logistics', waybillId: 'wb1', status: 'Out for Delivery', location: 'Makati City', timestamp: new Date(Date.now() - 172800000).toISOString(), remark: 'With delivery courier' },
    { id: 'ce4', carrierId: 'c1', carrierName: 'FastDeliver Logistics', waybillId: 'wb1', status: 'Delivered', location: '123 Main St, Manila', timestamp: new Date(Date.now() - 172800000).toISOString(), remark: 'Delivered and signed for' },
  ],
  wb2: [
    { id: 'ce5', carrierId: 'c2', carrierName: 'SpeedShip Express', waybillId: 'wb2', status: 'Collected', location: 'Quezon City', timestamp: new Date(Date.now() - 172800000).toISOString(), remark: 'Package collected from shipper' },
    { id: 'ce6', carrierId: 'c2', carrierName: 'SpeedShip Express', waybillId: 'wb2', status: 'Departed', location: 'Manila Hub', timestamp: new Date(Date.now() - 86400000).toISOString(), remark: 'Departed for Cebu' },
  ],
  wb5: [
    { id: 'ce7', carrierId: 'c1', carrierName: 'FastDeliver Logistics', waybillId: 'wb5', status: 'Picked Up', location: 'Manila Warehouse', timestamp: new Date(Date.now() - 86400000).toISOString(), remark: 'Picked up from warehouse' },
    { id: 'ce8', carrierId: 'c1', carrierName: 'FastDeliver Logistics', waybillId: 'wb5', status: 'In Transit', location: 'Manila Hub', timestamp: new Date(Date.now() - 43200000).toISOString(), remark: 'Processed at hub' },
  ],
}

const USERS = [
  { id: 'u1', email: 'admin', name: 'Admin User', role: 'ADMIN', company: 'Waybill Corp' },
  { id: 'u2', email: 'shipper@acme.com', name: 'John Shipper', role: 'SHIPPER', company: 'ACME Inc' },
  { id: 'u3', email: 'courier@fastdeliver.com', name: 'Jane Courier', role: 'COURIER', company: 'Fast Deliver Co' },
  { id: 'u4', email: 'ops@waybill.com', name: 'Ops Manager', role: 'OPS', company: 'Waybill Corp' },
]

let WAYBILLS = [
  {
    id: 'wb1', trackingNumber: 'WBT-2024-00001', shipperId: 'u2', shipperName: 'ACME Inc',
    recipientName: 'Alice Johnson', recipientAddress: '123 Main St, Manila', recipientPhone: '+63 912 345 6789',
    origin: 'Quezon City', destination: 'Makati City', weight: 2.5, dimensions: '30x20x15 cm',
    serviceType: 'EXPRESS', status: 'DELIVERED', carrierId: 'c1', carrierName: 'FastDeliver Logistics', carrierTrackingNumber: 'FD-847291',
    estimatedDelivery: new Date(Date.now() - 172800000).toISOString(),
    actualDelivery: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    events: [
      { id: 'e1', waybillId: 'wb1', status: 'CREATED', location: 'Quezon City', timestamp: new Date(Date.now() - 432000000).toISOString(), eventType: 'MILESTONE' },
      { id: 'e2', waybillId: 'wb1', status: 'PICKED_UP', location: 'Quezon City', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date(Date.now() - 345600000).toISOString(), eventType: 'MILESTONE', remark: 'Package collected from shipper' },
      { id: 'e3', waybillId: 'wb1', status: 'AT_SORTING_CENTER', location: 'Manila Hub', timestamp: new Date(Date.now() - 259200000).toISOString(), eventType: 'SCAN', remark: 'Arrived at Manila sorting facility' },
      { id: 'e4', waybillId: 'wb1', status: 'OUT_FOR_DELIVERY', location: 'Makati City', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date(Date.now() - 172800000).toISOString(), eventType: 'MILESTONE', remark: 'With delivery courier' },
      { id: 'e5', waybillId: 'wb1', status: 'DELIVERED', location: 'Makati City', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date(Date.now() - 172800000).toISOString(), eventType: 'MILESTONE', remark: 'Left at reception desk' },
    ],
  },
  {
    id: 'wb2', trackingNumber: 'WBT-2024-00002', shipperId: 'u2', shipperName: 'ACME Inc',
    recipientName: 'Bob Smith', recipientAddress: '456 Elm St, Cebu City', recipientPhone: '+63 923 456 7890',
    origin: 'Quezon City', destination: 'Cebu City', weight: 5.0, dimensions: '40x30x20 cm',
    serviceType: 'STANDARD', status: 'IN_TRANSIT', carrierId: 'c2', carrierName: 'SpeedShip Express', carrierTrackingNumber: 'SS-563902',
    estimatedDelivery: new Date(Date.now() + 172800000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    events: [
      { id: 'e6', waybillId: 'wb2', status: 'CREATED', location: 'Quezon City', timestamp: new Date(Date.now() - 259200000).toISOString(), eventType: 'MILESTONE' },
      { id: 'e7', waybillId: 'wb2', status: 'PICKED_UP', location: 'Quezon City', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date(Date.now() - 172800000).toISOString(), eventType: 'MILESTONE', remark: 'Pickup completed' },
      { id: 'e8', waybillId: 'wb2', status: 'IN_TRANSIT', location: 'En Route to Cebu', timestamp: new Date(Date.now() - 86400000).toISOString(), eventType: 'MILESTONE', remark: 'Departed Manila hub' },
    ],
  },
  {
    id: 'wb3', trackingNumber: 'WBT-2024-00003', shipperId: 'u2', shipperName: 'ACME Inc',
    recipientName: 'Carol Santos', recipientAddress: '789 Oak Ave, Davao City', recipientPhone: '+63 934 567 8901',
    origin: 'Makati City', destination: 'Davao City', weight: 10.0, dimensions: '50x40x30 cm',
    serviceType: 'STANDARD', status: 'PICKED_UP',
    estimatedDelivery: new Date(Date.now() + 345600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    events: [
      { id: 'e9', waybillId: 'wb3', status: 'CREATED', location: 'Makati City', timestamp: new Date(Date.now() - 86400000).toISOString(), eventType: 'MILESTONE' },
      { id: 'e10', waybillId: 'wb3', status: 'PICKED_UP', location: 'Makati City', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date().toISOString(), eventType: 'MILESTONE', remark: 'Package picked up' },
    ],
  },
  {
    id: 'wb4', trackingNumber: 'WBT-2024-00004', shipperId: 'u2', shipperName: 'ACME Inc',
    recipientName: 'David Reyes', recipientAddress: '321 Pine Rd, BGC, Taguig', recipientPhone: '+63 945 678 9012',
    origin: 'Quezon City', destination: 'Taguig City', weight: 1.2, dimensions: '20x15x10 cm',
    serviceType: 'EXPRESS', status: 'FAILED_DELIVERY',
    estimatedDelivery: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 21600000).toISOString(),
    events: [
      { id: 'e11', waybillId: 'wb4', status: 'CREATED', location: 'Quezon City', timestamp: new Date(Date.now() - 172800000).toISOString(), eventType: 'MILESTONE' },
      { id: 'e12', waybillId: 'wb4', status: 'PICKED_UP', location: 'Quezon City', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date(Date.now() - 86400000).toISOString(), eventType: 'MILESTONE', remark: 'Express pickup' },
      { id: 'e13', waybillId: 'wb4', status: 'FAILED_DELIVERY', location: 'Taguig City', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date(Date.now() - 21600000).toISOString(), eventType: 'EXCEPTION', exceptionCode: 'CUSTOMER_NOT_AVAILABLE', exceptionDetail: 'Recipient not home, no answer at door', remark: 'Will attempt redelivery tomorrow' },
    ],
  },
  {
    id: 'wb5', trackingNumber: 'WBT-2024-00005', shipperId: 'u2', shipperName: 'ACME Inc',
    recipientName: 'Elena Cruz', recipientAddress: '654 Acacia St, Iloilo City', recipientPhone: '+63 956 789 0123',
    origin: 'Manila', destination: 'Iloilo City', weight: 8.0, dimensions: '45x35x25 cm',
    serviceType: 'STANDARD', status: 'OUT_FOR_DELIVERY', carrierId: 'c1', carrierName: 'FastDeliver Logistics', carrierTrackingNumber: 'FD-918273',
    estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    events: [
      { id: 'e14', waybillId: 'wb5', status: 'CREATED', location: 'Manila', timestamp: new Date(Date.now() - 172800000).toISOString(), eventType: 'MILESTONE' },
      { id: 'e15', waybillId: 'wb5', status: 'PICKED_UP', location: 'Manila', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date(Date.now() - 86400000).toISOString(), eventType: 'MILESTONE', remark: 'Pickup from ACME warehouse' },
      { id: 'e16', waybillId: 'wb5', status: 'AT_SORTING_CENTER', location: 'Manila Hub', timestamp: new Date(Date.now() - 43200000).toISOString(), eventType: 'SCAN', remark: 'Processed at Manila sorting center' },
      { id: 'e17', waybillId: 'wb5', status: 'OUT_FOR_DELIVERY', location: 'Iloilo City', courierId: 'u3', courierName: 'Jane Courier', timestamp: new Date(Date.now() - 7200000).toISOString(), eventType: 'MILESTONE', remark: 'Out for final delivery' },
    ],
  },
]

const EXCEPTION_CODES = [
  { code: 'DELAY', label: 'Delivery Delayed', description: 'Shipment delayed beyond estimated delivery date' },
  { code: 'DAMAGE', label: 'Package Damaged', description: 'Package found damaged during transit or delivery' },
  { code: 'WRONG_ADDRESS', label: 'Wrong Address', description: 'Recipient address is incorrect or incomplete' },
  { code: 'CUSTOMER_NOT_AVAILABLE', label: 'Customer Not Available', description: 'Recipient not present at delivery location' },
  { code: 'ADDRESS_NOT_FOUND', label: 'Address Not Found', description: 'Delivery address could not be located' },
  { code: 'REFUSED', label: 'Refused by Recipient', description: 'Recipient refused to accept the package' },
  { code: 'LOST', label: 'Lost in Transit', description: 'Package missing and cannot be located' },
  { code: 'WEATHER_DELAY', label: 'Weather Delay', description: 'Delay caused by adverse weather conditions' },
  { code: 'CUSTOMS_HOLD', label: 'Customs Hold', description: 'Package held by customs for inspection' },
  { code: 'INSUFFICIENT_ADDRESS', label: 'Insufficient Address', description: 'Address details insufficient for delivery' },
  { code: 'NO_RESPONSE', label: 'No Response', description: 'No response after multiple attempts' },
  { code: 'WRONG_PACKAGE', label: 'Wrong Package', description: 'Incorrect package delivered to recipient' },
  { code: 'OTHER', label: 'Other Exception', description: 'Other exception not covered by specific codes' },
]

const AUDIT_LOGS = [
  { id: 'a1', userId: 'u1', userName: 'Admin User', userRole: 'ADMIN', action: 'USER_LOGIN', resourceType: 'session', resourceId: 'u1', details: 'Admin User logged in', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 60000).toISOString() },
  { id: 'a2', userId: 'u1', userName: 'Admin User', userRole: 'ADMIN', action: 'USER_VIEW', resourceType: 'user_list', resourceId: '', details: 'Viewed all users', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'a3', userId: 'u1', userName: 'Admin User', userRole: 'ADMIN', action: 'ROLE_CHANGE', resourceType: 'user', resourceId: 'u2', details: 'Changed John Shipper role to OPS', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 180000).toISOString() },
  { id: 'a4', userId: 'u1', userName: 'Admin User', userRole: 'ADMIN', action: 'WAYBILL_VIEW', resourceType: 'waybill', resourceId: 'wb1', details: 'Viewed waybill WBT-2024-00001', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 240000).toISOString() },
  { id: 'a5', userId: 'u2', userName: 'John Shipper', userRole: 'SHIPPER', action: 'WAYBILL_CREATE', resourceType: 'waybill', resourceId: 'wb5', details: 'Created waybill WBT-2024-00005', ipAddress: '192.168.1.2', createdAt: new Date(Date.now() - 360000).toISOString() },
  { id: 'a6', userId: 'u3', userName: 'Jane Courier', userRole: 'COURIER', action: 'STATUS_UPDATE', resourceType: 'waybill', resourceId: 'wb1', details: 'Updated status to OUT_FOR_DELIVERY on WBT-2024-00001', ipAddress: '192.168.1.3', createdAt: new Date(Date.now() - 720000).toISOString() },
  { id: 'a7', userId: 'u3', userName: 'Jane Courier', userRole: 'COURIER', action: 'STATUS_UPDATE', resourceType: 'waybill', resourceId: 'wb4', details: 'Updated status to FAILED_DELIVERY (CUSTOMER_NOT_AVAILABLE) on WBT-2024-00004', ipAddress: '192.168.1.3', createdAt: new Date(Date.now() - 900000).toISOString() },
  { id: 'a8', userId: 'u1', userName: 'Admin User', userRole: 'ADMIN', action: 'EXCEPTION_CODE_VIEW', resourceType: 'exception_codes', resourceId: '', details: 'Listed exception codes', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'a9', userId: 'u4', userName: 'Ops Manager', userRole: 'OPS', action: 'REPORT_EXPORT', resourceType: 'report', resourceId: '', details: 'Exported waybill report (2024-01-01 to 2024-12-31)', ipAddress: '192.168.1.4', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a10', userId: 'u1', userName: 'Admin User', userRole: 'ADMIN', action: 'DASHBOARD_VIEW', resourceType: 'dashboard', resourceId: '', details: 'Viewed KPI dashboard', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 7200000).toISOString() },
]

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname
  const authHeader = req.headers['authorization'] || ''

  const parseBody = () => new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => body += chunk)
    req.on('end', () => resolve(body ? JSON.parse(body) : {}))
  })

  const send = (status, data) => {
    res.writeHead(status)
    res.end(JSON.stringify(data))
  }

  const jwtFromHeader = () => {
    if (req.method === 'OPTIONS') return { sub: 'u1', role: 'ADMIN' }
    if (!authHeader.startsWith('Bearer ')) return null
    try {
      const b64 = authHeader.split('.')[1]
      return JSON.parse(Buffer.from(b64, 'base64url').toString())
    } catch {
      return { sub: 'u1', role: 'ADMIN' }
    }
  }

  const requireAuth = () => {
    const claims = jwtFromHeader()
    if (!claims) {
      send(401, { error: 'missing authorization header' })
      return null
    }
    return claims
  }

  const requireAdmin = () => {
    const claims = requireAuth()
    if (!claims) return null
    if (claims.role !== 'ADMIN') { send(403, { error: 'insufficient permissions' }); return null }
    return claims
  }

  const VALID_ROLES = ['SHIPPER', 'COURIER', 'OPS', 'ADMIN']

  // --- Auth routes ---
  if (path === '/api/auth/login' && req.method === 'POST') {
    parseBody().then(({ email, password }) => {
      const user = USERS.find(u => u.email === email)
      if (!user || password !== 'admin') {
        send(401, { error: 'invalid credentials' })
        return
      }
      const header = { alg: 'HS256', typ: 'JWT' }
      const payload = { sub: user.id, email: user.email, role: user.role, exp: Date.now() + 86400000 }
      const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
      const token = `${b64(header)}.${b64(payload)}.fake-signature`
      send(200, { accessToken: token, user })
    })
    return
  }

  if (path === '/api/auth/me' && req.method === 'GET') {
    const claims = requireAuth()
    if (!claims) return
    const user = USERS.find(u => u.id === claims.sub)
    send(200, user || USERS[0])
    return
  }

  // --- Users CRUD ---
  if (path === '/api/users' && req.method === 'GET') {
    const claims = requireAdmin()
    if (!claims) return
    send(200, USERS)
    return
  }

  if (path === '/api/users' && req.method === 'POST') {
    const claims = requireAdmin()
    if (!claims) return
    parseBody().then((body) => {
      if (!body.email || !body.name || !body.role) {
        send(400, { error: 'email, name, and role are required' })
        return
      }
      if (!VALID_ROLES.includes(body.role)) { send(400, { error: 'invalid role' }); return }
      if (USERS.find(u => u.email === body.email)) { send(409, { error: 'email already exists' }); return }
      const newUser = { id: 'u' + nextUserId++, email: body.email, name: body.name, role: body.role, company: body.company || '' }
      USERS.push(newUser)
      send(201, newUser)
    })
    return
  }

  const userByIdMatch = path.match(/^\/api\/users\/([^/]+)$/)
  if (userByIdMatch) {
    const userId = userByIdMatch[1]
    const userIdx = USERS.findIndex(u => u.id === userId)

    if (req.method === 'PATCH') {
      const claims = requireAdmin()
      if (!claims) return
      if (userIdx === -1) { send(404, { error: 'user not found' }); return }
      parseBody().then((body) => {
        if (body.role && !VALID_ROLES.includes(body.role)) { send(400, { error: 'invalid role' }); return }
        if (body.email) USERS[userIdx].email = body.email
        if (body.name) USERS[userIdx].name = body.name
        if (body.role) USERS[userIdx].role = body.role
        if (body.company !== undefined) USERS[userIdx].company = body.company
        send(200, USERS[userIdx])
      })
      return
    }

    if (req.method === 'DELETE') {
      const claims = requireAdmin()
      if (!claims) return
      if (userIdx === -1) { send(404, { error: 'user not found' }); return }
      if (userId === 'u1') { send(400, { error: 'cannot delete the primary admin' }); return }
      USERS.splice(userIdx, 1)
      send(200, { message: 'user deleted' })
      return
    }
  }

  // --- Waybill routes ---
  if (path === '/api/waybills' && req.method === 'GET') {
    const claims = requireAuth()
    if (!claims) return
    const now = Date.now()
    const result = WAYBILLS.map(w => ({ ...w, slaBreached: w.status !== 'DELIVERED' && w.status !== 'CANCELLED' && new Date(w.estimatedDelivery).getTime() < now }))
    send(200, result)
    return
  }

  const wbMatch = path.match(/^\/api\/waybills\/([^/]+)$/)
  if (wbMatch && req.method === 'GET') {
    const wb = { ...WAYBILLS.find(w => w.id === wbMatch[1]) }
    if (!wb) { send(404, { error: 'waybill not found' }); return }
    wb.carrierEvents = CARRIER_EVENTS[wb.id] || []
    const now = Date.now()
    wb.slaBreached = wb.status !== 'DELIVERED' && wb.status !== 'CANCELLED' && new Date(wb.estimatedDelivery).getTime() < now
    send(200, wb)
    return
  }

  if (path === '/api/exception-codes' && req.method === 'GET') {
    send(200, EXCEPTION_CODES)
    return
  }

  const trackMatch = path.match(/^\/api\/track\/(.+)$/)
  if (trackMatch && req.method === 'GET') {
    const tn = trackMatch[1]
    const wb = WAYBILLS.find(w => w.trackingNumber === tn || w.carrierTrackingNumber === tn)
    if (!wb) { send(404, { error: 'tracking number not found' }); return }
    send(200, wb)
    return
  }

  // --- Analytics ---
  if (path === '/api/analytics/stats' && req.method === 'GET') {
    send(200, { totalActive: 3, deliveredToday: 1, inTransit: 1, pendingPickup: 0, totalVolume: 5, slaCompliance: 80.0, exceptionRate: 20.0, avgTransitTime: 72 })
    return
  }

  if (path === '/api/analytics/sla' && req.method === 'GET') {
    send(200, [
      { date: '2024-06-10', total: 2, onTime: 2, sla: 100 },
      { date: '2024-06-11', total: 1, onTime: 1, sla: 100 },
      { date: '2024-06-12', total: 1, onTime: 0, sla: 0 },
      { date: '2024-06-13', total: 1, onTime: 1, sla: 100 },
    ])
    return
  }

  // --- Carriers CRUD ---
  if (path === '/api/carriers' && req.method === 'GET') {
    if (!requireAdmin()) return
    send(200, CARRIERS)
    return
  }

  if (path === '/api/carriers' && req.method === 'POST') {
    if (!requireAdmin()) return
    parseBody().then((body) => {
      if (!body.name) { send(400, { error: 'name is required' }); return }
      const newCarrier = {
        id: 'c' + nextCarrierId++,
        name: body.name,
        apiEndpoint: body.apiEndpoint || '',
        apiKey: body.apiKey || '',
        isActive: body.isActive !== false,
        trackingUrlTemplate: body.trackingUrlTemplate || '',
        createdAt: new Date().toISOString(),
      }
      CARRIERS.push(newCarrier)
      send(201, newCarrier)
    })
    return
  }

  const carrierByIdMatch = path.match(/^\/api\/carriers\/([^/]+)$/)
  if (carrierByIdMatch) {
    const carrierId = carrierByIdMatch[1]
    const idx = CARRIERS.findIndex(c => c.id === carrierId)

    if (req.method === 'PATCH') {
      if (!requireAdmin()) return
      if (idx === -1) { send(404, { error: 'carrier not found' }); return }
      parseBody().then((body) => {
        if (body.name !== undefined) CARRIERS[idx].name = body.name
        if (body.apiEndpoint !== undefined) CARRIERS[idx].apiEndpoint = body.apiEndpoint
        if (body.apiKey !== undefined) CARRIERS[idx].apiKey = body.apiKey
        if (body.isActive !== undefined) CARRIERS[idx].isActive = body.isActive
        if (body.trackingUrlTemplate !== undefined) CARRIERS[idx].trackingUrlTemplate = body.trackingUrlTemplate
        send(200, CARRIERS[idx])
      })
      return
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin()) return
      if (idx === -1) { send(404, { error: 'carrier not found' }); return }
      CARRIERS.splice(idx, 1)
      send(200, { message: 'carrier deleted' })
      return
    }
  }

  // --- Carrier Events for a waybill ---
  const carrierEventsMatch = path.match(/^\/api\/carriers\/events\/([^/]+)$/)
  if (carrierEventsMatch && req.method === 'GET') {
    const claims = requireAuth()
    if (!claims) return
    const events = CARRIER_EVENTS[carrierEventsMatch[1]] || []
    send(200, events)
    return
  }

  // --- Aggregated Multi-Carrier Tracking ---
  if (path === '/api/tracking/aggregated' && req.method === 'GET') {
    const claims = requireAuth()
    if (!claims) return
    const aggregated = WAYBILLS
      .filter(w => w.carrierId)
      .map(w => {
        const events = CARRIER_EVENTS[w.id] || []
        return {
          waybillId: w.id,
          trackingNumber: w.trackingNumber,
          carrierTrackingNumber: w.carrierTrackingNumber,
          carrierId: w.carrierId,
          carrierName: w.carrierName,
          status: w.status,
          destination: w.destination,
          recipientName: w.recipientName,
          lastCarrierEvent: events.length ? events[events.length - 1] : null,
          carrierEventCount: events.length,
        }
      })
    send(200, aggregated)
    return
  }

  // --- Assign/Update/Remove carrier on a waybill ---
  const aggregatedByIdMatch = path.match(/^\/api\/tracking\/aggregated\/([^/]+)$/)
  if (aggregatedByIdMatch) {
    const wbId = aggregatedByIdMatch[1]
    const wbIdx = WAYBILLS.findIndex(w => w.id === wbId)

    if (req.method === 'POST') {
      const claims = requireAuth()
      if (!claims) return
      parseBody().then((body) => {
        if (wbIdx === -1) { send(404, { error: 'waybill not found' }); return }
        const carrier = CARRIERS.find(c => c.id === body.carrierId)
        if (!carrier) { send(400, { error: 'carrier not found' }); return }
        if (!body.carrierTrackingNumber) { send(400, { error: 'carrierTrackingNumber is required' }); return }
        WAYBILLS[wbIdx].carrierId = body.carrierId
        WAYBILLS[wbIdx].carrierName = carrier.name
        WAYBILLS[wbIdx].carrierTrackingNumber = body.carrierTrackingNumber
        CARRIER_EVENTS[wbId] = CARRIER_EVENTS[wbId] || []
        send(200, { message: 'carrier assigned', waybill: WAYBILLS[wbIdx] })
      })
      return
    }

    if (req.method === 'DELETE') {
      const claims = requireAuth()
      if (!claims) return
      if (wbIdx === -1) { send(404, { error: 'waybill not found' }); return }
      delete WAYBILLS[wbIdx].carrierId
      delete WAYBILLS[wbIdx].carrierName
      delete WAYBILLS[wbIdx].carrierTrackingNumber
      delete CARRIER_EVENTS[wbId]
      send(200, { message: 'carrier unassigned' })
      return
    }
  }

  // --- Audit Logs ---
  if (path === '/api/audit-logs' && req.method === 'GET') {
    if (!requireAdmin()) return
    send(200, AUDIT_LOGS)
    return
  }

  send(404, { error: 'not found' })
})

server.listen(8080, () => {
  console.log('Mock API running on http://localhost:8080')
})
