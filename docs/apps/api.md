# API Application

Core backend server providing TRPC + REST endpoints.

## Overview

| Property | Value |
|----------|-------|
| Port | 3003 |
| Framework | Hono + TRPC |
| Entry | `apps/api/src/index.ts` |

## Quick Start

```bash
bun run dev:api  # Start on port 3003
```

## Endpoints

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health status |
| `GET /health/db` | Database connection check |
| `GET /health/pools` | Connection pool statistics |

### Documentation

| Endpoint | Description |
|----------|-------------|
| `GET /` | Scalar OpenAPI UI |
| `GET /openapi.json` | OpenAPI spec |

### TRPC

All TRPC routes available at `/trpc/*`.

## TRPC Routers

| Router | Purpose |
|--------|---------|
| `stories` | Story CRUD and queries |
| `highlights` | Highlight management |
| `chats` | Chat conversations |
| `team` | Team operations |
| `user` | User profile |
| `billing` | Stripe subscriptions |
| `trigger` | Manual job triggering |
| `search` | Full-text search |
| `notifications` | Notification management |
| `tags` | Content tagging |
| `apps` | OAuth app management |
| `apiKeys` | API key management |

## REST Routers

| Path | Purpose |
|------|---------|
| `/api/chat` | AI chat endpoint |
| `/api/stories` | Story REST API |
| `/api/highlights` | Highlight REST API |
| `/api/teams` | Team REST API |
| `/api/users` | User REST API |
| `/api/search` | Search endpoint |
| `/api/notifications` | Notification endpoints |
| `/api/oauth` | OAuth flows |
| `/api/transcription` | Audio transcription |
| `/api/trigger` | Job triggering |
| `/api/jobs/stream/:id` | SSE job status |

## Directory Structure

```
apps/api/src/
├── index.ts           # Entry point
├── ai/                # AI tools and prompts
│   ├── tools/         # AI function tools
│   └── prompts/       # System prompts
├── rest/              # REST API routers
│   └── routers/       # Hono routers
├── trpc/              # TRPC setup
│   ├── routers/       # TRPC routers
│   └── init.ts        # TRPC initialization
├── services/          # Business logic
├── schemas/           # Zod schemas
├── middleware/        # Hono middleware
└── utils/             # Utilities
```

## Authentication

Uses Better Auth with session-based authentication:

```typescript
// Protected TRPC procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { session: ctx.session } });
});
```

## AI Integration

AI tools available for chat:

```typescript
// apps/api/src/ai/tools/
├── get-highlights.ts    # Retrieve highlights
├── search-stories.ts    # Search content
├── create-highlight.ts  # Create new highlight
└── ...
```

## Environment Variables

```bash
# Required
PORT=3003
DATABASE_PRIMARY_URL=postgresql://...
AUTH_SECRET=your-32-char-secret
OPENAI_API_KEY=sk-proj-...
REDIS_URL=redis://localhost:6379

# Optional
ALLOWED_API_ORIGINS=http://localhost:3001
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_test_...
```

## Middleware

| Middleware | Purpose |
|------------|---------|
| CORS | Cross-origin requests |
| Rate Limiting | Request throttling |
| Auth | Session validation |
| Team Context | Team ID extraction |

## Error Handling

```typescript
// TRPC errors
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Story not found",
});

// REST errors (Hono)
throw new HTTPException(404, { message: "Not found" });
```

## Testing

```bash
cd apps/api
bun test                    # Run all tests
bun test src/path/file.ts   # Run specific test
```

## Related

- [Database Package](../packages/database.md)
- [Auth Package](../packages/auth.md)
- [Jobs Package](../packages/jobs.md)
