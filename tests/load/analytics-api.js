import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const statsDuration = new Trend('stats_duration')

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '30s', target: 20 },
    { duration: '20s', target: 5 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
    stats_duration: ['p(95)<2000'],
  },
}

const BASE = __ENV.API_BASE || 'http://localhost:8000/api/v1'
const EMAIL = __ENV.EMAIL || 'admin@waybill.com'
const PASSWORD = __ENV.PASSWORD || 'admin123'

export function setup() {
  const loginRes = http.post(
    BASE.replace('/api/v1/analytics', '/api/v1/auth').replace(':8000', ':8080') + '/login',
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  const token = loginRes.json('accessToken')
  return { token: token || null }
}

export default function (data) {
  const headers = { 'Content-Type': 'application/json' }
  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`
  }

  {
    const t0 = Date.now()
    const res = http.get(`${BASE}/analytics/stats`, { headers })
    statsDuration.add(Date.now() - t0)
    errorRate.add(res.status >= 400)
    check(res, { 'stats ok': (r) => r.status === 200 })
  }

  sleep(0.5)

  {
    const res = http.get(`${BASE}/analytics/sla?from=2026-01-01&to=2026-06-17`, { headers })
    errorRate.add(res.status >= 400)
  }

  sleep(0.5)

  {
    const res = http.get(`${BASE}/analytics/anomalies`, { headers })
    errorRate.add(res.status >= 400)
  }

  sleep(0.3)

  if (Math.random() < 0.3) {
    const res = http.get(`${BASE}/analytics/predict-eta/test-id`, { headers })
    errorRate.add(res.status >= 400)
  }

  sleep(1)
}
