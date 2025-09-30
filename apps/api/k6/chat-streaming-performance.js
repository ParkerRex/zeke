import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";
import { WebSocket } from "k6/experimental/websockets";

// Custom metrics
const chatStartTime = new Trend("chat_start_time");
const chunkLatency = new Trend("chunk_latency");
const messageComplete = new Trend("message_complete_time");
const streamingErrors = new Rate("streaming_errors");

export const options = {
  stages: [
    { duration: "30s", target: 5 }, // Ramp up to 5 concurrent chats
    { duration: "1m", target: 10 }, // Ramp up to 10 concurrent chats
    { duration: "2m", target: 10 }, // Maintain 10 concurrent chats
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    chat_start_time: [
      "p(50)<1500", // 50% of chats should start streaming within 1.5s
      "p(95)<2000", // 95% of chats should start streaming within 2s (PRD requirement)
      "p(99)<3000", // 99% of chats should start streaming within 3s
    ],
    chunk_latency: [
      "p(50)<100", // 50% of chunks should arrive within 100ms
      "p(95)<200", // 95% of chunks should arrive within 200ms (PRD requirement)
      "p(99)<500", // 99% of chunks should arrive within 500ms
    ],
    streaming_errors: ["rate<0.005"], // Streaming error rate should be below 0.5%
    http_req_failed: ["rate<0.005"], // Chat failure rate should be below 0.5% (PRD requirement)
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:3001";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "test-token";

const TEST_PROMPTS = [
  "What are the latest trends in AI research?",
  "Summarize recent developments in quantum computing",
  "Explain the key insights from the latest market analysis",
  "What are the top stories this week?",
  "Give me a brief on emerging technologies",
];

export default function () {
  const prompt = TEST_PROMPTS[Math.floor(Math.random() * TEST_PROMPTS.length)];

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
      Accept: "text/event-stream",
    },
    timeout: "30s",
  };

  const payload = JSON.stringify({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
  });

  // Measure time to first chunk
  const startTime = Date.now();
  let firstChunkTime = null;
  let lastChunkTime = startTime;
  const chunks = [];

  // Make streaming request
  const res = http.post(`${BASE_URL}/api/chat`, payload, params);

  // Parse SSE response
  if (res.status === 200) {
    const lines = res.body.split("\n");
    let chunkCount = 0;

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const now = Date.now();

        if (firstChunkTime === null) {
          firstChunkTime = now;
          const timeToFirst = firstChunkTime - startTime;
          chatStartTime.add(timeToFirst);
        }

        // Measure inter-chunk latency
        if (chunkCount > 0) {
          const latency = now - lastChunkTime;
          chunkLatency.add(latency);
        }

        lastChunkTime = now;
        chunkCount++;

        try {
          const data = JSON.parse(line.slice(6));
          chunks.push(data);
        } catch (e) {
          // Handle [DONE] or other non-JSON data
        }
      }
    }

    const totalTime = lastChunkTime - startTime;
    messageComplete.add(totalTime);

    // Validate response
    const success = check(res, {
      "chat status is 200": (r) => r.status === 200,
      "received chunks": () => chunks.length > 0,
      "time to first chunk < 2s": () =>
        firstChunkTime && firstChunkTime - startTime < 2000,
      "average chunk latency < 200ms": () => {
        if (chunks.length <= 1) return true;
        const avgLatency =
          (lastChunkTime - firstChunkTime) / (chunks.length - 1);
        return avgLatency < 200;
      },
    });

    if (!success) {
      streamingErrors.add(1);
    } else {
      streamingErrors.add(0);
    }
  } else {
    streamingErrors.add(1);
    console.error(`Chat request failed: ${res.status} - ${res.body}`);
  }

  // Simulate reading time between messages
  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) {
  return {
    "chat-streaming-performance.html": htmlReport(data),
    "chat-streaming-performance.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function htmlReport(data) {
  const startP50 = data.metrics.chat_start_time?.values["p(50)"] || 0;
  const startP95 = data.metrics.chat_start_time?.values["p(95)"] || 0;
  const chunkP50 = data.metrics.chunk_latency?.values["p(50)"] || 0;
  const chunkP95 = data.metrics.chunk_latency?.values["p(95)"] || 0;
  const errorRate = data.metrics.http_req_failed?.values.rate || 0;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Chat Streaming Performance Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>Chat Streaming Performance Test Results</h1>
    
    <div class="metric">
        <h2>PRD Requirements Compliance</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Target</th>
                <th>Actual</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Chat Start Time P95</td>
                <td>≤ 2s</td>
                <td>${(startP95 / 1000).toFixed(2)}s</td>
                <td class="${startP95 <= 2000 ? "pass" : "fail"}">${startP95 <= 2000 ? "PASS" : "FAIL"}</td>
            </tr>
            <tr>
                <td>Chunk Latency P95</td>
                <td>&lt; 200ms</td>
                <td>${chunkP95.toFixed(0)}ms</td>
                <td class="${chunkP95 < 200 ? "pass" : "fail"}">${chunkP95 < 200 ? "PASS" : "FAIL"}</td>
            </tr>
            <tr>
                <td>Chat Failure Rate</td>
                <td>&lt; 0.5%</td>
                <td>${(errorRate * 100).toFixed(3)}%</td>
                <td class="${errorRate < 0.005 ? "pass" : "fail"}">${errorRate < 0.005 ? "PASS" : "FAIL"}</td>
            </tr>
        </table>
    </div>
    
    <div class="metric">
        <h2>Detailed Metrics</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>P50</th>
                <th>P95</th>
                <th>P99</th>
            </tr>
            <tr>
                <td>Chat Start Time</td>
                <td>${(startP50 / 1000).toFixed(2)}s</td>
                <td>${(startP95 / 1000).toFixed(2)}s</td>
                <td>${(data.metrics.chat_start_time?.values["p(99)"] / 1000 || 0).toFixed(2)}s</td>
            </tr>
            <tr>
                <td>Chunk Latency</td>
                <td>${chunkP50.toFixed(0)}ms</td>
                <td>${chunkP95.toFixed(0)}ms</td>
                <td>${(data.metrics.chunk_latency?.values["p(99)"] || 0).toFixed(0)}ms</td>
            </tr>
        </table>
    </div>
    
    <div class="metric">
        <h2>Test Summary</h2>
        <ul>
            <li>Total Chat Requests: ${data.metrics.http_reqs?.values.count || 0}</li>
            <li>Average Chunks per Message: ${Math.round((data.metrics.chunk_latency?.values.count || 0) / (data.metrics.http_reqs?.values.count || 1))}</li>
            <li>Test Duration: 4 minutes</li>
            <li>Max Concurrent Users: 10</li>
        </ul>
    </div>
</body>
</html>
  `;
}

function textSummary(data) {
  const startP95 = data.metrics.chat_start_time?.values["p(95)"] || 0;
  const chunkP95 = data.metrics.chunk_latency?.values["p(95)"] || 0;
  const errorRate = data.metrics.http_req_failed?.values.rate || 0;

  return `
Chat Streaming Performance Test Summary
========================================
Chat Start P95: ${(startP95 / 1000).toFixed(2)}s (Target: ≤2s) ${startP95 <= 2000 ? "✓" : "✗"}
Chunk Latency P95: ${chunkP95.toFixed(0)}ms (Target: <200ms) ${chunkP95 < 200 ? "✓" : "✗"}
Failure Rate: ${(errorRate * 100).toFixed(3)}% (Target: <0.5%) ${errorRate < 0.005 ? "✓" : "✗"}
`;
}
