const http = require('http')

let nextUserId = 5
let nextCarrierId = 4
let nextWbId = 6
let nextTeamId = 2
let nextAttachmentId = 1

const USER_PASSWORDS = {
  'u1': 'admin',
  'u2': 'admin',
  'u3': 'admin',
  'u4': 'admin',
}

const APP_SETTINGS = {
  companyName: 'WaybillTrack',
  timezone: 'Asia/Manila',
  sessionTimeout: 60,
  emailNotifications: true,
  defaultServiceType: 'STANDARD',
  logoUrl: '',
}

const TEAMS = [
  { id: 't1', name: 'Manila Hub', description: 'Manila city operations', color: '#2563eb' },
]

const WEBHOOK_EVENTS = ['status.updated', 'waybill.created', 'waybill.delivered', 'exception.raised']
let nextWebhookId = 2
const WEBHOOKS = [
  { id: 'wh1', name: 'Slack Notifier', url: 'https://hooks.slack.com/services/xxx/yyy/zzz', events: ['status.updated', 'exception.raised'], isActive: true, secret: 'whsec_abc123', createdAt: new Date(Date.now() - 864000000).toISOString() },
]

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
  { id: 'u1', email: 'Admin', name: 'Admin User', role: 'ADMIN', company: 'Waybill Corp' },
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
    serviceType: 'EXPRESS', status: 'FAILED_DELIVERY', teamId: 't1', teamName: 'Manila Hub',
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
    serviceType: 'STANDARD', status: 'OUT_FOR_DELIVERY', carrierId: 'c1', carrierName: 'FastDeliver Logistics', carrierTrackingNumber: 'FD-918273', teamId: 't1', teamName: 'Manila Hub',
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

