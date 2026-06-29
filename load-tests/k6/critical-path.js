import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const TRACKING_NUMBER = __ENV.TRACKING_NUMBER || 'WBT-1407a843'
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@waybilltrack.com'
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'teccadmin00'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.05'],
  },
}

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } })

  check(loginRes, {
    'login succeeded': (r) => r.status === 200,
    'login returned token': (r) => r.json('accessToken') !== undefined,
  })

  const token = loginRes.json('accessToken')
  return { token }
}

export default function (data) {
  // 1. Load test public tracking endpoint
  const trackRes = http.get(`${BASE_URL}/track/${TRACKING_NUMBER}`)
  const trackOk = check(trackRes, {
    'track status is 200': (r) => r.status === 200,
    'track response time < 500ms': (r) => r.timings.duration < 500,
  })
  errorRate.add(!trackOk)

  sleep(1)

  // 2. Load test authenticated waybills list endpoint
  const waybillsRes = http.get(`${BASE_URL}/api/v1/waybills?limit=20`, {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  })
  const waybillsOk = check(waybillsRes, {
    'waybills status is 200': (r) => r.status === 200,
    'waybills response time < 500ms': (r) => r.timings.duration < 500,
  })
  errorRate.add(!waybillsOk)

  sleep(1)
}
