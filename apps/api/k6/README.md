# Performance Testing for Zeke Dashboard

This directory contains k6 performance tests for the Zeke Dashboard API endpoints, specifically designed to validate PRD performance requirements.

## Performance Requirements (from PRD)

- **SSR Bootstrap P95**: < 500ms
- **Chat Streaming Start**: ≤ 2 seconds
- **Chunk Latency**: < 200ms between chunks
- **Bootstrap Error Rate**: < 1%
- **Chat Failure Rate**: < 0.5%

## Test Files

### bootstrap-performance.js
Tests the `workspace.bootstrap` TRPC endpoint which hydrates the dashboard layout.
- Measures P50/P95 response times
- Validates response structure (user, team, navCounts)
- Tests under concurrent load (up to 20 users)

### chat-streaming-performance.js
Tests the `/api/chat` streaming endpoint for assistant interactions.
- Measures time to first chunk (chat start time)
- Tracks inter-chunk latency
- Validates streaming under concurrent sessions (up to 10 chats)

### run-performance-tests.sh
Automated script to run both tests and generate reports.
- Checks prerequisites (k6 installation, API availability)
- Runs tests with proper configuration
- Generates HTML and JSON reports
- Validates against PRD thresholds

## Prerequisites

1. Install k6:
```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (via Chocolatey)
choco install k6
```

2. Ensure the API server is running:
```bash
cd apps/api
bun dev
```

## Running Tests

### Run all tests with automated script:
```bash
bun test:perf
```

### Run individual tests:
```bash
# Bootstrap performance only
bun test:perf:bootstrap

# Chat streaming only
bun test:perf:chat
```

### Run with custom configuration:
```bash
# With custom API URL
API_URL=https://staging.api.zeke.ai ./run-performance-tests.sh

# With authentication token
AUTH_TOKEN="your-jwt-token" ./run-performance-tests.sh
```

## Interpreting Results

### Success Criteria
Tests pass when all metrics meet PRD requirements:
- ✅ Bootstrap P95 < 500ms
- ✅ Chat start ≤ 2s
- ✅ Chunk latency < 200ms
- ✅ Error rates within thresholds

### Output Files
After running tests, check the `performance-reports/` directory:
- `bootstrap-performance-*.html`: Visual report for bootstrap test
- `chat-streaming-performance-*.html`: Visual report for chat test
- `performance-summary.md`: Combined summary of all tests
- `*.json`: Raw metrics data for further analysis

### Common Issues

1. **High latency on first run**: Cold start effect. Run tests twice and use second results.

2. **Connection refused**: Ensure API server is running on the correct port.

3. **Auth failures**: Update AUTH_TOKEN with valid JWT from your dev environment.

4. **Timeout errors**: May indicate database or external service issues.

## CI/CD Integration

To run in CI:

```yaml
# .github/workflows/performance.yml
name: Performance Tests
on:
  pull_request:
    paths:
      - 'apps/api/**'
      - 'packages/db/**'

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/k6-action@v0.3.0
        with:
          filename: apps/api/k6/bootstrap-performance.js
      - uses: grafana/k6-action@v0.3.0
        with:
          filename: apps/api/k6/chat-streaming-performance.js
```

## Load Testing Scenarios

### Light Load (default)
- 10-20 concurrent users
- 4-minute test duration
- Simulates normal daily usage

### Heavy Load
Modify `options.stages` in test files:
```javascript
stages: [
  { duration: '1m', target: 50 },   // Ramp to 50 users
  { duration: '5m', target: 100 },  // Ramp to 100 users
  { duration: '10m', target: 100 }, // Maintain load
  { duration: '1m', target: 0 },    // Ramp down
]
```

### Stress Testing
For finding breaking points:
```javascript
stages: [
  { duration: '5m', target: 200 },  // Beyond expected capacity
  { duration: '10m', target: 200 }, // Sustained stress
  { duration: '5m', target: 0 },    // Recovery
]
```

## Monitoring in Production

After deployment, monitor these metrics:
1. Real User Monitoring (RUM) for actual P95 times
2. APM traces for slow endpoints
3. Error rates in logging aggregator
4. Database query performance

## Optimization Tips

If tests fail to meet requirements:

1. **Bootstrap optimization**:
   - Add Redis caching for user/team data
   - Batch database queries
   - Use connection pooling
   - Implement query result caching

2. **Chat streaming optimization**:
   - Use streaming-optimized LLM endpoints
   - Implement response caching for common queries
   - Optimize chunk size (larger chunks = fewer round trips)
   - Use CDN for static prompt templates

3. **General optimizations**:
   - Enable HTTP/2 or HTTP/3
   - Implement database query optimization
   - Use read replicas for queries
   - Add application-level caching