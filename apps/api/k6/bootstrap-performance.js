import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

// Custom metrics
const bootstrapDuration = new Trend("bootstrap_duration");
const ssrDuration = new Trend("ssr_duration");

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 users
    { duration: "1m", target: 20 }, // Ramp up to 20 users
    { duration: "2m", target: 20 }, // Stay at 20 users
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: [
      "p(50)<300", // 50% of requests should be below 300ms
      "p(95)<500", // 95% of requests should be below 500ms (PRD requirement)
      "p(99)<1000", // 99% of requests should be below 1s
    ],
    bootstrap_duration: [
      "p(50)<250",
      "p(95)<450", // Custom metric for bootstrap specifically
    ],
    http_req_failed: ["rate<0.01"], // Error rate should be below 1%
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:3001";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "test-token";

export function setup() {
  // Warm up the server
  http.get(`${BASE_URL}/health`);
  sleep(1);
}

export default function () {
  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  };

  // Test workspace.bootstrap endpoint
  const startTime = Date.now();
  const res = http.post(
    `${BASE_URL}/trpc/workspace.bootstrap`,
    JSON.stringify({}),
    params,
  );
  const duration = Date.now() - startTime;

  bootstrapDuration.add(duration);

  // Check response
  const success = check(res, {
    "bootstrap status is 200": (r) => r.status === 200,
    "bootstrap has user data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result?.data?.user !== undefined;
      } catch {
        return false;
      }
    },
    "bootstrap has team data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result?.data?.team !== undefined;
      } catch {
        return false;
      }
    },
    "bootstrap has nav counts": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result?.data?.navCounts !== undefined;
      } catch {
        return false;
      }
    },
    "bootstrap duration < 500ms": () => duration < 500,
  });

  if (!success) {
    console.error(`Bootstrap failed: ${res.status} - ${res.body}`);
  }

  // Test SSR page load (simulating full dashboard load)
  const ssrStart = Date.now();
  const ssrRes = http.get(`${BASE_URL}/dashboard`, params);
  const ssrTime = Date.now() - ssrStart;

  ssrDuration.add(ssrTime);

  check(ssrRes, {
    "SSR status is 200": (r) => r.status === 200,
    "SSR duration < 500ms": () => ssrTime < 500,
  });

  // Think time between requests
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    "bootstrap-performance.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function htmlReport(data) {
  const p50 = data.metrics.bootstrap_duration.values["p(50)"];
  const p95 = data.metrics.bootstrap_duration.values["p(95)"];
  const errorRate = data.metrics.http_req_failed.values.rate || 0;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Bootstrap Performance Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>Bootstrap Performance Test Results</h1>
    
    <div class="metric">
        <h2>PRD Requirements</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Target</th>
                <th>Actual</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Bootstrap P95</td>
                <td>&lt; 500ms</td>
                <td>${p95.toFixed(2)}ms</td>
                <td class="${p95 < 500 ? "pass" : "fail"}">${p95 < 500 ? "PASS" : "FAIL"}</td>
            </tr>
            <tr>
                <td>Bootstrap P50</td>
                <td>&lt; 300ms</td>
                <td>${p50.toFixed(2)}ms</td>
                <td class="${p50 < 300 ? "pass" : "fail"}">${p50 < 300 ? "PASS" : "FAIL"}</td>
            </tr>
            <tr>
                <td>Error Rate</td>
                <td>&lt; 1%</td>
                <td>${(errorRate * 100).toFixed(2)}%</td>
                <td class="${errorRate < 0.01 ? "pass" : "fail"}">${errorRate < 0.01 ? "PASS" : "FAIL"}</td>
            </tr>
        </table>
    </div>
    
    <div class="metric">
        <h2>Test Configuration</h2>
        <ul>
            <li>Total VUs: 20</li>
            <li>Test Duration: 4 minutes</li>
            <li>Ramp-up Time: 30 seconds</li>
            <li>Total Requests: ${data.metrics.http_reqs.values.count}</li>
        </ul>
    </div>
</body>
</html>
  `;
}

function textSummary(data) {
  const p50 = data.metrics.bootstrap_duration.values["p(50)"];
  const p95 = data.metrics.bootstrap_duration.values["p(95)"];

  return `
Bootstrap Performance Test Summary
===================================
P50: ${p50.toFixed(2)}ms (Target: <300ms) ${p50 < 300 ? "✓" : "✗"}
P95: ${p95.toFixed(2)}ms (Target: <500ms) ${p95 < 500 ? "✓" : "✗"}
`;
}
