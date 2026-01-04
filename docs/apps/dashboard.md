# Dashboard Application

This is the product UI. If you are building user-facing workflows, you are here. If you need business logic, go to the API.

## Owns

- User workflows: discovery, reading, highlighting, chat, playbooks
- Team settings and billing UI
- Client-side state, routing, and UI components

## Does Not Own

- Data access rules (API owns them)
- Content ingestion (Engine owns that)

## Overview

| Property | Value |
|----------|-------|
| Port | 3001 |
| Framework | Next.js 15, React 19 |
| Entry | `apps/dashboard/src/app` |

## Quick Start

```bash
bun run dev:dashboard  # Start on port 3001
```

## Key Features

- **Story discovery**: browse and search content
- **AI chat**: ask questions against your content
- **Highlights**: create and organize notes
- **Playbooks**: run automations
- **Team management**: roles and settings
- **Billing**: Stripe subscription UI

## Tech Stack

| Library | Purpose |
|---------|---------|
| Next.js 15 | React framework |
| React 19 | UI library |
| TanStack Query | Server state |
| Zustand | Client state |
| TRPC Client | Type-safe API |
| nuqs | URL state management |
| Tailwind CSS | Styling |

## Directory Structure

```
apps/dashboard/src/
├── app/                  # Next.js App Router
│   ├── [locale]/         # i18n routes
│   │   ├── (app)/        # Authenticated routes
│   │   │   ├── (sidebar)/  # Routes with sidebar
│   │   │   └── (main)/     # Full-width routes
│   │   └── (public)/     # Public routes
│   └── api/              # API routes
├── components/           # React components
├── hooks/                # Custom hooks
├── actions/              # Server actions
├── lib/                  # Utilities
│   ├── trpc/             # TRPC client setup
│   └── nuqs/             # URL state config
├── store/                # Zustand stores
└── middleware.ts         # Auth middleware
```

## Routing

### App Routes

| Route | Description |
|-------|-------------|
| `/` | Home/dashboard |
| `/stories` | Story list |
| `/stories/[id]` | Story detail |
| `/insights` | Insights view |
| `/chat` | AI chat |
| `/playbooks` | Automation |
| `/settings` | User settings |
| `/team` | Team management |

### URL State

Uses `nuqs` for URL-first state management:

```typescript
const [storyId, setStoryId] = useQueryState("story");
// URL: /stories?story=123
```

## Components

### Key Components

| Component | Purpose |
|-----------|---------|
| `StoryCard` | Story display card |
| `HighlightEditor` | Rich text editor |
| `ChatInterface` | AI chat UI |
| `PlaybookRunner` | Playbook execution |
| `TeamSwitcher` | Team selection |

### UI Library

Uses `@zeke/ui` components:
```typescript
import { Button } from "@zeke/ui/button";
import { Card } from "@zeke/ui/card";
import { Dialog } from "@zeke/ui/dialog";
```

## Data Fetching

### TRPC Queries

```typescript
const { data: story } = trpc.stories.getById.useQuery({ id });
const { mutate: createHighlight } = trpc.highlights.create.useMutation();
```

### Server Actions

```typescript
// app/actions/stories.ts
"use server";
export async function getStory(id: string) {
  return db.query.stories.findFirst({ where: eq(stories.id, id) });
}
```

## State Management

### Zustand Stores

```typescript
// store/story-store.ts
export const useStoryStore = create((set) => ({
  selectedStory: null,
  setSelectedStory: (story) => set({ selectedStory: story }),
}));
```

### URL State

```typescript
// Shareable URLs with state
const [filters, setFilters] = useQueryStates({
  search: parseAsString,
  tag: parseAsString,
  status: parseAsStringLiteral(["all", "read", "unread"]),
});
```

## Real-time Updates

Uses WebSocket for live updates:

```typescript
import { useRealtime } from "@zeke/realtime/client";

useRealtime({
  channel: `story:${storyId}`,
  onMessage: (event) => {
    // Handle real-time update
  },
});
```

## Authentication

Middleware handles auth:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect("/login");
  }
}
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXT_PUBLIC_STORAGE_URL=http://localhost:9000

# Optional
NEXT_PUBLIC_REALTIME_WS_URL=ws://localhost:8080
NEXT_PUBLIC_SENTRY_DSN=...
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=...
```

## Build

```bash
bun run build          # Production build
bun run start          # Start production server
```

## Related

- [API Application](./api.md)