const ATTACHMENTS = {}

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
      const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
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

  // --- Password Reset ---
  if (path === '/api/auth/reset-password' && req.method === 'POST') {
    const claims = requireAdmin()
    if (!claims) return
    parseBody().then(({ userId, newPassword }) => {
      if (!userId || !newPassword) { send(400, { error: 'userId and newPassword are required' }); return }
      if (newPassword.length < 4) { send(400, { error: 'password must be at least 4 characters' }); return }
      const user = USERS.find(u => u.id === userId)
      if (!user) { send(404, { error: 'user not found' }); return }
      USER_PASSWORDS[userId] = newPassword
      send(200, { message: 'password updated successfully for ' + user.name })
    })
    return
  }

  // --- App Settings ---
  if (path === '/api/settings' && req.method === 'GET') {
    if (!requireAdmin()) return
    send(200, APP_SETTINGS)
    return
  }

  if (path === '/api/settings' && req.method === 'PUT') {
    if (!requireAdmin()) return
    parseBody().then((body) => {
      if (body.companyName !== undefined) APP_SETTINGS.companyName = body.companyName
      if (body.timezone !== undefined) APP_SETTINGS.timezone = body.timezone
      if (body.sessionTimeout !== undefined) APP_SETTINGS.sessionTimeout = body.sessionTimeout
      if (body.emailNotifications !== undefined) APP_SETTINGS.emailNotifications = body.emailNotifications
      if (body.defaultServiceType !== undefined) APP_SETTINGS.defaultServiceType = body.defaultServiceType
      if (body.logoUrl !== undefined) APP_SETTINGS.logoUrl = body.logoUrl
      send(200, APP_SETTINGS)
    })
    return
  }

  // --- Teams CRUD ---
  if (path === '/api/teams' && req.method === 'GET') {
    if (!requireAdmin()) return
    send(200, TEAMS)
    return
  }

  if (path === '/api/teams' && req.method === 'POST') {
    if (!requireAdmin()) return
    parseBody().then((body) => {
      if (!body.name) { send(400, { error: 'name is required' }); return }
      const newTeam = { id: 't' + nextTeamId++, name: body.name, description: body.description || '', color: body.color || '#6b7280' }
      TEAMS.push(newTeam)
      send(201, newTeam)
    })
    return
  }

  const teamByIdMatch = path.match(/^\/api\/teams\/([^/]+)$/)
  if (teamByIdMatch) {
    const teamId = teamByIdMatch[1]
    const idx = TEAMS.findIndex(t => t.id === teamId)

    if (req.method === 'PATCH') {
      if (!requireAdmin()) return
      if (idx === -1) { send(404, { error: 'team not found' }); return }
      parseBody().then((body) => {
        if (body.name !== undefined) TEAMS[idx].name = body.name
        if (body.description !== undefined) TEAMS[idx].description = body.description
        if (body.color !== undefined) TEAMS[idx].color = body.color
        send(200, TEAMS[idx])
      })
      return
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin()) return
      if (idx === -1) { send(404, { error: 'team not found' }); return }
      TEAMS.splice(idx, 1)
      WAYBILLS.forEach(w => { if (w.teamId === teamId) { delete w.teamId; delete w.teamName } })
      send(200, { message: 'team deleted' })
      return
    }
  }

  // --- Assign waybill to team ---
  const assignTeamMatch = path.match(/^\/api\/waybills\/([^/]+)\/assign-team$/)
  if (assignTeamMatch && req.method === 'PATCH') {
    if (!requireAdmin()) return
    parseBody().then((body) => {
      const wb = WAYBILLS.find(w => w.id === assignTeamMatch[1])
      if (!wb) { send(404, { error: 'waybill not found' }); return }
      if (body.teamId) {
        const team = TEAMS.find(t => t.id === body.teamId)
        if (!team) { send(400, { error: 'team not found' }); return }
        wb.teamId = team.id
        wb.teamName = team.name
      } else {
        delete wb.teamId
        delete wb.teamName
      }
      send(200, wb)
    })
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

  // --- Batch status update ---
  if (path === '/api/waybills/batch-status' && req.method === 'POST') {
    const claims = requireAuth()
    if (!claims) return
    parseBody().then((body) => {
      if (!body.ids || !body.status) { send(400, { error: 'ids and status are required' }); return }
      const status = body.status
      const location = body.location || 'Batch Update'
      body.ids.forEach((id) => {
        const wb = WAYBILLS.find(w => w.id === id)
        if (wb) {
          wb.status = status
          wb.updatedAt = new Date().toISOString()
          wb.events.push({
            id: 'e' + Date.now() + Math.random().toString(36).slice(2, 6),
            waybillId: id,
            status,
            location,
            timestamp: new Date().toISOString(),
            eventType: 'NOTE',
            remark: `Batch status update to ${status}`,
          })
        }
      })
      send(200, { message: `${body.ids.length} waybills updated to ${status}` })
    })
    return
  }

  // --- Map data endpoint ---
  const CITY_COORDS = {
    'Quezon City': [14.6760, 121.0437],
    'Makati City': [14.5547, 121.0244],
    'Manila': [14.5995, 120.9842],
    'Cebu City': [10.3157, 123.8854],
    'Davao City': [7.1907, 125.4553],
    'Taguig City': [14.5146, 121.0793],
    'Iloilo City': [10.7202, 122.5621],
    'Manila Hub': [14.5850, 120.9750],
    'Manila Sorting Center': [14.5900, 120.9800],
    'Manila Warehouse': [14.5950, 120.9900],
    'En Route to Cebu': [12.0000, 123.5000],
    'Quezon City Hub': [14.6300, 121.0300],
  }

  if (path === '/api/waybills/map-data' && req.method === 'GET') {
    const claims = requireAuth()
    if (!claims) return
    const now = Date.now()
    const result = WAYBILLS.map(w => {
      const origin = CITY_COORDS[w.origin] || [14.5, 121.0]
      const dest = CITY_COORDS[w.destination] || [14.5, 121.0]
      const events = w.events || []
      const lastEvent = events.length > 0 ? events[events.length - 1] : null
      const currentLoc = lastEvent && CITY_COORDS[lastEvent.location] ? CITY_COORDS[lastEvent.location] : origin
      return {
        id: w.id,
        trackingNumber: w.trackingNumber,
        status: w.status,
        origin: w.origin,
        destination: w.destination,
        recipientName: w.recipientName,
        originCoords: origin,
        destinationCoords: dest,
        currentCoords: currentLoc,
        slaBreached: w.status !== 'DELIVERED' && w.status !== 'CANCELLED' && new Date(w.estimatedDelivery).getTime() < now,
        lastUpdate: lastEvent?.timestamp || w.updatedAt,
        lastLocation: lastEvent?.location || w.origin,
      }
    })
    send(200, result)
    return
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
    wb.availableTeams = TEAMS
    send(200, wb)
    return
  }

  // --- Attachment routes ---
  const wbAttachmentsMatch = path.match(/^\/api\/waybills\/([^/]+)\/attachments$/)
  if (wbAttachmentsMatch) {
    const wbId = wbAttachmentsMatch[1]

    if (req.method === 'GET') {
      const claims = requireAuth()
      if (!claims) return
      const list = ATTACHMENTS[wbId] || []
      send(200, list)
      return
    }

    if (req.method === 'POST') {
      const claims = requireAuth()
      if (!claims) return
      parseBody().then((body) => {
        if (!body.fileName || !body.data) { send(400, { error: 'fileName and data are required' }); return }
        const wb = WAYBILLS.find(w => w.id === wbId)
        if (!wb) { send(404, { error: 'waybill not found' }); return }
        const attachment = {
          id: 'att' + nextAttachmentId++,
          waybillId: wbId,
          fileName: body.fileName,
          fileType: body.fileType || 'application/octet-stream',
          fileSize: body.fileSize || 0,
          uploadedBy: claims.sub,
          uploadedAt: new Date().toISOString(),
          data: body.data,
        }
        ATTACHMENTS[wbId] = ATTACHMENTS[wbId] || []
        ATTACHMENTS[wbId].push(attachment)
        send(201, { ...attachment, data: undefined })
      })
      return
    }
  }

  const attachmentByIdMatch = path.match(/^\/api\/attachments\/([^/]+)$/)
  if (attachmentByIdMatch) {
    const attId = attachmentByIdMatch[1]
    const all = Object.values(ATTACHMENTS).flat()
    const att = all.find(a => a.id === attId)

    if (req.method === 'GET') {
      const claims = requireAuth()
      if (!claims) return
      if (!att) { send(404, { error: 'attachment not found' }); return }
      send(200, att)
      return
    }

    if (req.method === 'DELETE') {
      const claims = requireAuth()
      if (!claims) return
      if (!att) { send(404, { error: 'attachment not found' }); return }
      const list = ATTACHMENTS[att.waybillId]
      const idx = list.indexOf(att)
      if (idx !== -1) list.splice(idx, 1)
      send(200, { message: 'attachment deleted' })
      return
    }
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

  // --- Carrier Performance ---
  if (path === '/api/analytics/carrier-performance' && req.method === 'GET') {
    if (!requireAuth()) return
    const now = Date.now()
    const stats = CARRIERS.map(c => {
      const wbs = WAYBILLS.filter(w => w.carrierId === c.id)
      const total = wbs.length
      const delivered = wbs.filter(w => w.status === 'DELIVERED').length
      const breaches = wbs.filter(w => w.status !== 'DELIVERED' && w.status !== 'CANCELLED' && new Date(w.estimatedDelivery).getTime() < now).length
      const avgTransit = wbs.filter(w => w.actualDelivery).reduce((sum, w) => sum + (new Date(w.actualDelivery).getTime() - new Date(w.createdAt).getTime()), 0) / (delivered || 1)
      return {
        carrierId: c.id,
        carrierName: c.name,
        isActive: c.isActive,
        totalShipments: total,
        deliveredCount: delivered,
        onTimeRate: total ? Math.round(((total - breaches) / total) * 100) : 0,
        exceptionRate: total ? Math.round((wbs.filter(w => w.events.some(e => e.eventType === 'EXCEPTION')).length / total) * 100) : 0,
        avgTransitHours: Math.round(avgTransit / 3600000),
        slaBreaches: breaches,
        trackingUrlTemplate: c.trackingUrlTemplate,
      }
    })
    send(200, stats)
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

  // --- Webhooks ---
  if (path === '/api/webhooks' && req.method === 'GET') {
    if (!requireAdmin()) return
    send(200, WEBHOOKS)
    return
  }

  if (path === '/api/webhooks' && req.method === 'POST') {
    if (!requireAdmin()) return
    parseBody().then((body) => {
      if (!body.name || !body.url || !body.events?.length) { send(400, { error: 'name, url, and events are required' }); return }
      const wh = { id: 'wh' + nextWebhookId++, name: body.name, url: body.url, events: body.events, isActive: body.isActive !== false, secret: body.secret || 'whsec_' + Math.random().toString(36).slice(2, 10), createdAt: new Date().toISOString() }
      WEBHOOKS.push(wh)
      send(201, wh)
    })
    return
  }

  if (path === '/api/webhooks/events' && req.method === 'GET') {
    if (!requireAdmin()) return
    send(200, WEBHOOK_EVENTS)
    return
  }

  const webhookByIdMatch = path.match(/^\/api\/webhooks\/([^/]+)$/)
  if (webhookByIdMatch) {
    const whId = webhookByIdMatch[1]
    const idx = WEBHOOKS.findIndex(w => w.id === whId)

    if (req.method === 'PATCH') {
      if (!requireAdmin()) return
      if (idx === -1) { send(404, { error: 'webhook not found' }); return }
      parseBody().then((body) => {
        if (body.name !== undefined) WEBHOOKS[idx].name = body.name
        if (body.url !== undefined) WEBHOOKS[idx].url = body.url
        if (body.events !== undefined) WEBHOOKS[idx].events = body.events
        if (body.isActive !== undefined) WEBHOOKS[idx].isActive = body.isActive
        if (body.secret !== undefined) WEBHOOKS[idx].secret = body.secret
        send(200, WEBHOOKS[idx])
      })
      return
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin()) return
      if (idx === -1) { send(404, { error: 'webhook not found' }); return }
      WEBHOOKS.splice(idx, 1)
      send(200, { message: 'webhook deleted' })
      return
    }

    if (req.method === 'POST') {
      if (!requireAdmin()) return
      if (idx === -1) { send(404, { error: 'webhook not found' }); return }
      const wh = WEBHOOKS[idx]
      const result = { webhookId: wh.id, name: wh.name, url: wh.url, event: 'test.ping', status: 'sent', timestamp: new Date().toISOString() }
      send(200, result)
      return
    }
  }

  // --- Webhook event log ---
  if (path === '/api/webhooks/log' && req.method === 'GET') {
    if (!requireAdmin()) return
    send(200, WEBHOOK_LOG.slice().reverse())
    return
  }

  send(404, { error: 'not found' })
})

const WEBHOOK_LOG = []

server.listen(8080, () => {
  console.log('Mock API running on http://localhost:8080')
})
