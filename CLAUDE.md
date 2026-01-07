- READ ~/Projects/shorts-factory/agent-scripts/AGENTS.MD BEFORE ANYTHING (skip if missing).

# Zeke - AI Coding Assistant Context

AI-powered research intelligence platform. This document provides context for AI coding assistants.

## Quick Reference

| Item | Value |
|------|-------|
| Runtime | Bun |
| Package Manager | Bun (pnpm workspaces) |
| Language | TypeScript (strict) |
| Formatter | Biome |
| Test Runner | Bun test |

## Commands

```bash
# Development
bun dev                 # Start all apps
bun run dev:api         # API (port 3003)
bun run dev:dashboard   # Dashboard (port 3001)

# Build & Test
bun run build           # Build all
bun run typecheck       # TypeScript check
bun run lint            # Biome lint
bun run format          # Format code

# Database
cd packages/db
bun run migrate:dev     # Apply migrations
bun run migrate:studio  # Drizzle Studio

# Docker
docker compose up -d postgres redis minio
```

## Architecture

```
apps/
  api/           # Hono + TRPC (port 3003)
  dashboard/     # Next.js 15 (port 3001)
  engine/        # Content fetching (port 3010)
  website/       # Marketing (port 3000)

packages/
  db/            # Drizzle schema/queries
  jobs/          # pg-boss background tasks
  auth/          # Better Auth
  storage/       # MinIO client
  cache/         # Redis
  ui/            # React components
```

## Code Style

- **Formatter**: Biome (2 spaces)
- **Naming**: camelCase vars, PascalCase types
- **DB columns**: snake_case (mapped to camelCase)
- **Imports**: Use `@zeke/*` workspace packages
- **Tailwind**: Use `size-*` not `w-* h-*` for equal dimensions

## Key Patterns

### Database Queries
```typescript
import { db } from "@zeke/db/client";
import { stories, eq } from "@zeke/db/schema";

const story = await db.query.stories.findFirst({
  where: eq(stories.id, storyId),
});
```

### TRPC Router
```typescript
export const router = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // ctx.session, ctx.teamId available
    }),
});
```

### Background Job
```typescript
export const myTask = schemaTask({
  id: "my-task",
  schema: z.object({ itemId: z.string() }),
  queue: { concurrencyLimit: 5 },
  run: async (payload, { logger }) => {
    // Task logic
  },
});
```

### Error Handling
```typescript
// TRPC
throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });

// REST (Hono)
throw new HTTPException(404, { message: "Not found" });
```

## Documentation

Full documentation in `/docs`:

- [Getting Started](./docs/getting-started.md)
- [Architecture](./docs/architecture.md)
- [Development](./docs/development.md)
- [Deployment](./docs/deployment.md)

### Apps
- [API](./docs/apps/api.md) - TRPC + REST backend
- [Dashboard](./docs/apps/dashboard.md) - Next.js frontend
- [Engine](./docs/apps/engine.md) - Content ingestion
- [Website](./docs/apps/website.md) - Marketing site

### Packages
- [Database](./docs/packages/database.md) - Drizzle ORM
- [Jobs](./docs/packages/jobs.md) - pg-boss
- [Auth](./docs/packages/auth.md) - Better Auth
- [Storage](./docs/packages/storage.md) - MinIO
- [Cache](./docs/packages/cache.md) - Redis
- [UI](./docs/packages/ui.md) - Components
- [Utilities](./docs/packages/utilities.md) - Utils

## Testing

```bash
cd apps/api && bun test              # All tests
cd apps/api && bun test src/file.ts  # Single file
```

Uses Bun test runner with `bun:test` imports.

## Environment

Required variables:
```bash
DATABASE_PRIMARY_URL=postgresql://...
AUTH_SECRET=<32+ chars>
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
```

See `.env.example` for full list.

## Git

- Commit format: `type: description` (feat, fix, refactor, docs, chore)
- Run `bun run format && bun run lint` before committing
- Don't commit `.env` files
