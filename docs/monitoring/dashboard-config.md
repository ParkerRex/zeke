# Zeke Dashboard Monitoring Configuration

## Overview
This document defines the monitoring setup for the Zeke research dashboard and conversational assistant, including metrics, alerts, and dashboards for production rollout.

## Key Performance Indicators (KPIs)

### 1. Application Health
- **Uptime**: Target 99.9% availability
- **Error Rate**: < 1% for bootstrap, < 0.5% for chat
- **Response Times**:
  - SSR Bootstrap: P95 < 500ms
  - Chat Start: ≤ 2s
  - Chat Chunk: < 200ms
  - TRPC Procedures: P95 < 300ms

### 2. User Engagement
- **Session Metrics**:
  - Hero module interaction: > 70%
  - Assistant usage: > 50%
  - Tool invocation rate: > 1 per assistant session
  - Chat completion rate: > 80%

### 3. Business Metrics
- **Conversion**:
  - Trial to onboard: +30% target
  - Daily Active Users: +25% target
  - Feature adoption: > 60% within first week

## Monitoring Stack

### Infrastructure
```yaml
monitoring:
  platforms:
    - name: Datadog
      purpose: APM, logs, infrastructure
      dashboards:
        - zeke-dashboard-overview
        - zeke-api-performance
        - zeke-assistant-metrics

    - name: Sentry
      purpose: Error tracking, performance
      projects:
        - zeke-dashboard
        - zeke-api

    - name: PostHog
      purpose: Product analytics, feature flags
      dashboards:
        - user-journey
        - feature-adoption
        - conversion-funnel

    - name: Grafana
      purpose: Custom metrics, alerting
      datasources:
        - prometheus
        - postgresql
        - elasticsearch
```

## Dashboard Configurations

### 1. Main Overview Dashboard
```json
{
  "name": "Zeke Production Overview",
  "panels": [
    {
      "title": "Service Health",
      "metrics": [
        "service.uptime",
        "error.rate",
        "latency.p95"
      ]
    },
    {
      "title": "User Activity",
      "metrics": [
        "users.active.1h",
        "sessions.count",
        "features.usage"
      ]
    },
    {
      "title": "Assistant Performance",
      "metrics": [
        "chat.sessions.active",
        "chat.messages.per_minute",
        "tools.invocations"
      ]
    },
    {
      "title": "TRPC Health",
      "metrics": [
        "trpc.requests.per_minute",
        "trpc.errors.count",
        "trpc.latency.by_procedure"
      ]
    }
  ]
}
```

### 2. Chat Service Dashboard
```json
{
  "name": "Chat Service Monitor",
  "panels": [
    {
      "title": "Streaming Performance",
      "queries": [
        "SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY start_time) as p95_start FROM chat_metrics",
        "SELECT avg(chunk_latency) as avg_chunk FROM chat_streams"
      ]
    },
    {
      "title": "LLM Usage",
      "metrics": [
        "openai.tokens.used",
        "openai.cost.hourly",
        "openai.errors.rate"
      ]
    },
    {
      "title": "Tool Invocations",
      "breakdown": {
        "by_tool": ["getStoryHighlights", "summarizeSources", "draftBrief", "webSearch"],
        "success_rate": true,
        "latency": true
      }
    }
  ]
}
```

### 3. Error Tracking Dashboard
```json
{
  "name": "Error Analysis",
  "panels": [
    {
      "title": "Error Distribution",
      "groupBy": ["service", "endpoint", "error_type"],
      "timeRange": "1h"
    },
    {
      "title": "Critical Errors",
      "filters": {
        "severity": ["error", "fatal"],
        "exclude": ["known_issues"]
      }
    },
    {
      "title": "User Impact",
      "metrics": [
        "errors.unique_users_affected",
        "errors.by_team_tier"
      ]
    }
  ]
}
```

## Alert Configurations

