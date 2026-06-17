import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const loginDuration = new Trend('login_duration')
const queryDuration = new Trend('query_duration')

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
    login_duration: ['p(95)<3000'],
    query_duration: ['p(95)<1500'],
  },
}

const BASE = __ENV.API_BASE || 'http://localhost:8080/api/v1'
const EMAIL = __ENV.EMAIL || 'admin@waybill.com'
const PASSWORD = __ENV.PASSWORD || 'admin123'

export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify({
    email: EMAIL, password: PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } })

  const token = res.json('accessToken')
  if (!token) {
    console.error('Login failed, using anonymous access for public endpoints only')
    return { token: null }
  }
  return { token }
}

export default function (data) {
  const headers = { 'Content-Type': 'application/json' }
  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`
  }

  if (Math.random() < 0.1) {
    const t0 = Date.now()
    const res = http.get(`${BASE}/auth/me`, { headers })
    loginDuration.add(Date.now() - t0)
    errorRate.add(res.status >= 400)
    return
  }

  {
    const t0 = Date.now()
    const res = http.get(`${BASE}/waybills?page=1&limit=20`, { headers })
    queryDuration.add(Date.now() - t0)
    errorRate.add(res.status >= 400)
    check(res, { 'waybills list ok': (r) => r.status === 200 })
  }

  sleep(0.3)

  {
    const res = http.get(`${BASE}/waybills?page=1&limit=50&search=`, { headers })
    errorRate.add(res.status >= 400)
  }

  sleep(0.5)

  {
    const res = http.get(`${BASE}/features`, { headers })
    errorRate.add(res.status >= 400)
  }

  sleep(Math.random() * 0.5)

  if (Math.random() < 0.2 && data.token) {
    const res = http.post(`${BASE}/waybills`, JSON.stringify({
      recipientName: 'Load Test User',
      recipientAddress: '123 Test St, Test City',
      recipientPhone: '+1234567890',
      origin: 'New York',
      destination: 'Los Angeles',
      weight: 5.0,
      dimensions: '30x20x15 cm',
      serviceType: 'STANDARD',
    }), { headers })
    errorRate.add(res.status >= 400)
  }

  sleep(1)
}
