import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const targets = [
  { host: 'foo.localhost', expected: 'foo' },
  { host: 'bar.localhost', expected: 'bar' },
];

export default function () {
  const t = targets[Math.floor(Math.random() * targets.length)];

  const res = http.get('http://127.0.0.1/', {
    headers: { Host: t.host },
    timeout: '5s',
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'correct backend response': (r) => r.body.trim() === t.expected,
  });

  sleep(Math.random() * 0.3);
}

export function handleSummary(data) {
  const d = data.metrics.http_req_duration.values;
  const rps = data.metrics.http_reqs.values.rate;

  const summary = `
🚦 Ingress Load Test Results

Requests: ${data.metrics.http_reqs.values.count}
Requests/sec: ${rps.toFixed(2)}
Failures: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

Latency (ms):
- avg: ${d.avg.toFixed(2)}
- p90: ${d['p(90)'].toFixed(2)}
- p95: ${d['p(95)'].toFixed(2)}
`;

  return {
    stdout: summary,
    'loadtest/summary.txt': summary,
  };
}