### Critical Alerts (PagerDuty)
```yaml
critical_alerts:
  - name: Service Down
    condition: uptime < 95% for 5m
    channels: [pagerduty, slack-critical]

  - name: High Error Rate
    condition: error_rate > 5% for 3m
    channels: [pagerduty, slack-critical]

  - name: Chat Service Failure
    condition: chat.failures > 10 in 1m
    channels: [pagerduty, slack-critical]

  - name: Database Connection Pool Exhausted
    condition: db.connections.available < 5
    channels: [pagerduty, slack-critical]
```

### Warning Alerts (Slack)
```yaml
warning_alerts:
  - name: Elevated Response Times
    condition: p95_latency > 1000ms for 10m
    channels: [slack-engineering]

  - name: High Memory Usage
    condition: memory.usage > 85%
    channels: [slack-engineering]

  - name: Unusual Traffic Pattern
    condition: traffic.rate > 3x baseline
    channels: [slack-engineering, slack-security]

  - name: Failed Tool Invocations
    condition: tool.error_rate > 10% for 5m
    channels: [slack-engineering]
```

### Business Alerts
```yaml
business_alerts:
  - name: Low Conversion Rate
    condition: conversion.trial_to_paid < 15% daily
    channels: [slack-product]

  - name: Feature Adoption Drop
    condition: feature.adoption.delta < -20% weekly
    channels: [slack-product]

  - name: High Churn Risk
    condition: user.inactive_days > 7 AND tier = "paid"
    channels: [slack-customer-success]
```

## Custom Metrics

### Application Metrics
```typescript
// Track in application code
export const metrics = {
  // Bootstrap performance
  'bootstrap.duration': histogram({
    name: 'zeke_bootstrap_duration_ms',
    help: 'Time to complete workspace bootstrap',
    buckets: [100, 300, 500, 1000, 2000]
  }),

  // Chat metrics
  'chat.session.created': counter({
    name: 'zeke_chat_sessions_total',
    help: 'Total chat sessions created',
    labelNames: ['team_tier', 'user_type']
  }),

  'chat.message.sent': counter({
    name: 'zeke_chat_messages_total',
    help: 'Total messages sent',
    labelNames: ['role', 'has_tools']
  }),

  'chat.tool.invoked': counter({
    name: 'zeke_tool_invocations_total',
    help: 'Tool invocations by type',
    labelNames: ['tool_name', 'success']
  }),

  // Feature usage
  'feature.used': counter({
    name: 'zeke_feature_usage_total',
    help: 'Feature usage tracking',
    labelNames: ['feature_name', 'team_id']
  })
};
```

### Database Queries for Monitoring
```sql
-- Active users in last hour
SELECT COUNT(DISTINCT user_id) as active_users
FROM user_activity
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Chat success rate
SELECT
  COUNT(*) FILTER (WHERE feedback = 'positive') * 100.0 / COUNT(*) as success_rate
FROM chat_sessions
WHERE created_at > NOW() - INTERVAL '1 day';

-- Tool usage distribution
SELECT
  tool_name,
  COUNT(*) as invocations,
  AVG(duration_ms) as avg_duration,
  COUNT(*) FILTER (WHERE error IS NULL) * 100.0 / COUNT(*) as success_rate
FROM tool_invocations
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY tool_name;

-- Feature adoption funnel
WITH feature_usage AS (
  SELECT
    user_id,
    MAX(CASE WHEN feature = 'hero_modules' THEN 1 ELSE 0 END) as used_hero,
    MAX(CASE WHEN feature = 'assistant' THEN 1 ELSE 0 END) as used_assistant,
    MAX(CASE WHEN feature = 'insights_feed' THEN 1 ELSE 0 END) as used_feed
  FROM feature_events
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY user_id
)
SELECT
  COUNT(*) as total_users,
  SUM(used_hero) as hero_users,
  SUM(used_assistant) as assistant_users,
  SUM(used_feed) as feed_users,
  SUM(used_hero * used_assistant * used_feed) as full_adoption
FROM feature_usage;
```

## Logging Standards

