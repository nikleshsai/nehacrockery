/**
 * Pure Node.js load test — no external dependencies.
 * Targets the PUBLIC read-only endpoints only (safe to run against local dev server).
 * Usage: node load-test.mjs [base_url] [duration_seconds] [concurrency]
 *
 * Example (local):  node load-test.mjs http://localhost:4000/api/v1 30 50
 * Example (staging): node load-test.mjs https://your-staging.onrender.com/api/v1 30 50
 *
 * ⚠️  NEVER run with high concurrency against production without permission.
 */

import http from 'http';
import https from 'https';

const BASE    = process.argv[2] ?? 'http://localhost:4000/api/v1';
const SECONDS = parseInt(process.argv[3] ?? '30', 10);
const CONCUR  = parseInt(process.argv[4] ?? '50', 10);

// ── Endpoints under test ────────────────────────────────────────────────────
const ENDPOINTS = [
  { label: 'GET /products (list)',        path: '/products?page=1&limit=20' },
  { label: 'GET /products (search)',      path: '/products?search=bowl&limit=20' },
  { label: 'GET /site-settings',          path: '/site-settings' },
  { label: 'GET /banners',                path: '/banners' },
  { label: 'GET /catalogues',             path: '/catalogues' },
  { label: 'GET /reviews',                path: '/reviews' },
];

// ── Stats per endpoint ──────────────────────────────────────────────────────
const stats = {};
for (const ep of ENDPOINTS) {
  stats[ep.label] = { ok: 0, err: 0, timeouts: 0, totalMs: 0, min: Infinity, max: 0, status: {} };
}

let totalRequests = 0;
let running = true;

// ── Single request ──────────────────────────────────────────────────────────
function request(ep) {
  return new Promise((resolve) => {
    const url  = new URL(BASE + ep.path);
    const lib  = url.protocol === 'https:' ? https : http;
    const st   = Date.now();
    const s    = stats[ep.label];

    const req = lib.get(
      { hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search, headers: { 'Accept': 'application/json' }, timeout: 10000 },
      (res) => {
        res.resume(); // drain body
        res.on('end', () => {
          const ms = Date.now() - st;
          s.ok++;
          s.totalMs += ms;
          s.min = Math.min(s.min, ms);
          s.max = Math.max(s.max, ms);
          s.status[res.statusCode] = (s.status[res.statusCode] ?? 0) + 1;
          totalRequests++;
          resolve();
        });
      }
    );

    req.on('timeout', () => { req.destroy(); s.timeouts++; s.err++; totalRequests++; resolve(); });
    req.on('error',   () => { s.err++; totalRequests++; resolve(); });
  });
}

// ── Worker loop ─────────────────────────────────────────────────────────────
async function worker(id) {
  const eps = ENDPOINTS;
  while (running) {
    const ep = eps[id % eps.length]; // round-robin spread across endpoints
    await request(ep);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log(`\n🔥 Load test starting`);
console.log(`   Target   : ${BASE}`);
console.log(`   Duration : ${SECONDS}s`);
console.log(`   Workers  : ${CONCUR} concurrent`);
console.log(`   Endpoints: ${ENDPOINTS.length}`);
console.log('─'.repeat(70));

const start = Date.now();

// Tick progress every 5s
const ticker = setInterval(() => {
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  const rps = (totalRequests / ((Date.now() - start) / 1000)).toFixed(1);
  process.stdout.write(`\r   ⏱  ${elapsed}s elapsed | ${totalRequests} requests | ~${rps} req/s   `);
}, 1000);

// Spawn workers
const workers = Array.from({ length: CONCUR }, (_, i) => worker(i));

// Stop after SECONDS
await new Promise((r) => setTimeout(r, SECONDS * 1000));
running = false;
await Promise.all(workers);
clearInterval(ticker);

const totalMs = Date.now() - start;
const rpsOverall = (totalRequests / (totalMs / 1000)).toFixed(1);

// ── Print results ───────────────────────────────────────────────────────────
console.log(`\n\n${'═'.repeat(70)}`);
console.log(`  LOAD TEST RESULTS — ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Duration    : ${(totalMs / 1000).toFixed(1)}s`);
console.log(`  Concurrency : ${CONCUR} workers`);
console.log(`  Total reqs  : ${totalRequests}`);
console.log(`  Overall RPS : ${rpsOverall} req/s`);
console.log(`${'─'.repeat(70)}`);

let grandOk  = 0;
let grandErr = 0;

for (const ep of ENDPOINTS) {
  const s = stats[ep.label];
  const avg = s.ok > 0 ? (s.totalMs / s.ok).toFixed(0) : '-';
  const min = s.min === Infinity ? '-' : s.min;
  const p   = s.ok + s.err;
  const errPct = p > 0 ? ((s.err / p) * 100).toFixed(1) : '0.0';
  grandOk  += s.ok;
  grandErr += s.err;

  console.log(`\n  ${ep.label}`);
  console.log(`    Requests : ${p}  |  ✅ ${s.ok} ok  |  ❌ ${s.err} errors (${errPct}%)`);
  console.log(`    Latency  : avg ${avg}ms  |  min ${min}ms  |  max ${s.max}ms`);
  console.log(`    Status   : ${JSON.stringify(s.status)}`);
  if (s.timeouts > 0) console.log(`    ⚠️  Timeouts: ${s.timeouts}`);
}

console.log(`\n${'─'.repeat(70)}`);
const errRate = ((grandErr / (grandOk + grandErr)) * 100).toFixed(2);
console.log(`  Grand total : ✅ ${grandOk} ok  |  ❌ ${grandErr} errors  |  error rate ${errRate}%`);
console.log(`${'═'.repeat(70)}\n`);

// ── Verdict ─────────────────────────────────────────────────────────────────
const avgLatency = grandOk > 0
  ? (Object.values(stats).reduce((a, s) => a + s.totalMs, 0) / grandOk).toFixed(0)
  : '?';

console.log('  📊 VERDICT');
if (parseFloat(errRate) < 1 && parseFloat(avgLatency) < 500) {
  console.log(`  ✅ Healthy — ${rpsOverall} req/s, avg latency ${avgLatency}ms, error rate ${errRate}%`);
} else if (parseFloat(errRate) < 5) {
  console.log(`  ⚠️  Degraded — ${rpsOverall} req/s, avg latency ${avgLatency}ms, error rate ${errRate}%`);
  console.log('     Consider: DB connection pool tuning, caching, or horizontal scaling');
} else {
  console.log(`  ❌ Overloaded — ${rpsOverall} req/s, avg latency ${avgLatency}ms, error rate ${errRate}%`);
  console.log('     Action needed: rate limiting, caching, or infrastructure upgrade');
}
console.log('');
