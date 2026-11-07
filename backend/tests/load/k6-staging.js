// ─────────────────────────────────────────────────────────────────────────────
// Staging-Only k6 Load & Rate-Limit Readiness Script
// WARNING: DO NOT run against production without explicit authorization.
// Usage (staging/local only):
//   k6 run -e BASE_URL=http://localhost:4000 backend/tests/load/k6-staging.js
// ─────────────────────────────────────────────────────────────────────────────
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Guard against accidentally targeting production domains
if (
  BASE_URL.includes('nehacrockery.com') ||
  BASE_URL.includes('nehacrockery.vercel.app') ||
  BASE_URL.includes('onrender.com')
) {
  if (__ENV.ALLOW_STAGING_REMOTE !== 'true') {
    throw new Error(
      `Refusing to run load test against remote host (${BASE_URL}) without ALLOW_STAGING_REMOTE=true`,
    );
  }
}

export const options = {
  stages: [
    { duration: '15s', target: 10 }, // ramp up to 10 concurrent virtual users
    { duration: '30s', target: 25 }, // steady state 25 VUs browsing catalogue
    { duration: '10s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  // Simulate distinct client IPs behind reverse proxy (verifies C3 / L1 per-client buckets)
  const vuIp = `198.51.100.${(__VU % 250) + 1}`;
  const params = {
    headers: {
      'X-Forwarded-For': vuIp,
      Accept: 'application/json',
    },
  };

  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/api/v1/health`, params);
  check(healthRes, {
    'health is 200': (r) => r.status === 200,
  });

  // 2. Public products listing (cached + indexed)
  const productsRes = http.get(`${BASE_URL}/api/v1/products?page=1&pageSize=20`, params);
  check(productsRes, {
    'products status 200': (r) => r.status === 200,
    'products has Cache-Control': (r) => Boolean(r.headers['Cache-Control']),
  });

  // 3. Public categories & brands
  const catsRes = http.get(`${BASE_URL}/api/v1/categories`, params);
  check(catsRes, {
    'categories status 200': (r) => r.status === 200,
  });

  sleep(1);
}