### Structured Logging Format
```json
{
  "timestamp": "2025-09-26T12:00:00Z",
  "level": "info",
  "service": "zeke-api",
  "trace_id": "abc123",
  "span_id": "def456",
  "user_id": "user_789",
  "team_id": "team_012",
  "event": "chat.message.sent",
  "metadata": {
    "tool_count": 2,
    "token_count": 450,
    "duration_ms": 1200
  }
}
```

### Log Levels
- **ERROR**: Service failures, unhandled exceptions
- **WARN**: Degraded performance, retry attempts
- **INFO**: Key business events, feature usage
- **DEBUG**: Detailed execution flow (dev/staging only)

## Monitoring Checklist

### Pre-Launch
- [ ] All dashboards configured and tested
- [ ] Alert channels configured and tested
- [ ] Runbooks created for each critical alert
- [ ] Load testing completed with monitoring
- [ ] Security scanning integrated
- [ ] Cost monitoring for LLM usage

### Launch Day
- [ ] Real-time dashboard monitoring active
- [ ] On-call schedule confirmed
- [ ] Alert fatigue prevention configured
- [ ] Rollback procedures tested
- [ ] Communication channels open

### Post-Launch
- [ ] Daily metrics review
- [ ] Weekly trend analysis
- [ ] Monthly cost optimization
- [ ] Quarterly alert tuning
- [ ] Regular dashboard updates

## Integration Points

### GitHub Actions
```yaml
name: Deploy with Monitoring
on:
  push:
    branches: [main]
jobs:
  deploy:
    steps:
      - name: Deploy
        run: |
          # Deploy application

      - name: Notify Monitoring
        run: |
          curl -X POST $DATADOG_WEBHOOK \
            -d '{"deployment": "production", "version": "${{ github.sha }}"}'

      - name: Create Annotation
        run: |
          grafana-cli annotations create \
            --tag deployment \
            --text "Deployed version ${{ github.sha }}"
```

### Feature Flags
```typescript
// PostHog integration for gradual rollout
if (posthog.isFeatureEnabled('new-dashboard', {
  userId: user.id,
  teamId: team.id,
  properties: {
    tier: team.tier,
    created_at: team.created_at
  }
})) {
  // Show new dashboard
}
```

## SLA Targets

| Metric | Target | Measurement Period |
|--------|--------|-------------------|
| Uptime | 99.9% | Monthly |
| Error Rate | < 1% | Daily |
| P95 Latency | < 500ms | Hourly |
| Chat Success | > 95% | Daily |
| Tool Success | > 90% | Daily |
| Data Freshness | < 5min | Real-time |

## Escalation Matrix

| Severity | Response Time | Escalation Path |
|----------|--------------|-----------------|
| Critical | < 5 min | On-call → Team Lead → CTO |
| High | < 30 min | On-call → Team Lead |
| Medium | < 2 hrs | Engineering Team |
| Low | < 24 hrs | Next Sprint |

## Cost Monitoring

### LLM Usage Tracking
```sql
-- Daily LLM cost calculation
SELECT
  DATE(created_at) as date,
  SUM(prompt_tokens) * 0.003 / 1000 +
  SUM(completion_tokens) * 0.006 / 1000 as estimated_cost,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(prompt_tokens + completion_tokens) / COUNT(DISTINCT user_id) as tokens_per_user
FROM llm_usage
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Infrastructure Cost Alerts
- Alert if daily LLM costs > $500
- Alert if database costs > $1000/month
- Alert if bandwidth costs spike > 200%

## Maintenance Windows

- **Planned**: Tuesdays 2-4 AM PST (low traffic)
- **Emergency**: Immediate with status page update
- **Rollback Window**: 15 minutes max
- **Recovery Time Objective**: < 1 hour

## Contact Information

- **On-Call**: via PagerDuty rotation
- **Engineering Lead**: #engineering-lead
- **Product**: #product-team
- **Security**: security@zeke.ai
- **Status Page**: status.zeke.ai