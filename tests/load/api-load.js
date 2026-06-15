import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const healthDuration = new Trend('health_duration')

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.05'],
    health_duration: ['p(95)<200'],
  },
}

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:54321/functions/v1'

export default function () {
  const healthRes = http.get(`${BASE_URL}/api/v1/health`)
  healthDuration.add(healthRes.timings.duration)

  const healthOk = check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health body valid': (r) => {
      try {
        return JSON.parse(r.body).status === 'healthy'
      } catch {
        return false
      }
    },
  })

  errorRate.add(!healthOk)

  const authRes = http.get(`${BASE_URL}/api/v1/plans`)
  check(authRes, {
    'protected route returns 401': (r) => r.status === 401,
  })

  sleep(0.1)
}
