import { check } from 'k6'
import http from 'k6/http'

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<5000'],
  },
}

const CORE = __ENV.CORE_API || 'http://localhost:8080'
const ANALYTICS = __ENV.ANALYTICS_API || 'http://localhost:8000'

export default function () {
  const checks = {}

  {
    const res = http.get(`${CORE}/health`)
    checks['core health'] = res.status === 200
  }

  {
    const res = http.get(`${ANALYTICS}/health`)
    checks['analytics health'] = res.status === 200
  }

  {
    const res = http.get(`http://localhost:5173`)
    checks['dashboard up'] = res.status === 200
  }

  {
    const login = http.post(`${CORE}/api/v1/auth/login`, JSON.stringify({
      email: 'admin@waybill.com',
      password: 'admin123',
    }), { headers: { 'Content-Type': 'application/json' } })
    checks['login ok'] = login.status === 200

    if (login.status === 200) {
      const token = login.json('accessToken')
      const headers = { Authorization: `Bearer ${token}` }

      {
        const res = http.get(`${CORE}/api/v1/waybills?page=1&limit=10`, { headers })
        checks['waybills list'] = res.status === 200
      }
      {
        const res = http.get(`${CORE}/api/v1/features`, { headers })
        checks['features'] = res.status === 200
      }
    }
  }

  check(null, checks)
}
