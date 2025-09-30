# Zeke API Reference

## Overview

The Zeke API provides access to research intelligence, chat assistance, and workspace management features. The API consists of TRPC procedures for typed client-server communication and REST endpoints for streaming operations.

## Base URLs

- **TRPC**: `${NEXT_PUBLIC_API_URL}/trpc`
- **REST**: `${NEXT_PUBLIC_API_URL}/api`

## Authentication

All endpoints require authentication via Supabase JWT tokens passed in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/chat` | 60 requests | 1 minute |
| TRPC procedures | 120 requests | 1 minute |
| File uploads | 10 uploads | 1 hour |

## TRPC Procedures

### Workspace

#### `workspace.bootstrap`
Returns initial dashboard data including user info, team details, navigation counts, banners, and assistant usage.

**Response:**
```typescript
{
  user: User;
  team: Team;
  navCounts: {
    stories: number;
    insights: number;
    playbooks: number;
    sources: number;
  };
  banners: Banner[];
  assistantSummary: {
    messagesThisMonth: number;
    toolsUsedThisMonth: number;
    artifactsCreated: number;
  };
}
```

**Caching:** 5 minutes

### Stories

#### `stories.dashboardSummaries`
Returns categorized story summaries for dashboard hero modules.

**Input:**
```typescript
{
  limit?: number; // Default: 10 per category
}
```

**Response:**
```typescript
{
  trending: Story[];
  signals: Story[];
  repoWatch: Story[];
}
```

**Story Schema:**
```typescript
{
  id: string;
  title: string;
  summary: string;
  chiliScore: number; // 1-5
  whyItMatters: string;
  publishedAt: Date;
  source: string;
  tags: string[];
}
```

### Insights

#### `insights.personalizedFeed`
Returns paginated insights filtered by user goals and tags.

**Input:**
```typescript
{
  cursor?: string;
  limit?: number; // Default: 20
  goalId?: string;
  tags?: string[];
}
```

**Response:**
```typescript
{
  insights: Insight[];
  nextCursor?: string;
  hasMore: boolean;
}
```

**Access Control:**
- Free users: Returns locked state with upgrade prompt
- Paid users: Full access with personalization

### Pipeline

#### `pipeline.dashboardStatus`
Returns current ingestion pipeline status and metrics.

**Response:**
```typescript
{
  status: 'active' | 'idle' | 'error';
  itemsProcessed: number;
  itemsPending: number;
  lastActivity: Date;
  errors: PipelineError[];
}
```

#### `pipeline.quickActions.ingestUrl`
Ingests a single URL into the pipeline.

**Input:**
```typescript
{
  url: string;
  priority?: 'high' | 'normal' | 'low';
}
```

**Response:**
```typescript
{
  jobId: string;
  status: 'queued' | 'processing';
}
```

### Chats

#### `chats.list`
Returns paginated chat history for the current team.

**Input:**
```typescript
{
  cursor?: string;
  limit?: number; // Default: 20
}
```

**Response:**
```typescript
{
  chats: Chat[];
  nextCursor?: string;
}
```

#### `chats.get`
Returns a specific chat with all messages.

**Input:**
```typescript
{
  chatId: string;
}
```

**Response:**
```typescript
{
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### `chats.create`
Creates a new chat session.

**Input:**
```typescript
{
  title?: string;
  firstMessage?: string;
}
```

**Response:**
```typescript
{
  id: string;
  title: string;
}
```

#### `chats.delete`
Deletes a chat and all associated messages.

**Input:**
```typescript
{
  chatId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

**Note:** This permanently deletes all messages and feedback associated with the chat.

#### `chats.feedback`
Submits feedback for a specific message.

**Input:**
```typescript
{
  messageId: string;
  feedback: 'positive' | 'negative';
  comment?: string;
}
```

**Response:**
```typescript
{
  id: string;
  feedback: string;
}
```

#### `chats.stats`
Returns chat usage statistics for the team.

**Response:**
```typescript
{
  totalChats: number;
  totalMessages: number;
  averageMessagesPerChat: number;
  feedbackStats: {
    positive: number;
    negative: number;
  };
}
```

## REST Endpoints

### POST `/api/chat`

Streams assistant responses with tool execution and artifact generation.

**Request:**
```typescript
{
  chatId: string;
  message: string;
  context?: {
    goalId?: string;
    selectedSources?: string[];
  };
}
```

**Response:** Server-Sent Events stream

**Stream Events:**
- `message`: Text chunks from the assistant
- `tool_call`: Tool invocation with name and arguments
- `tool_result`: Tool execution results
- `artifact`: Generated artifact data
- `error`: Error messages
- `done`: Stream completion

**Example:**
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    chatId: 'chat-123',
    message: 'Summarize the latest AI research'
  })
});

const reader = response.body.getReader();
// Process stream chunks...
```

## Tool Registry

The assistant has access to the following research tools:

### `getStoryHighlights`
Retrieves key highlights from stories matching specified criteria.

### `summarizeSources`
Creates summaries from multiple source documents.

### `draftBrief`
Generates executive briefs on specified topics.

### `planPlaybook`
Creates actionable playbooks for strategic initiatives.

### `linkInsights`
Links related insights across different sources.

### `webSearch`
Performs web searches for additional context.

## Error Handling

All endpoints return structured errors:

```typescript
{
  error: {
    code: string; // e.g., 'UNAUTHORIZED', 'RATE_LIMITED', 'VALIDATION_ERROR'
    message: string;
    details?: any;
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMITED`: Rate limit exceeded
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input parameters
- `INTERNAL_ERROR`: Server error

## Fallback Strategies

### Bootstrap Fallback
If `workspace.bootstrap` fails, the dashboard falls back to:
1. Cached data from localStorage
2. Minimal static layout with retry prompt

### Chat Fallback
If streaming fails:
1. Retry with exponential backoff (max 3 attempts)
2. Fall back to non-streaming response
3. Show error with manual retry option

### Pipeline Fallback
If pipeline status check fails:
1. Show last known status from cache
2. Display "Status unavailable" with refresh option

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Bootstrap P95 | < 500ms | ~450ms |
| Chat start time | ≤ 2s | ~1.8s |
| Stream chunk latency | < 200ms | ~150ms |
| TRPC procedure P95 | < 300ms | ~280ms |

## Migration Notes

### Deprecated Endpoints
The following Midday finance endpoints have been removed:
- `/trpc/invoice.*`
- `/trpc/timer.*`
- `/trpc/expense.*`
- `/api/pdf-extract` (replaced by AI action)

### New Features
- Real-time chat streaming with tool execution
- Research-focused tool registry
- Canvas artifact generation
- Personalized insight feeds
- Pipeline status monitoring

## Security

### RBAC Matrix
| Role | Read | Write | Delete | Admin |
|------|------|-------|--------|-------|
| Owner | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✗ |
| Member | ✓ | ✓ | ✗ | ✗ |
| Viewer | ✓ | ✗ | ✗ | ✗ |

### Audit Events
All mutations trigger audit log events:
- `chat_message_created`
- `assistant_tool_called`
- `chat_feedback_submitted`
- `source_ingested`
- `playbook_executed`

## Support

For API issues or questions:
- GitHub Issues: https://github.com/zeke/api/issues
- Documentation: https://docs.zeke.ai/api
- Status Page: https://status.zeke.ai