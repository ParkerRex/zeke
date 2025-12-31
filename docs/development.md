# Development Guide

Workflows, commands, and best practices for Zeke development.

## Commands

### Development

```bash
bun dev                 # Start all apps
bun run dev:api         # API only (port 3003)
bun run dev:dashboard   # Dashboard only (port 3001)
bun run dev:website     # Website only (port 3000)
bun run dev:desktop     # Desktop app
```

### Build & Test

```bash
bun run build           # Build all apps
bun run typecheck       # TypeScript check
bun run lint            # Biome linter
bun run format          # Format code
bun test                # Run tests
```

### Database

```bash
cd packages/db
bun run db:generate     # Generate migration from schema
bun run migrate:dev     # Apply to local database
bun run migrate         # Apply to production
bun run migrate:studio  # Open Drizzle Studio
```

### Docker

```bash
docker compose up -d postgres redis minio  # Start services
docker compose down                        # Stop services
./deploy/run-local.sh                      # Full stack locally
```

## Code Style

### Formatting
- **Biome** for linting and formatting
- 2 spaces indentation
- Auto organize imports

```bash
bun run format  # Format all files
bun run lint    # Check for issues
```

### TypeScript
- Strict mode enabled
- NodeNext module resolution
- Target ES2022

### Naming
- **camelCase**: Variables, functions
- **PascalCase**: Components, types
- **snake_case**: Database columns (mapped to camelCase)

### Imports
```typescript
// Workspace packages
import { db } from "@zeke/db/client";
import { Button } from "@zeke/ui/button";

// Prefer specific imports
import { eq, and } from "drizzle-orm";
```

## Database Development

### Schema Changes

1. Edit `packages/db/src/schema.ts`
2. Generate migration:
   ```bash
   cd packages/db && bun run db:generate
   ```
3. Review generated SQL in `drizzle/`
4. Apply migration:
   ```bash
   bun run migrate:dev
   ```

### Query Functions

Add to `packages/db/src/queries/`:
```typescript
// packages/db/src/queries/stories.ts
export async function getStoryById(id: string) {
  return db.query.stories.findFirst({
    where: eq(stories.id, id),
    with: { highlights: true },
  });
}
```

## API Development

### TRPC Router

```typescript
// apps/api/src/trpc/routers/example.ts
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";

export const exampleRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // ctx.session, ctx.teamId available
      return { id: input.id };
    }),
});
```

### REST Endpoint

```typescript
// apps/api/src/rest/routers/example.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";

const app = new OpenAPIHono();

app.openapi(
  createRoute({
    method: "get",
    path: "/example/{id}",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: { description: "Success" },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    return c.json({ id });
  }
);
```

## Background Jobs

### Define Task

```typescript
// packages/jobs/src/tasks/example.ts
import { schemaTask } from "@jobs/schema-task";
import { z } from "zod";

export const exampleTask = schemaTask({
  id: "example-task",
  schema: z.object({
    itemId: z.string().uuid(),
  }),
  queue: { concurrencyLimit: 5 },
  run: async (payload, { logger }) => {
    logger.info("Processing", { itemId: payload.itemId });
    return { success: true };
  },
});
```

### Trigger Task

```typescript
import { sendJob } from "@zeke/jobs/client";

await sendJob("example-task", { itemId: "123" });
```

## Testing

### Unit Tests

```typescript
// src/example.test.ts
import { describe, it, expect } from "bun:test";

describe("example", () => {
  it("works", () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Run Tests

```bash
cd apps/api && bun test              # Run all
cd apps/api && bun test src/file.ts  # Run specific
```

## Debugging

### API Logs
```bash
# Structured JSON logs
bun run dev:api 2>&1 | bunx pino-pretty
```

### Database Queries
```bash
# Open Drizzle Studio
cd packages/db && bun run migrate:studio
```

### Job Queue
```sql
-- View recent jobs
SELECT * FROM pgboss.job ORDER BY createdon DESC LIMIT 20;

-- View failed jobs
SELECT * FROM pgboss.job WHERE state = 'failed';
```

## Git Workflow

### Commit Messages
```
type: description

Types: feat, fix, refactor, docs, chore, test
```

### Pre-commit
```bash
bun run format && bun run lint && bun run typecheck
```

## Environment Variables

See [.env.example](../.env.example) for all variables.

Critical ones:
- `DATABASE_PRIMARY_URL` - PostgreSQL connection
- `AUTH_SECRET` - Session signing (32+ chars)
- `OPENAI_API_KEY` - AI features
- `REDIS_URL` - Cache connection

## Troubleshooting

### Port Already in Use
```bash
lsof -i :3003  # Find process
kill -9 <PID>  # Kill it
```

### Database Connection
```bash
# Check PostgreSQL is running
docker compose ps
docker compose logs postgres
```

### Cache Issues
```bash
# Clear Redis
docker compose exec redis redis-cli FLUSHALL
```

### Type Errors
```bash
# Regenerate types
bun run typecheck
# Clear node_modules if needed
rm -rf node_modules && bun install
```
